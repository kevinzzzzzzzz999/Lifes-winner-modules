#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-run}"
APP_NAME="InkSpacePreferencesDemo"
BUNDLE_ID="com.example.inkspace.preferencesdemo"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="${INKSPACE_PREFERENCES_BUILD_DIR:-$ROOT_DIR/.build}"
DIST_DIR="${INKSPACE_PREFERENCES_DIST_DIR:-$ROOT_DIR/dist}"
APP_BUNDLE="$DIST_DIR/$APP_NAME.app"
FLAGS=()
if [[ "${INKSPACE_SWIFTPM_DISABLE_SANDBOX:-0}" == "1" ]]; then FLAGS+=(--disable-sandbox); fi
pkill -x "$APP_NAME" >/dev/null 2>&1 || true
swift build --package-path "$ROOT_DIR" --scratch-path "$BUILD_DIR" "${FLAGS[@]}"
BUILD_BINARY="$(swift build --package-path "$ROOT_DIR" --scratch-path "$BUILD_DIR" --show-bin-path "${FLAGS[@]}")/$APP_NAME"
mkdir -p "$APP_BUNDLE/Contents/MacOS"
cp "$BUILD_BINARY" "$APP_BUNDLE/Contents/MacOS/$APP_NAME"
chmod +x "$APP_BUNDLE/Contents/MacOS/$APP_NAME"
cat >"$APP_BUNDLE/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleExecutable</key><string>$APP_NAME</string>
<key>CFBundleIdentifier</key><string>$BUNDLE_ID</string>
<key>CFBundleName</key><string>$APP_NAME</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>LSMinimumSystemVersion</key><string>13.0</string>
<key>NSPrincipalClass</key><string>NSApplication</string>
</dict></plist>
PLIST
# Bind this generated bundle's metadata/resources to its own ad-hoc signature.
# No Apple account, certificate, private key or notarization is used.
/usr/bin/codesign --force --sign - "$APP_BUNDLE"
case "$MODE" in
  run) /usr/bin/open -n "$APP_BUNDLE" ;;
  --debug|debug) lldb -- "$APP_BUNDLE/Contents/MacOS/$APP_NAME" ;;
  --logs|logs|--telemetry|telemetry)
    /usr/bin/open -n "$APP_BUNDLE"
    /usr/bin/log stream --info --style compact --predicate "process == \"$APP_NAME\""
    ;;
  --verify|verify)
    /usr/bin/open -n "$APP_BUNDLE"
    sleep 1
    pgrep -x "$APP_NAME" >/dev/null
    ;;
  *) echo "usage: $0 [run|--debug|--logs|--telemetry|--verify]" >&2; exit 2 ;;
esac
