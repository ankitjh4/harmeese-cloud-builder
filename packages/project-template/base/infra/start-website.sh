#!/usr/bin/env bash
set -euo pipefail

WEBSITE_PORT="${WEBSITE_PORT:-8080}"

if [ ! -f package.json ]; then
  echo "No package.json found. Run this from the generated website project root."
  exit 1
fi

WEBSITE_PORT="$WEBSITE_PORT" pnpm start
