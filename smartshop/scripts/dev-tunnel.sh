#!/usr/bin/env bash
# Public HTTPS URL via Cloudflare quick tunnel — best for iPhone camera trust.
# Prerequisite: npm run dev  (or this script starts it) + mood_api.py
set -euo pipefail
cd "$(dirname "$0")/.."

if ! curl -sf "http://127.0.0.1:3000" >/dev/null 2>&1; then
  echo "Starting Next on http://0.0.0.0:3000 ..."
  npx next dev --hostname 0.0.0.0 --port 3000 &
  DEV_PID=$!
  trap 'kill $DEV_PID 2>/dev/null || true' EXIT
  for i in {1..40}; do
    if curl -sf "http://127.0.0.1:3000" >/dev/null 2>&1; then
      break
    fi
    sleep 0.5
  done
fi

echo ""
echo "Starting Cloudflare tunnel (use the https://….trycloudflare.com URL on iPhone)"
echo "Keep mood API running locally: cd mood_model && python3 mood_api.py"
echo ""
exec npx --yes cloudflared tunnel --url http://127.0.0.1:3000
