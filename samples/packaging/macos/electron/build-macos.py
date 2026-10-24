#!/usr/bin/env python3
"""Build a private-identity-free Mac .app from reviewed source and Electron 44.3.0.

Python standard library only. Inputs are explicit directories; no account,
keychain, full-App data directory, system-default association or user profile
is read. Run on macOS; codesign and ditto are system tools. No upload occurs.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import plistlib
import re
import shutil
import struct
import subprocess

ELECTRON_VERSION = '44.3.0'
APP_VERSION = '0.1.0'
PRODUCT_NAME = '文档工作台'
EXECUTABLE_NAME = 'DocumentWorkbench'
BUNDLE_ID = 'org.inkspace.modules.documentworkbench'
ROOT = Path(__file__).resolve().parent


def app_version(value):
    if not re.fullmatch(r'(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)', value):
        raise argparse.ArgumentTypeError('Expected a numeric semantic version such as 0.1.0 (no prefix, leading zero, suffix or whitespace)')
    return value


def sha256(file):
    digest = hashlib.sha256()
    with file.open('rb') as source:
        while block := source.read(1024 * 1024):
            digest.update(block)
    return digest.hexdigest()


def run(*args):
    result = subprocess.run([str(arg) for arg in args], capture_output=True, text=True)
    if result.returncode:
        # Avoid embedding a local build path in public receipts.
        raise RuntimeError(Path(str(args[0])).name + ' failed: ' + result.stderr.rsplit('\n', 2)[-2])
    return result


def macho_arch(file):
    with file.open('rb') as binary:
        header = binary.read(8)
    if header[:4] != b'\xcf\xfa\xed\xfe':
        raise ValueError('Expected an official thin 64-bit Electron Mach-O')
    cpu = struct.unpack('<I', header[4:8])[0]
    return {0x0100000C: 'arm64', 0x01000007: 'x64'}.get(cpu, 'unsupported')


def check_links(bundle):
    root = bundle.resolve()
    links = []
    for file in bundle.rglob('*'):
        if file.is_symlink():
            target = os.readlink(file)
            if os.path.isabs(target) or not file.resolve().is_relative_to(root) or not file.exists():
                raise ValueError('Broken or escaping bundle symlink: ' + str(file.relative_to(bundle)))
            links.append({'path': str(file.relative_to(bundle)), 'target': target})
    return links


def sign_bundle(bundle):
    # Sign innermost standalone code first; never use personal identities.
    macho = []
    for file in bundle.rglob('*'):
        if file.is_file() and not file.is_symlink():
            with file.open('rb') as binary:
                magic = binary.read(4)
            if magic in (b'\xcf\xfa\xed\xfe', b'\xfe\xed\xfa\xcf', b'\xca\xfe\xba\xbe', b'\xbe\xba\xfe\xca'):
                macho.append(file)
    for file in sorted(macho, key=lambda p: len(p.parts), reverse=True):
        relative = file.relative_to(bundle)
        identifier = BUNDLE_ID + '.code.' + hashlib.sha256(str(relative).encode()).hexdigest()[:16]
        run('/usr/bin/codesign', '--force', '--sign', '-', '--timestamp=none', '--identifier', identifier, file)
    nested = [p for p in bundle.rglob('*') if p.is_dir() and not p.is_symlink() and p.suffix in ('.app', '.framework', '.xpc')]
    for item in sorted(nested, key=lambda p: len(p.parts), reverse=True):
        run('/usr/bin/codesign', '--force', '--sign', '-', '--timestamp=none', item)
    run('/usr/bin/codesign', '--force', '--sign', '-', '--timestamp=none', bundle)
    run('/usr/bin/codesign', '--verify', '--deep', '--strict', '--verbose=2', bundle)
    return [str(file.relative_to(bundle)) for file in macho]


def write_plist(file, info):
    with file.open('wb') as output:
        plistlib.dump(info, output, sort_keys=True)


def build(args):
    source = args.source.resolve(strict=True)
    runtime = args.runtime.resolve(strict=True)
    destination = args.output.resolve()
    if destination.exists():
        raise ValueError('Output already exists; choose an empty output directory')
    if (runtime / 'version').read_text().strip() != ELECTRON_VERSION:
        raise ValueError('Runtime is not the pinned Electron ' + ELECTRON_VERSION)
    original = runtime / 'Electron.app'
    if macho_arch(original / 'Contents/MacOS/Electron') != args.arch:
        raise ValueError('Runtime architecture does not match --arch')
    expected = json.loads((ROOT / 'application-shell-source-sha256.json').read_text())
    for relative, checksum in expected.items():
        file = source / relative
        if file.is_symlink() or sha256(file) != checksum:
            raise ValueError('Source differs from the reviewed release: ' + relative)
    destination.mkdir(parents=True)
    bundle = destination / (PRODUCT_NAME + '.app')
    run('/usr/bin/ditto', '--norsrc', '--noextattr', original, bundle)
    contents = bundle / 'Contents'
    resources = contents / 'Resources'
    for name in ('default_app.asar', 'app', 'app.asar'):
        file = resources / name
        if file.is_dir():
            shutil.rmtree(file)
        elif file.exists():
            file.unlink()
    app_source = resources / 'app'
    app_source.mkdir()
    selected = ['index.cjs', 'LICENSE'] + [name for name in expected if name.startswith('lib/')]
    selected += ['examples/electron/main.cjs', 'examples/electron/preload.cjs', 'examples/electron/ui/index.html', 'examples/electron/ui/renderer.js', 'examples/electron/ui/styles.css']
    payload_records = []
    for relative in selected:
        file = app_source / relative
        file.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source / relative, file)
        payload_records.append({'path': relative, 'originalSHA256': expected[relative]})
    (app_source / 'package.json').write_text(json.dumps({'name': 'inkspace-document-workbench', 'productName': PRODUCT_NAME, 'version': args.version, 'private': True, 'license': 'MIT', 'author': 'InkSpace contributors', 'main': 'examples/electron/main.cjs'}, ensure_ascii=False, indent=2) + '\n')
    # Presentation-only overlay. File and IPC business logic are unchanged.
    main = app_source / 'examples/electron/main.cjs'
    main.write_text(main.read_text().replace("app.setName('Application Shell Demo')", "app.setName('文档工作台')").replace("title:'Application Shell Demo'", "title:'文档工作台'"))
    html = app_source / 'examples/electron/ui/index.html'
    text = html.read_text().replace('<title>Application Shell Demo</title>', '<title>文档工作台</title>').replace('<strong>Application Shell</strong>', '<strong>文档工作台</strong>')
    text = text.replace('Read-only shell demo · UTF-8 previews up to 512 KiB · Editors can be connected through the exported host API.', '只读文本预览 · UTF-8 文件上限 512 KiB · Read-only text preview.')
    text = text.replace('<p id="status"', (ROOT / 'overlay/help-fragment.html').read_text() + '<p id="status"')
    html.write_text(text)
    renderer = app_source / 'examples/electron/ui/renderer.js'
    renderer.write_text(renderer.read_text().replace('This binary document needs a host editor. 本文件需要接入专用编辑器。', '当前支持文本预览；此类型请用适合的软件打开。 Text previews are supported here; open this file type in a suitable application.'))
    css = app_source / 'examples/electron/ui/styles.css'
    css.write_text(css.read_text() + '\n' + (ROOT / 'overlay/help-styles.css').read_text())
    licenses = resources / 'Licenses'
    licenses.mkdir(exist_ok=True)
    shutil.copyfile(source / 'LICENSE', licenses / 'LICENSE-InkSpace-MIT.txt')
    shutil.copyfile(runtime / 'LICENSE', licenses / 'LICENSE-Electron.txt')
    shutil.copyfile(runtime / 'LICENSES.chromium.html', licenses / 'LICENSES-Chromium.html')
    shutil.copyfile(ROOT / 'overlay/ICON-LICENSE.txt', licenses / 'LICENSE-Icon.txt')
    shutil.copyfile(ROOT / 'overlay/DocumentWorkbench.icns', resources / 'DocumentWorkbench.icns')
    help_text = (ROOT / 'overlay/使用说明.txt').read_text().replace('版本 0.1.0 ·', '版本 ' + args.version + ' ·')
    (resources / '使用说明.txt').write_text(help_text)
    (destination / '使用说明.txt').write_text(help_text)
    # Brand the main bundle and all standard Electron helpers consistently.
    info_file = contents / 'Info.plist'
    info = plistlib.loads(info_file.read_bytes())
    for key in list(info):
        if key.startswith('DT') or key.endswith('UsageDescription') or key in ('ElectronAsarIntegrity', 'NSAppTransportSecurity'):
            del info[key]
    info.update(CFBundleName=EXECUTABLE_NAME, CFBundleDisplayName=PRODUCT_NAME, CFBundleIdentifier=BUNDLE_ID, CFBundleExecutable=EXECUTABLE_NAME, CFBundleIconFile='DocumentWorkbench.icns', CFBundleShortVersionString=args.version, CFBundleVersion=args.version, LSApplicationCategoryType='public.app-category.productivity', NSHumanReadableCopyright='InkSpace contributors · MIT License')
    write_plist(info_file, info)
    (contents / 'MacOS/Electron').rename(contents / ('MacOS/' + EXECUTABLE_NAME))
    helpers = []
    for helper in sorted((contents / 'Frameworks').glob('Electron Helper*.app')):
        old = helper.stem
        new = old.replace('Electron', EXECUTABLE_NAME, 1)
        plist_file = helper / 'Contents/Info.plist'
        helper_info = plistlib.loads(plist_file.read_bytes())
        suffix = helper_info.get('CFBundleIdentifier', 'com.github.Electron.helper').replace('com.github.Electron', '')
        for key in list(helper_info):
            if key.startswith('DT'):
                del helper_info[key]
        helper_info.update(CFBundleName=new, CFBundleDisplayName=new, CFBundleExecutable=new, CFBundleIdentifier=BUNDLE_ID + suffix, CFBundleShortVersionString=args.version, CFBundleVersion=args.version)
        write_plist(plist_file, helper_info)
        (helper / ('Contents/MacOS/' + old)).rename(helper / ('Contents/MacOS/' + new))
        helper.rename(helper.with_name(new + '.app'))
        helpers.append(new + '.app')
    links = check_links(bundle)
    code = sign_bundle(bundle)
    for record in payload_records:
        record['packagedSHA256'] = sha256(app_source / record['path'])
        record['presentationOverlay'] = record['packagedSHA256'] != record['originalSHA256']
    receipt = {'product': PRODUCT_NAME, 'bundle': bundle.name, 'version': args.version, 'architecture': args.arch, 'electronVersion': ELECTRON_VERSION, 'minimumMacOS': info['LSMinimumSystemVersion'], 'runtimeNode': 'embedded in Electron; no external Node installation', 'sourceFilesVerified': len(expected), 'payload': payload_records, 'helpers': helpers, 'machoCodeSigned': code, 'symlinks': links, 'signing': 'ad hoc only; no personal certificate/Team/Apple account', 'notarization': 'not performed; Gatekeeper may require system approval or block Internet download', 'runtimeDevelopmentTools': 'none: no Playwright, npm, tests, node_modules, source snapshots, original App data or logs', 'systemAssociations': 'no registration or default changes', 'sourceOverlay': 'only product/window title, user-facing presentation strings, static onboarding HTML/CSS, product icon and bundle metadata', 'licenses': ['MIT', 'Electron', 'Chromium third-party', 'icon MIT']}
    (destination / 'build-receipt.json').write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'status': 'built', 'bundle': bundle.name, 'architecture': args.arch, 'signedMachO': len(code), 'verifiedSymlinks': len(links)}, ensure_ascii=False))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--version', type=app_version, default=APP_VERSION, help='Numeric semantic application version, default: 0.1.0')
    parser.add_argument('--source', type=Path, required=True, help='Reviewed application-shell package directory')
    parser.add_argument('--runtime', type=Path, required=True, help='Official extracted Electron distribution directory (Electron.app, version, LICENSE)')
    parser.add_argument('--output', type=Path, required=True, help='New destination directory')
    parser.add_argument('--arch', choices=['arm64', 'x64'], required=True)
    build(parser.parse_args())
