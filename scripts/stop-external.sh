#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

screen -S ios-store -X quit >/dev/null 2>&1 || true
pkill -f "scripts/external-daemon.mjs" >/dev/null 2>&1 || true
pkill -f "scripts/serve-private.mjs" >/dev/null 2>&1 || true
pkill -f "cloudflared.*http://localhost:8085" >/dev/null 2>&1 || true

rm -f pids/external-daemon.pid pids/server.pid pids/cloudflared.pid
echo "External daemon stopped."
