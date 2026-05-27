#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p logs pids

screen -S ios-store -X quit >/dev/null 2>&1 || true
pkill -f "scripts/serve-private.mjs" >/dev/null 2>&1 || true
pkill -f "cloudflared.*http://localhost:8085" >/dev/null 2>&1 || true
sleep 1

rm -f public-url.txt
screen -dmS ios-store /bin/bash -lc "cd /Users/jaeseok/Desktop/my-ios-store && /opt/homebrew/bin/node scripts/external-daemon.mjs"

echo "Private server and Cloudflare tunnel started in a detached screen session."
echo "Waiting for Cloudflare public URL..."

for _ in {1..60}; do
  if [ -s public-url.txt ]; then
    URL="$(cat public-url.txt | tr -d '\n')"
    echo "Public URL: $URL"
    exit 0
  fi
  sleep 1
done

echo "Still waiting. Check logs/cloudflared.log and logs/external-daemon.log"
exit 1
