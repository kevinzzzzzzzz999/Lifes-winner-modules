#!/usr/bin/env python3
"""Read-only structural/signature/dependency checks for a packaged .app."""
import argparse
import json
from pathlib import Path
import plistlib
import re
import subprocess


def command(*args):
    return subprocess.run([str(a) for a in args], capture_output=True, text=True)


def inspect_macho(file, flag):
    # otool treats a filename ending in '(Renderer)' as an archive member.
    # An inherited descriptor avoids that parser ambiguity without changing code.
    with file.open('rb') as binary:
        return subprocess.run(['/usr/bin/otool', flag, '/dev/fd/' + str(binary.fileno())], pass_fds=(binary.fileno(),), capture_output=True, text=True)


def audit(bundle):
    bundle = bundle.resolve(strict=True)
    executable = bundle / 'Contents/MacOS/DocumentWorkbench'
    files = []
    for file in bundle.rglob('*'):
        if file.is_symlink():
            if not file.exists() or not file.resolve().is_relative_to(bundle):
                raise ValueError('Broken or escaping link')
        elif file.is_file():
            with file.open('rb') as stream:
                magic = stream.read(4)
            if magic in (b'\xcf\xfa\xed\xfe', b'\xfe\xed\xfa\xcf', b'\xca\xfe\xba\xbe', b'\xbe\xba\xfe\xca'):
                files.append(file)
    executable_dirs = [executable.parent] + [f.parent for f in files if f.parent.name == 'MacOS']
    rpaths = []
    code = []
    for file in files:
        result = inspect_macho(file, '-l')
        if result.returncode:
            raise RuntimeError('Cannot inspect Mach-O')
        paths = re.findall(r'cmd LC_RPATH\s+cmdsize \d+\s+path (.*?) \(offset', result.stdout)
        for value in paths:
            if value.startswith('@loader_path'):
                rpaths.append(file.parent / value.removeprefix('@loader_path/'))
            elif value.startswith('@executable_path'):
                rpaths.extend(directory / value.removeprefix('@executable_path/') for directory in executable_dirs)
            elif value.startswith('/usr/lib/') or value.startswith('/System/Library/'):
                pass
            else:
                raise ValueError('Unexpected runtime search path')
        code.append((file, paths))
    rows = []
    external = []
    for file, paths in code:
        result = inspect_macho(file, '-L')
        if result.returncode:
            raise RuntimeError('Cannot inspect Mach-O dependencies')
        dependencies = []
        for line in result.stdout.splitlines()[1:]:
            value = line.strip().split(' (compatibility version', 1)[0]
            if value.startswith('/System/Library/') or value.startswith('/usr/lib/'):
                status = 'macOS-system'
            else:
                candidates = []
                if value.startswith('@rpath/'):
                    candidates = [directory / value.removeprefix('@rpath/') for directory in rpaths]
                elif value.startswith('@loader_path/'):
                    candidates = [file.parent / value.removeprefix('@loader_path/')]
                elif value.startswith('@executable_path/'):
                    candidates = [directory / value.removeprefix('@executable_path/') for directory in executable_dirs]
                found = [candidate.resolve() for candidate in candidates if candidate.exists() and candidate.resolve().is_relative_to(bundle)]
                if not found:
                    external.append({'code': str(file.relative_to(bundle)), 'dependency': value})
                    status = 'unresolved'
                else:
                    status = 'bundled'
            dependencies.append({'load': value, 'resolution': status})
        rows.append({'path': str(file.relative_to(bundle)), 'rpaths': paths, 'dependencies': dependencies})
    if external:
        raise ValueError('Unresolved non-system dependencies: ' + json.dumps(external))
    verify = command('/usr/bin/codesign', '--verify', '--deep', '--strict', bundle)
    display = command('/usr/bin/codesign', '-dvvv', '--entitlements', '-', bundle)
    if verify.returncode or 'Signature=adhoc' not in display.stderr or 'TeamIdentifier=not set' not in display.stderr:
        raise ValueError('Bundle is not valid identity-free ad hoc signed code')
    info = plistlib.loads((bundle / 'Contents/Info.plist').read_bytes())
    if any(key in info for key in ('CFBundleURLTypes', 'CFBundleDocumentTypes')):
        raise ValueError('This build must not claim system associations')
    payload = bundle / 'Contents/Resources/app'
    excluded = {'node_modules', 'test', 'tests', 'playwright', '.git', '__pycache__', 'e2e.cjs', 'package-lock.json', '.env', '.DS_Store'}
    forbidden = [str(f.relative_to(bundle)) for f in payload.rglob('*') if f.name in excluded]
    if forbidden:
        raise ValueError('Development/runtime-private data in payload: ' + json.dumps(forbidden))
    return {'status': 'passed', 'bundle': bundle.name, 'signature': 'valid ad hoc, no TeamIdentifier or certificate', 'deepStrictVerification': 'passed', 'systemAssociations': 'not declared or changed', 'machoCount': len(rows), 'dependencies': rows, 'nonSystemLibraries': 'all bundled inside this application', 'sourceDevelopmentTools': 'none in application payload', 'bundleInfo': {key: info[key] for key in ('CFBundleIdentifier', 'CFBundleName', 'CFBundleDisplayName', 'CFBundleExecutable', 'CFBundleShortVersionString', 'LSMinimumSystemVersion')}}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--app', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    result = audit(args.app)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'status': result['status'], 'machoCount': result['machoCount'], 'dependencies': 'self-contained plus macOS system libraries', 'signature': 'ad hoc; no personal identity'}))
