#!/usr/bin/env bash
# Records the captioned Linked Lovelace demo video against a real Home Assistant:
#   build card -> copy bundle into HA www -> start HA -> record -> mp4
# Usage: ./scripts/video.sh
#   KEEP_UP=1 ./scripts/video.sh   # leave HA running afterwards
# Output: docs_site/images/linked-lovelace-demo.mp4 (plus the raw .webm next to it)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
E2E="$ROOT/e2e"
OUT_DIR="${OUT_DIR:-$ROOT/docs_site/images}"
HA_URL="${HA_URL:-http://localhost:8123}"

echo "==> Building card bundle"
( cd "$ROOT" && bun run build >/dev/null )

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

echo "==> Recording"
rm -rf "$E2E/test-results"
( cd "$E2E" && bun install >/dev/null && npx playwright install chromium >/dev/null 2>&1 || true )
set +e
( cd "$E2E" && HA_URL="$HA_URL" npx playwright test --config playwright.video.config.ts )
status=$?
set -e

webm="$(find "$E2E/test-results" -name '*.webm' | head -1)"
if [ -z "$webm" ]; then echo "    no video produced" >&2; exit "${status:-1}"; fi

mkdir -p "$OUT_DIR"
cp "$webm" "$OUT_DIR/linked-lovelace-demo.webm"
if command -v ffmpeg >/dev/null 2>&1; then
  echo "==> Converting to mp4"
  ffmpeg -y -loglevel error -i "$webm" -c:v libx264 -pix_fmt yuv420p -crf 23 \
    -movflags +faststart "$OUT_DIR/linked-lovelace-demo.mp4"
  echo "    $OUT_DIR/linked-lovelace-demo.mp4"
else
  echo "    ffmpeg not found; keeping webm only"
fi

if [ "${KEEP_UP:-0}" != "1" ]; then
  echo "==> Tearing down Home Assistant"
  ( cd "$E2E" && docker compose down )
fi

exit $status
