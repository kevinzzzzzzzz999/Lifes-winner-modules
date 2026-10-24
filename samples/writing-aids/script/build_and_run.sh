#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-run}"
APP_NAME="WritingAidsDemo"
BUNDLE_ID="org.inkspace.examples.writing-aids"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="${WRITING_AIDS_DIST_DIR:-$ROOT_DIR/dist}"
APP_BUNDLE="$DIST_DIR/$APP_NAME.app"
APP_MACOS="$APP_BUNDLE/Contents/MacOS"
# Override this when building a read-only source checkout.
BUILD_DIR="${WRITING_AIDS_BUILD_DIR:-$ROOT_DIR/.build}"

pkill -x "$APP_NAME" >/dev/null 2>&1 || true
swift build --package-path "$ROOT_DIR" --scratch-path "$BUILD_DIR" --product "$APP_NAME"
BUILD_BINARY="$(swift build --package-path "$ROOT_DIR" --scratch-path "$BUILD_DIR" --show-bin-path)/$APP_NAME"
mkdir -p "$APP_MACOS"
cp "$BUILD_BINARY" "$APP_MACOS/$APP_NAME"
chmod +x "$APP_MACOS/$APP_NAME"
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
# Refresh the bundle seal after copying the executable and writing its metadata.
# Ad-hoc signing is local and needs no Apple account or developer certificate.
/usr/bin/codesign --force --sign - "$APP_BUNDLE"
case "$MODE" in
  run) /usr/bin/open -n "$APP_BUNDLE" ;;
  --verify|verify) /usr/bin/open -n "$APP_BUNDLE"; sleep 1; pgrep -x "$APP_NAME" >/dev/null ;;
  --debug|debug) lldb -- "$APP_MACOS/$APP_NAME" ;;
  --logs|logs) /usr/bin/open -n "$APP_BUNDLE"; /usr/bin/log stream --info --style compact --predicate "process == \"$APP_NAME\"" ;;
  --telemetry|telemetry) /usr/bin/open -n "$APP_BUNDLE"; /usr/bin/log stream --info --style compact --predicate "subsystem == \"$BUNDLE_ID\"" ;;
  *) echo "usage: $0 [run|--verify|--debug|--logs|--telemetry]" >&2; exit 2 ;;
esac
