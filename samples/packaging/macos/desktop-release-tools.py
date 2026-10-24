#!/usr/bin/env python3
"""Archive, validate and smoke-test self-contained Mac tools. Build machine only."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import plistlib
import re
import signal
import stat
import subprocess
import tempfile
import time
import zipfile


def run(command, **kwargs):
    result = subprocess.run([str(x) for x in command], capture_output=True, text=True, **kwargs)
    if result.returncode:
        raise RuntimeError(Path(str(command[0])).name + ' failed')
    return result.stdout + result.stderr


def sha(path):
    value = hashlib.sha256()
    with path.open('rb') as file:
        while chunk := file.read(1024 * 1024):
            value.update(chunk)
    return value.hexdigest()


def audit_native(app):
    with (app / 'Contents/Info.plist').open('rb') as file:
        info = plistlib.load(file)
    binary = app / 'Contents/MacOS' / info['CFBundleExecutable']
    assert binary.is_file() and binary.stat().st_mode & 0o111
    assert info['LSMinimumSystemVersion'] == '13.0'
    assert set(run(['/usr/bin/lipo', '-archs', binary]).split()) == {'arm64', 'x86_64'}
    signing = run(['/usr/bin/codesign', '-dvvv', app])
    assert 'Signature=adhoc' in signing and 'TeamIdentifier=not set' in signing
    run(['/usr/bin/codesign', '--verify', '--deep', '--strict', app])
    for line in run(['/usr/bin/otool', '-L', binary]).splitlines():
        if '(compatibility version' in line:
            dependency = line.strip().split(' (', 1)[0]
            assert dependency.startswith(('/System/Library/', '/usr/lib/')), 'External runtime dependency'
    for path in app.rglob('*'):
        if path.is_symlink():
            path.resolve().relative_to(app.resolve())
        elif path.is_file():
            assert path.suffix not in {'.swift', '.log', '.dSYM', '.p12', '.mobileprovision'}
            data = path.read_bytes()
            for prefix in [str(Path.home()).encode(), b'/private/tmp/', b'/private/var/folders/']:
                assert prefix not in data, 'Build path in delivered native file'
    return {'app': app.name, 'architectures': ['arm64', 'x86_64'], 'minimumMacOS': '13.0',
            'signature': 'ad hoc; no personal identity', 'notarized': False,
            'onlySystemRuntimeDependencies': True, 'executableSHA256': sha(binary)}


def zip_native(args):
    args.output.mkdir(parents=True, exist_ok=True)
    artifacts = []
    for title, filename in [("Life's winner Writing", 'InkSpace-Writing-macos-universal.zip'),
                            ("Life's winner Preferences", 'InkSpace-Preferences-macos-universal.zip')]:
        app = args.input / (title + '.app')
        info = audit_native(app)
        output = args.output / filename
        if output.exists():
            raise ValueError('Use a new asset output directory')
        members = [(path, Path(app.name) / path.relative_to(app)) for path in sorted(app.rglob('*'))
                   if path.is_file() or path.is_symlink()]
        members += [(args.input / 'START HERE - 使用帮助.html', Path('开始使用 - Start Here.html')),
                    (args.input / 'LICENSE.txt', Path('LICENSE.txt'))]
        with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
            for source, relative in members:
                entry = zipfile.ZipInfo(relative.as_posix(), (1980, 1, 1, 0, 0, 0))
                entry.create_system = 3
                if source.is_symlink():
                    source.resolve().relative_to(app.resolve())
                    link = os.readlink(source)
                    assert not os.path.isabs(link)
                    payload = link.encode('utf-8')
                    entry.external_attr = (stat.S_IFLNK | 0o777) << 16
                else:
                    payload = source.read_bytes()
                    mode = 0o755 if source.stat().st_mode & 0o111 else 0o644
                    entry.external_attr = (stat.S_IFREG | mode) << 16
                entry.compress_type = zipfile.ZIP_DEFLATED
                archive.writestr(entry, payload)
        with tempfile.TemporaryDirectory(prefix='native-zip-check-') as temporary:
            run(['/usr/bin/ditto', '-x', '-k', output, temporary])
            run(['/usr/bin/codesign', '--verify', '--deep', '--strict', Path(temporary) / app.name])
        artifacts.append({'file': filename, 'bytes': output.stat().st_size, 'sha256': sha(output), **info,
                          'externalXcodeRequired': False, 'externalNodeRequired': False,
                          'archiveSignatureRoundTrip': 'passed'})
    (args.output / 'native-apps-release.json').write_text(json.dumps({'artifacts': artifacts}, indent=2) + '\n')
    print(json.dumps({'nativeArchives': len(artifacts), 'verified': True}))


def smoke_native(args):
    args.output.mkdir(parents=True, exist_ok=True)
    environment = os.environ.copy()
    environment['PATH'] = '/usr/bin:/bin:/usr/sbin:/sbin'
    environment['HOME'] = str(args.output / 'home')
    Path(environment['HOME']).mkdir()
    for key in list(environment):
        if key.startswith(('DYLD_', 'SWIFT_')) or key in {'DEVELOPER_DIR', 'NODE_PATH', 'NODE_OPTIONS', 'GH_TOKEN', 'GITHUB_TOKEN'}:
            environment.pop(key, None)
    records = []
    for title, filename in [("Life's winner Writing", 'InkSpace-Writing-macos-universal.zip'),
                            ("Life's winner Preferences", 'InkSpace-Preferences-macos-universal.zip')]:
        destination = args.output / title
        run(['/usr/bin/ditto', '-x', '-k', args.assets / filename, destination])
        app = destination / (title + '.app')
        info = audit_native(app)
        with (app / 'Contents/Info.plist').open('rb') as file:
            metadata = plistlib.load(file)
        binary = app / 'Contents/MacOS' / metadata['CFBundleExecutable']
        if title.endswith('Preferences'):
            store = args.output / 'synthetic-settings.json'
            for flag in ['--self-test', '--verify-persistence']:
                run([binary, flag, store], env=environment, timeout=30)
        log = args.output / (metadata['CFBundleExecutable'] + '.log')
        with log.open('wb') as output:
            command = [str(binary)]
            if title.endswith('Preferences'):
                command += ['--store', str(args.output / 'synthetic-window-settings.json')]
            process = subprocess.Popen(command, env=environment, stdout=output, stderr=subprocess.STDOUT, start_new_session=True)
            try:
                time.sleep(4)
                assert process.poll() is None, 'Native application exited during startup'
            finally:
                if process.poll() is None:
                    os.killpg(process.pid, signal.SIGTERM)
                process.wait(timeout=15)
        records.append({'app': app.name, 'systemOnlyPATH': True, 'processStarted': True,
                        'externalNodeOrXcodeUsed': False, 'architectures': info['architectures'],
                        'persistenceCLI': title.endswith('Preferences')})
    report = {'hostArchitecture': run(['/usr/bin/uname', '-m']).strip(), 'passed': True,
              'scope': 'Native startup and preference persistence; interactive GUI QA is recorded separately.', 'apps': records}
    (args.output / 'native-smoke.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report))


def make_manifest(args):
    native = json.loads((args.native / 'native-apps-release.json').read_text())['artifacts']
    electron = json.loads((args.electron / 'document-workbench-release.json').read_text())['artifacts']
    args.output.mkdir(parents=True, exist_ok=True)
    rows = []
    import shutil
    for entry in native + electron:
        source = (args.native if entry in native else args.electron) / entry['file']
        target = args.output / source.name
        shutil.copy2(source, target)
        assert sha(target) == entry['sha256']
        rows.append(entry)
    for filename in ['native-apps-release.json', 'document-workbench-release.json']:
        shutil.copy2((args.native if filename.startswith('native') else args.electron) / filename, args.output / filename)
    version = args.version
    assert re.fullmatch(r'(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)', version)
    manifest = {'schemaVersion': 1, 'version': version, 'sourceCommit': os.environ.get('GITHUB_SHA', ''),
                'personalSigningIdentityUsed': False, 'notarized': False, 'artifacts': rows}
    (args.output / 'desktop-apps.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    (args.output / 'SHA256SUMS.txt').write_text(''.join(row['sha256'] + '  ' + row['file'] + '\n' for row in rows))
    print(json.dumps({'desktopAssets': len(rows), 'version': version}))


parser = argparse.ArgumentParser(description=__doc__)
commands = parser.add_subparsers(dest='command', required=True)
p = commands.add_parser('zip-native'); p.add_argument('--input', type=Path, required=True); p.add_argument('--output', type=Path, required=True); p.set_defaults(function=zip_native)
p = commands.add_parser('smoke-native'); p.add_argument('--assets', type=Path, required=True); p.add_argument('--output', type=Path, required=True); p.set_defaults(function=smoke_native)
p = commands.add_parser('manifest'); p.add_argument('--native', type=Path, required=True); p.add_argument('--electron', type=Path, required=True); p.add_argument('--output', type=Path, required=True); p.add_argument('--version', required=True); p.set_defaults(function=make_manifest)
arguments = parser.parse_args()
arguments.function(arguments)
