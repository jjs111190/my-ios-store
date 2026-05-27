#!/bin/bash

# Navigate to the project root directory
cd "$(dirname "$0")/.." || exit

# Try to get the local network IP address of the Mac
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || ifconfig | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}' | head -n 1)

echo "=========================================================="
echo "📱 JaeSeok Private iOS App Store Server"
echo "=========================================================="
echo "🌐 Local Access:   http://localhost:8085"
if [ -n "$LOCAL_IP" ]; then
  echo "📶 Wi-Fi Access:   http://$LOCAL_IP:8085"
else
  echo "⚠️  Wi-Fi Access:   Could not determine local IP. Ensure you're connected."
fi
echo "=========================================================="
echo "💡 Tip: Make sure to make this script executable using:"
echo "   chmod +x scripts/start-server.sh"
echo "=========================================================="
echo "⏳ Starting server on port 8085..."
echo "To terminate the server, press [Ctrl + C]"
echo "=========================================================="

npm run serve
