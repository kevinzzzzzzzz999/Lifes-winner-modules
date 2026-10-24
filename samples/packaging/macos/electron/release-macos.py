#!/usr/bin/env python3
"""Download verified official Electron 44.3.0 runtimes and build standalone ZIPs.

Build/developer command for macOS (including clean macos-26 CI runners).
The resulting .app requires neither Python, Node.js, npm nor Xcode to use.
Only GitHub's official Electron release assets are downloaded. No credentials,
signing identities, Apple account, original App profile or telemetry are used.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import stat
import struct
import subprocess
import sys
import tempfile
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parent
VERSION = '44.3.0'
BASE = 'https://github.com/electron/electron/releases/download/v' + VERSION + '/'


def app_version(value):
    if not re.fullmatch(r'(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)', value):
        raise argparse.ArgumentTypeError('Expected a numeric semantic version such as 0.1.0 (no prefix, leading zero, suffix or whitespace)')
    return value


def digest(file):
    value = hashlib.sha256()
    with file.open('rb') as source:
        while chunk := source.read(1024 * 1024):
            value.update(chunk)
    return value.hexdigest()


def execute(*args):
    result = subprocess.run([str(a) for a in args], capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(Path(str(args[0])).name + ' failed with exit status ' + str(result.returncode))
    return result


def fetch(name, target):
    # urllib follows official GitHub release asset redirects; no auth is sent.
    request = urllib.request.Request(BASE + name, headers={'User-Agent': 'InkSpace-open-source-release'})
    with urllib.request.urlopen(request, timeout=180) as response, target.open('wb') as output:
        while chunk := response.read(1024 * 1024):
            output.write(chunk)



def archive_tree(directory, archive):
    """Fixed-metadata Unix ZIP, preserving only bytes, modes and safe links."""
    directory = directory.resolve(strict=True)
    if archive.resolve().is_relative_to(directory):
        raise ValueError('Archive output must be outside the input directory')
    timestamp = (1980, 1, 1, 0, 0, 0)
    with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9, strict_timestamps=True) as output:
        output.comment = b''
        files = [directory] + sorted(directory.rglob('*'), key=lambda p: p.relative_to(directory).as_posix())
        for file in files:
            name = directory.name
            if file != directory:
                name += '/' + file.relative_to(directory).as_posix()
            info = zipfile.ZipInfo(name, date_time=timestamp)
            info.create_system = 3
            info.extra = b''
            info.comment = b''
            if file.is_symlink():
                target = os.readlink(file)
                if os.path.isabs(target) or not file.exists() or not file.resolve().is_relative_to(directory):
                    raise ValueError('Broken or escaping relative symlink')
                info.external_attr = (stat.S_IFLNK | 0o777) << 16
                info.compress_type = zipfile.ZIP_STORED
                output.writestr(info, os.fsencode(target))
            elif file.is_dir():
                info.filename += '/'
                info.external_attr = ((stat.S_IFDIR | 0o755) << 16) | 0x10
                info.compress_type = zipfile.ZIP_STORED
                output.writestr(info, b'')
            elif file.is_file():
                size = file.stat().st_size
                if size * 1.05 > zipfile.ZIP64_LIMIT:
                    raise ValueError('Single file exceeds the metadata-free ZIP size limit')
                permissions = 0o755 if file.stat().st_mode & 0o111 else 0o644
                info.external_attr = (stat.S_IFREG | permissions) << 16
                info.compress_type = zipfile.ZIP_DEFLATED
                info.file_size = size
                with file.open('rb') as source, output.open(info, 'w') as destination:
                    shutil.copyfileobj(source, destination, length=1024 * 1024)
            else:
                raise ValueError('Only regular files, directories and relative symlinks can be archived')
    # Check the emitted directory records, not just the requested attributes.
    with zipfile.ZipFile(archive) as check:
        if check.comment or any(item.extra or item.comment or item.date_time != timestamp for item in check.infolist()):
            raise ValueError('Unexpected ZIP metadata')
        with archive.open('rb') as raw:
            for item in check.infolist():
                raw.seek(item.header_offset)
                header = raw.read(30)
                if header[:4] != b'PK\x03\x04' or len(header) != 30 or struct.unpack_from('<H', header, 28)[0]:
                    raise ValueError('Unexpected ZIP local extra field')


def release(args):
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    archs = args.arch or ['arm64', 'x64']
    if len(set(archs)) != len(archs):
        raise ValueError('Duplicate architecture')
    # All download/cache/build work stays under an explicit output directory.
    work = output / 'build-inputs'
    work.mkdir(exist_ok=True)
    sums = work / 'SHASUMS256.txt'
    fetch('SHASUMS256.txt', sums)
    checksums = {line.split()[1].lstrip('*'): line.split()[0] for line in sums.read_text().splitlines() if len(line.split()) == 2}
    artifacts = []
    for arch in archs:
        name = 'electron-v' + VERSION + '-darwin-' + arch + '.zip'
        archive = work / name
        if not archive.exists() or digest(archive) != checksums[name]:
            fetch(name, archive)
        if digest(archive) != checksums[name]:
            raise ValueError('Official runtime checksum mismatch')
        runtime = work / ('electron-' + arch)
        if runtime.exists():
            shutil.rmtree(runtime)
        runtime.mkdir()
        execute('/usr/bin/ditto', '-x', '-k', archive, runtime)
        directory = output / ('DocumentWorkbench-macos-' + arch)
        if directory.exists():
            raise ValueError('Existing build output; use a fresh output directory')
        execute(sys.executable, ROOT / 'build-macos.py', '--source', args.source.resolve(), '--runtime', runtime, '--output', directory, '--arch', arch, '--version', args.version)
        app = directory / '文档工作台.app'
        audit = output / ('document-workbench-macos-' + arch + '-audit.json')
        execute(sys.executable, ROOT / 'audit-macos.py', '--app', app, '--output', audit)
        zip_name = 'document-workbench-macos-' + arch + '.zip'
        zip_file = output / zip_name
        archive_tree(directory, zip_file)
        # Ensure delivery preserves signed resources and framework symlinks.
        with tempfile.TemporaryDirectory(prefix='verify-zip-', dir=output) as scratch:
            execute('/usr/bin/ditto', '-x', '-k', zip_file, scratch)
            restored = Path(scratch) / directory.name / app.name
            execute('/usr/bin/codesign', '--verify', '--deep', '--strict', restored)
            payload = restored / 'Contents/Resources/app'
            if (payload / 'node_modules').exists():
                raise ValueError('Development dependencies in delivered ZIP')
        artifacts.append({'file': zip_name, 'architecture': arch, 'version': args.version, 'sha256': digest(zip_file), 'bytes': zip_file.stat().st_size, 'electron': VERSION, 'officialRuntimeSHA256': checksums[name], 'runtimeSource': BASE + name, 'app': app.name, 'minimumMacOS': '13.0', 'signature': 'ad hoc, no personal identity', 'notarized': False, 'gatekeeper': 'not expected to be trusted without user approval; no quarantine/system protection changes', 'archiveSignatureRoundTrip': 'passed', 'archiveMetadata': 'fixed 1980 timestamp; explicit 755/644/777 Unix modes; no extra/comment/UID/xattr', 'externalNodeRequired': False, 'externalXcodeRequired': False})
    manifest = {'schemaVersion': 1, 'product': "life'winner 文档工作台 / life'winner Document Workbench", 'version': args.version, 'sourceRecipe': 'build-macos.py + application-shell-source-sha256.json + overlay/', 'checksumSource': BASE + 'SHASUMS256.txt', 'artifacts': artifacts}
    (output / 'document-workbench-release.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    (output / 'SHA256SUMS.txt').write_text(''.join(item['sha256'] + '  ' + item['file'] + '\n' for item in artifacts))
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--version', type=app_version, default='0.1.0', help='Numeric semantic application version, default: 0.1.0')
    parser.add_argument('--source', type=Path, required=True, help='Reviewed application-shell source directory')
    parser.add_argument('--output', type=Path, required=True, help='Explicit directory for all build inputs, .app folders, ZIPs and receipts')
    parser.add_argument('--arch', choices=['arm64', 'x64'], action='append', help='Repeat for desired architectures; default: both')
    release(parser.parse_args())
