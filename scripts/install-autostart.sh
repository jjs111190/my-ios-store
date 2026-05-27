#!/bin/bash
set -euo pipefail

SOURCE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DEPLOY_DIR="$HOME/Library/Application Support/JaeSeokPrivateStore"
LABEL="com.jaeseok.private-ios-store"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"

mkdir -p "$DEPLOY_DIR" "$HOME/Library/LaunchAgents"

echo "Stopping existing foreground/background store processes..."
screen -S ios-store -X quit >/dev/null 2>&1 || true
pkill -f "scripts/external-daemon.mjs" >/dev/null 2>&1 || true
pkill -f "scripts/serve-private.mjs" >/dev/null 2>&1 || true
pkill -f "cloudflared.*http://localhost:8085" >/dev/null 2>&1 || true
launchctl bootout "gui/$(id -u)" "$PLIST" >/dev/null 2>&1 || true

echo "Syncing store files to: $DEPLOY_DIR"
rsync -a --delete \
  --exclude ".git" \
  --exclude ".DS_Store" \
  --exclude "build" \
  --exclude "logs" \
  --exclude "pids" \
  --exclude "store-verified.png" \
  "$SOURCE_DIR/" "$DEPLOY_DIR/"

mkdir -p "$DEPLOY_DIR/logs" "$DEPLOY_DIR/pids"
chmod +x "$DEPLOY_DIR"/scripts/*.sh
rm -f "$DEPLOY_DIR/public-url.txt"

cat > "$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/opt/homebrew/bin/node</string>
    <string>$DEPLOY_DIR/scripts/external-daemon.mjs</string>
  </array>
  <key>WorkingDirectory</key>
  <string>$DEPLOY_DIR</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>$DEPLOY_DIR/logs/launchd.out.log</string>
  <key>StandardErrorPath</key>
  <string>$DEPLOY_DIR/logs/launchd.err.log</string>
</dict>
</plist>
PLIST

echo "Starting login auto-start service..."
launchctl bootstrap "gui/$(id -u)" "$PLIST"
launchctl kickstart -k "gui/$(id -u)/$LABEL"

echo "Waiting for public Cloudflare URL..."
for _ in {1..90}; do
  if [ -s "$DEPLOY_DIR/public-url.txt" ]; then
    URL="$(tr -d '\n' < "$DEPLOY_DIR/public-url.txt")"
    echo "$URL" > "$SOURCE_DIR/public-url.txt"
    echo "Public URL: $URL"
    exit 0
  fi
  sleep 1
done

echo "Auto-start service is running, but the public URL was not detected yet."
echo "Check: $DEPLOY_DIR/logs/cloudflared.log"
exit 1
