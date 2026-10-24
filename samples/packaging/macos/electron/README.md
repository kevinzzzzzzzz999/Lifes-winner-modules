# Document Workbench macOS packaging / 文档工作台 Mac 打包

This recipe creates ordinary `.app` downloads with Electron 44.3.0 built in. End users do not install Node.js, npm, Python or Xcode. / 本配方生成自带 Electron 的 Mac 应用，使用者无需安装开发工具。

Only the source/overlay/official runtimes become the application. Tests, Playwright, npm, source snapshots, logs, user configuration and original InkSpace data are excluded. The source package stays unchanged. `application-shell-source-sha256.json` verifies the 25 reviewed source files; only product/title, static onboarding HTML/CSS and icon are overlaid. The renderer's binary-file message and footer use ordinary user language. The core, renderer business logic and preload remain identical to the accepted module.

## CI / developer build

Requirements for builders: macOS, Python 3 standard library, Apple's system `ditto`/`codesign`, and `otool` (available on macOS CI runners). No Developer ID, Apple account or keychain access is required. A clean GitHub `macos-26` runner can run:

```sh
python3 samples/packaging/macos/electron/release-macos.py \
  --source packages/application-shell \
  --version 0.1.0 \
  --output "$RUNNER_TEMP/document-workbench-release"
```

Outputs:

- `document-workbench-macos-arm64.zip` — Apple Silicon Macs.
- `document-workbench-macos-x64.zip` — Intel Macs.
- `SHA256SUMS.txt` and `document-workbench-release.json`.
- Per-architecture structural/dependency audit JSON, build directories and official runtime inputs under the explicit output directory. Publish only the ZIPs, SHA sums and reviewed generic receipts.

`--version` defaults to `0.1.0` and accepts strictly three numeric semantic-version components (for example `0.2.0`), without `v`, leading zeros, whitespace or suffixes. It updates the app/helper Info.plist, packaged package.json, help version and release manifest; the pinned Electron runtime version stays `44.3.0`.

The script downloads fixed official GitHub release assets and their official SHA-256 manifest, verifies each archive, builds and brands the application, signs all nested Mach-O/framework/helper code ad hoc, audits runtime dependencies, creates a sorted standard ZIP with a fixed 1980 timestamp and explicit directory 755 / regular 755-or-644 / relative-symlink 777 modes (no extra fields, comments, UID, xattrs or source times), extracts it again and verifies the delivered app's signature. It does not upload anything or register file/protocol defaults. No local cache path is assumed.

Alternatively supply an already extracted official runtime explicitly:

```sh
python3 samples/packaging/macos/electron/build-macos.py \
  --source packages/application-shell \
  --runtime /path/to/verified/electron-darwin-arm64 \
  --arch arm64 \
  --version 0.1.0 \
  --output /path/to/new/DocumentWorkbench-macos-arm64
```

The two `/path/to/` values are builder-chosen placeholders. The runtime directory must contain official `Electron.app`, `version`, `LICENSE` and `LICENSES.chromium.html`; version and Mach-O architecture are checked. Keep those input paths out of published logs.

For optional developer GUI QA, use a separately installed official Playwright 1.62.1 package; it is never shipped in the app:

```sh
node samples/packaging/macos/electron/smoke-packaged.cjs \
  --app /path/to/DocumentWorkbench-macos-arm64/文档工作台.app \
  --output /path/to/qa-output \
  --playwright /path/to/developer-only/node_modules/playwright
```

This starts the packaged executable with a clean system-only PATH and temporary HOME, verifies no external Node is found, shows the real window/onboarding, and reads only a new synthetic document through the real OS-open event adapter. Native picker UI is not automated. The earlier 25 core tests/12 rendered interaction groups are reused only after exact source SHA comparison.

## Trust and privacy boundary

Ad hoc signatures contain no person's certificate, Developer ID, TeamIdentifier, Apple account or notarization ticket. Structural signature validation is separate from Gatekeeper trust. **This is not a notarized zero-warning release:** Internet downloads may be blocked or need macOS Privacy & Security approval. No quarantine is removed and Gatekeeper is never disabled. Do not claim otherwise.

The app is a read-only local document/workspace shell, not the complete InkSpace editor collection. UTF-8 previews are limited to 512 KiB; other file types should be opened with suitable software. Each window has separate grants; a chosen file grants only itself. Nothing is uploaded, no account is required, and workspace history is not persisted. MIT/Electron/Chromium/icon notices are retained in the bundle. See the included bilingual onboarding text.

Official references: [Electron manual packaging](https://www.electronjs.org/docs/latest/tutorial/application-distribution), [Electron signing](https://www.electronjs.org/docs/latest/tutorial/code-signing), [Electron release 44.3.0](https://github.com/electron/electron/releases/tag/v44.3.0).
