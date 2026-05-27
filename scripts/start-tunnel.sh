#!/bin/bash

# Navigate to the project root directory
cd "$(dirname "$0")/.." || exit

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
  echo "=========================================================="
  echo "❌ Error: cloudflared is not installed!"
  echo "=========================================================="
  echo "This tool is required to expose your local Mac server to the internet"
  echo "so your iPhone can access it securely."
  echo ""
  echo "💡 You can install it using Homebrew:"
  echo "   brew install cloudflared"
  echo ""
  echo "Or download it from:"
  echo "   https://github.com/cloudflare/cloudflared/releases"
  echo "=========================================================="
  exit 1
fi

echo "=========================================================="
echo "☁️  Cloudflare Tunnel Launcher (trycloudflare.com)"
echo "=========================================================="
echo "📝 Instructions:"
echo "1. Wait for Cloudflare to assign a random domain name."
echo "2. Look for a line in the logs containing:"
echo "   https://xxxx.trycloudflare.com"
echo "3. Copy that HTTPS address."
echo "4. Keep this terminal running, open a NEW terminal window, and run:"
echo "   npm run update-url https://xxxx.trycloudflare.com"
echo "5. Open the copied URL on your iPhone Safari to load your store!"
echo "=========================================================="
echo "⏳ Starting Cloudflare Tunnel on http://localhost:8085..."
echo "To terminate the tunnel, press [Ctrl + C]"
echo "=========================================================="

cloudflared tunnel --url http://localhost:8085
