#!/usr/bin/env bash
# Capture documentation screenshots of the Linked Lovelace flow from the live
# e2e demo. Output -> docs/imgs/e2e/. Brings HA up if it isn't already.
# Usage: ./scripts/screenshots.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
E2E="$ROOT/e2e"
HA_URL="${HA_URL:-http://localhost:8123}"

echo "==> Building card bundle"
( cd "$ROOT" && yarn build >/dev/null )

echo "==> Ensuring HA is running"
mkdir -p "$E2E/ha-config/www"
cp "$ROOT/dist/linked-lovelace-ui.js" "$E2E/ha-config/www/linked-lovelace-ui.js"
( cd "$E2E" && docker compose up -d )

echo "==> Waiting for Home Assistant at $HA_URL"
for i in $(seq 1 60); do
  code="$(curl -s -o /dev/null -w '%{http_code}' "$HA_URL/" || true)"
  if [ "$code" = "200" ] || [ "$code" = "302" ]; then echo "    HA up (HTTP $code)"; break; fi
  sleep 5
done

echo "==> Capturing screenshots"
( cd "$E2E" && yarn install --silent && npx playwright install chromium >/dev/null 2>&1 || true )
( cd "$E2E" && HA_URL="$HA_URL" npx playwright test -c playwright.screenshots.config.ts )

echo "==> Screenshots written to docs/imgs/e2e/"
ls -1 "$ROOT/docs/imgs/e2e"
