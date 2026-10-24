#!/usr/bin/env python3
"""Build standalone Universal Mac tools from the two public Swift samples.

Requires Xcode/Swift and Python only on the build machine. End users need neither.
No signing identity, Apple account, notarization upload or network dependency is used.
"""
import argparse
import hashlib
from html.parser import HTMLParser
import json
import plistlib
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
HELP_COMMAND = '''.commands { CommandGroup(replacing: .help) {
    Button("使用帮助 / Help") { DistributionHelp.show() }
} }'''


class HelpText(HTMLParser):
    def __init__(self):
        super().__init__(); self.parts = []; self.hidden = 0
    def handle_starttag(self, tag, attrs):
        if tag in ("style", "script", "title"): self.hidden += 1
        if tag in ("h1", "h2", "p", "article"): self.parts.append("\n\n")
        if tag == "a":
            href = dict(attrs).get("href")
            if href: self.parts.append(href + " — ")
    def handle_endtag(self, tag):
        if tag in ("style", "script", "title"): self.hidden -= 1
    def handle_data(self, data):
        if not self.hidden: self.parts.append(data)


def run(args, log=None):
    result = subprocess.run([str(x) for x in args], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    if log:
        Path(log).write_text(result.stdout)
    if result.returncode:
        raise RuntimeError(f"Command failed: {args[0]}; see build logs in the work directory")
    return result.stdout.strip()


def replace(path, old, new):
    text = path.read_text()
    if old not in text:
        raise RuntimeError(f"Sample changed; review the distribution overlay for {path.name}")
    path.write_text(text.replace(old, new))


def prepare(repo, work):
    modules = work / "InkSpaceModules"
    for name in ["InkSpaceWritingAids", "InkSpacePreferences"]:
        shutil.copytree(repo / "swift/Sources" / name, modules / "Sources" / name, dirs_exist_ok=True)
    (modules / "Package.swift").write_text('''// swift-tools-version: 5.9
import PackageDescription
let package = Package(name: "InkSpaceModules", platforms: [.macOS(.v13)], products: [
 .library(name: "InkSpaceWritingAids", targets: ["InkSpaceWritingAids"]),
 .library(name: "InkSpacePreferences", targets: ["InkSpacePreferences"])], targets: [
 .target(name: "InkSpaceWritingAids"), .target(name: "InkSpacePreferences")])
''')
    for sample, dest in [("writing-aids", "Writing"), ("preferences", "Preferences")]:
        target = work / dest
        target.mkdir(exist_ok=True)
        shutil.copy2(repo / "samples" / sample / "Package.swift", target / "Package.swift")
        shutil.copytree(repo / "samples" / sample / "Sources", target / "Sources", dirs_exist_ok=True)
        shutil.copytree(repo / "samples" / sample / "Tests", target / "Tests", dirs_exist_ok=True)
        replace(target / "Package.swift", 'path: "../.."', 'path: "../InkSpaceModules"')
        app_target = "WritingAidsDemo" if sample == "writing-aids" else "InkSpacePreferencesDemo"
        shutil.copy2(HERE / "overlays/DistributionHelp.swift", target / "Sources" / app_target / "DistributionHelp.swift")
    writing = work / "Writing/Sources/WritingAidsDemo/App/WritingAidsApp.swift"
    replace(writing, 'WindowGroup("Writing Aids Playground")', 'WindowGroup("Life\'s winner · 书写画板")')
    replace(writing, '.commands { CommandGroup(replacing: .newItem) {} }', HELP_COMMAND)
    preferences = work / "Preferences/Sources/InkSpacePreferencesDemo"
    app = preferences / "App/PreferencesDemoApp.swift"
    replace(app, 'import SwiftUI', 'import SwiftUI\nimport AppKit')
    replace(app, 'file = FileManager.default.temporaryDirectory.appendingPathComponent("InkSpacePreferencesDemo/settings.json")',
            'file = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appendingPathComponent("InkSpace Preferences/settings.json")')
    replace(app, 'WindowGroup("Preferences Demo")', 'WindowGroup("Life\'s winner · 偏好方案编辑器")')
    replace(app, '.frame(minWidth: 640, minHeight: 640) }', '.frame(minWidth: 900, minHeight: 680) }\n        ' + HELP_COMMAND)
    replace(app, '.frame(width: 720, height: 680)', '.frame(width: 900, height: 680)')
    replace(app, 'struct PreferencesDemoApp: App {', '''final class PreferencesDistributionDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.regular); NSApp.activate(ignoringOtherApps: true)
    }
}
struct PreferencesDemoApp: App {
    @NSApplicationDelegateAdaptor(PreferencesDistributionDelegate.self) private var delegate''')
    replace(preferences / "Stores/PreferencesModel.swift", '"com.example.inkspace.preferencesdemo"', '"org.inkspace.tools.preferences"')
    view = preferences / "Views/PreferencesSettingsView.swift"
    replace(view, 'Text(l("独立偏好设置", "Independent preferences"))', 'Text(l("Life\'s winner · 偏好方案编辑器", "Life\'s winner preference plans"))')
    replace(view, '"示例数据保存在独立文件中。修改后点保存，再重新读取验证。", "Synthetic data in a separate file. Save changes, then reload to verify."',
            '"只管理本工具的独立方案，不修改系统或原 Life\'s winner。修改后点保存。", "Edits this tool’s own plan, not macOS or the original Life\'s winner settings. Save to keep changes."')
    replace(view, 'Text(PreferencesLocalizer.text("emptyTitle", language: language))',
            'Text(l("可保存与分享的独立方案", "A plan you can save and share"))')
    replace(view, 'Text(PreferencesLocalizer.text("emptyBody", language: language))',
            'Text(l("这里只编辑方案数据，不会打开笔记，也不会应用到系统或其他软件。", "Edits plan data only; it does not open notes or apply settings to other apps."))')
    replace(view, 'HStack {\n                Text(model.status)', 'HStack {\n                PlanTransferControls(model: model)\n                Text(model.status)')
    shutil.copy2(HERE / "overlays/PlanTransferControls.swift", preferences / "Views/PlanTransferControls.swift")


def build_product(work, package, product, arch):
    scratch = work / "build" / f"{package}-{arch}"
    args = ["swift", "build", "--build-system", "native", "--package-path", work / package,
            "--scratch-path", scratch, "--configuration", "release", "--product", product,
            "--triple", f"{arch}-apple-macosx13.0", "--disable-index-store", "-debug-info-format", "none", "-j", "2"]
    # The source/work location and user-home prefixes must never be embedded in a release.
    for prefix, mapped in [(str(work), "/source"), (str(Path.home()), "/builder"), ("/Applications/Xcode.app", "/toolchain")]:
        args += ["-Xswiftc", "-file-prefix-map", "-Xswiftc", f"{prefix}={mapped}",
                 "-Xswiftc", "-debug-prefix-map", "-Xswiftc", f"{prefix}={mapped}",
                 "-Xcc", f"-ffile-prefix-map={prefix}={mapped}", "-Xcc", f"-fdebug-prefix-map={prefix}={mapped}"]
    args += ["-Xswiftc", "-file-compilation-dir", "-Xswiftc", "/source"]
    run(args, work / f"{package}-{arch}.log")
    candidates = [p for p in scratch.rglob(product) if p.is_file() and p.parent.name == "release"]
    if len(candidates) != 1:
        raise RuntimeError(f"Expected one release executable for {product}/{arch}")
    return candidates[0]


def bundle(repo, work, output, config, binaries, version):
    app = output / (config["name"] + ".app")
    if app.exists():
        raise RuntimeError("Refusing to replace an existing app; choose a new output directory")
    macos, resources = app / "Contents/MacOS", app / "Contents/Resources"
    macos.mkdir(parents=True); resources.mkdir()
    executable = macos / config["executable"]
    run(["/usr/bin/lipo", "-create", *binaries, "-output", executable])
    executable.chmod(0o755)
    run(["/usr/bin/strip", "-S", "-x", executable])
    # Swift may add a development-toolchain fallback search path. Only system
    # or bundle-relative runtime search locations belong in a distributable app.
    commands = run(["/usr/bin/otool", "-l", executable])
    rpaths = []
    in_rpath = False
    for line in commands.splitlines():
        if line.strip() == "cmd LC_RPATH":
            in_rpath = True
        elif in_rpath:
            match = re.match(r"\s*path (.*?) \(offset", line)
            if match:
                rpaths.append(match.group(1)); in_rpath = False
    removed = sorted({path for path in rpaths if path.startswith("/")
                      and not path.startswith(("/usr/lib/", "/System/Library/"))})
    for path in removed:
        run(["/usr/bin/install_name_tool", "-delete_rpath", path, executable])
    iconset = work / (config["kind"] + ".iconset")
    run(["swift", HERE / "DrawToolIcon.swift", config["kind"], iconset], work / (config["kind"] + "-icon.log"))
    run(["/usr/bin/iconutil", "-c", "icns", "-o", resources / "ToolIcon.icns", iconset])
    shutil.copy2(HERE / "HELP.html", resources / "HELP.html")
    help_text = HelpText(); help_text.feed((HERE / "HELP.html").read_text())
    (resources / "HELP.txt").write_text(re.sub(r"\n{3,}", "\n\n", "".join(help_text.parts)).strip() + "\n")
    shutil.copy2(repo / "LICENSE", resources / "LICENSE.txt")
    info = {"CFBundleExecutable": config["executable"], "CFBundleIdentifier": config["id"],
            "CFBundleName": config["menuName"], "CFBundleDisplayName": config["display"],
            "CFBundlePackageType": "APPL", "CFBundleShortVersionString": version, "CFBundleVersion": "1",
            "CFBundleIconFile": "ToolIcon", "CFBundleDevelopmentRegion": "en", "CFBundleLocalizations": ["en", "zh-Hans"],
            "LSMinimumSystemVersion": "13.0", "NSPrincipalClass": "NSApplication", "NSHighResolutionCapable": True,
            "NSHumanReadableCopyright": "Copyright © 2026 InkSpace contributors. MIT license."}
    with (app / "Contents/Info.plist").open("wb") as file:
        plistlib.dump(info, file)
    for locale, name in [("en", config["menuName"]), ("zh-Hans", config["display"])]:
        folder = resources / (locale + ".lproj"); folder.mkdir()
        (folder / "InfoPlist.strings").write_text(f'"CFBundleName" = "{name}";\n"CFBundleDisplayName" = "{name}";\n')
    run(["/usr/bin/codesign", "--force", "--sign", "-", "--timestamp=none", app], work / (config["kind"] + "-sign.log"))
    run(["/usr/bin/codesign", "--verify", "--strict", "--verbose=2", app], work / (config["kind"] + "-verify.log"))
    architecture = run(["/usr/bin/lipo", "-archs", executable])
    if set(architecture.split()) != {"arm64", "x86_64"}:
        raise RuntimeError("Universal binary validation failed")
    return {"app": app.name, "architectures": architecture.split(), "minimumOS": "13.0",
            "signing": "ad-hoc; no Apple identity or notarization", "buildRpathsRemoved": bool(removed),
            "sha256": hashlib.sha256(executable.read_bytes()).hexdigest()}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path, default=HERE.parents[2])
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--work", type=Path)
    parser.add_argument("--version", default="0.1.0")
    args = parser.parse_args()
    repo, output = args.repo.resolve(), args.output.resolve()
    work = args.work.resolve() if args.work else Path(tempfile.mkdtemp(prefix="inkspace-native-build-"))
    work.mkdir(parents=True, exist_ok=True); output.mkdir(parents=True, exist_ok=True)
    prepare(repo, work)
    configs = [{"package": "Writing", "product": "WritingAidsDemo", "executable": "InkSpaceWriting", "kind": "writing",
                "name": "Life's winner Writing", "menuName": "Life's winner Writing", "display": "Life's winner · 书写画板", "id": "org.inkspace.tools.writing"},
               {"package": "Preferences", "product": "InkSpacePreferencesDemo", "executable": "InkSpacePreferences", "kind": "preferences",
                "name": "Life's winner Preferences", "menuName": "Life's winner Preferences", "display": "Life's winner · 偏好方案编辑器", "id": "org.inkspace.tools.preferences"}]
    receipt = {"recipeVersion": 1, "version": args.version, "configuration": "release", "pathMapping": True,
               "debugInfo": "none; stripped", "SDK": run(["xcrun", "--sdk", "macosx", "--show-sdk-version"]),
               "toolchain": run(["swift", "--version"]).splitlines()[0], "apps": []}
    for config in configs:
        binaries = [build_product(work, config["package"], config["product"], arch) for arch in ["arm64", "x86_64"]]
        receipt["apps"].append(bundle(repo, work, output, config, binaries, args.version))
    shutil.copy2(HERE / "HELP.html", output / "START HERE - 使用帮助.html")
    shutil.copy2(repo / "LICENSE", output / "LICENSE.txt")
    (output / "build-manifest.json").write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(receipt, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
