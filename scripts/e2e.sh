#!/usr/bin/env bash
# One-shot Linked Lovelace e2e runner:
#   build card -> copy bundle into HA www -> start HA -> wait healthy -> run Playwright
# Usage: ./scripts/e2e.sh [extra playwright args]
#   KEEP_UP=1 ./scripts/e2e.sh   # leave HA running after the suite
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
E2E="$ROOT/e2e"
HA_URL="${HA_URL:-http://localhost:8123}"

echo "==> Building card bundle"
( cd "$ROOT" && yarn build >/dev/null )

echo "==> Copying bundle into HA www"
mkdir -p "$E2E/ha-config/www"
cp "$ROOT/dist/linked-lovelace-ui.js" "$E2E/ha-config/www/linked-lovelace-ui.js"

echo "==> Starting Home Assistant (docker compose)"
( cd "$E2E" && docker compose up -d )

echo "==> Waiting for Home Assistant at $HA_URL"
for i in $(seq 1 60); do
  code="$(curl -s -o /dev/null -w '%{http_code}' "$HA_URL/" || true)"
  if [ "$code" = "200" ] || [ "$code" = "302" ]; then echo "    HA up (HTTP $code)"; break; fi
  sleep 5
  if [ "$i" = "60" ]; then echo "    HA did not become ready" >&2; exit 1; fi
done

echo "==> Ensuring Playwright deps"
( cd "$E2E" && yarn install --silent && npx playwright install chromium >/dev/null 2>&1 || true )

echo "==> Running Playwright e2e"
set +e
( cd "$E2E" && HA_URL="$HA_URL" npx playwright test "$@" )
status=$?
set -e

if [ "${KEEP_UP:-0}" != "1" ]; then
  echo "==> Tearing down Home Assistant"
  ( cd "$E2E" && docker compose down )
fi

exit $status
