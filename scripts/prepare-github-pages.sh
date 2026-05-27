#!/bin/bash
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: npm run prepare:github -- https://USERNAME.github.io/REPOSITORY"
  exit 1
fi

npm run update-url "$1"

echo ""
echo "GitHub Pages static store is ready."
echo "Commit and push these files, then enable GitHub Pages for the repository."
