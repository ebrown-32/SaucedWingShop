#!/bin/sh
# Concatenate source parts into the single playable index.html
cd "$(dirname "$0")"
cat src/00-head.html src/10-core.js src/20-env.js src/30-actors.js src/40-game.js src/90-tail.html > index.html
echo "Built index.html ($(wc -l < index.html | tr -d ' ') lines)"
