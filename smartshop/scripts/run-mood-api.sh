#!/usr/bin/env bash
# Start the local mood inference API on http://127.0.0.1:8001
set -euo pipefail
cd "$(dirname "$0")/../mood_model"

PORT="${MOOD_API_PORT:-8001}"
HOST="${MOOD_API_HOST:-127.0.0.1}"

if [[ ! -d .venv ]]; then
  echo "Missing mood_model/.venv — run: npm run setup"
  exit 1
fi

if curl -sf "http://${HOST}:${PORT}/health" >/dev/null 2>&1; then
  echo "Mood API already running at http://${HOST}:${PORT} — nothing to start."
  exit 0
fi

if lsof -nP -iTCP:"${PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port ${PORT} is in use, but /health did not respond."
  echo "Stop the other process, then retry:"
  echo "  lsof -nP -iTCP:${PORT} -sTCP:LISTEN"
  exit 1
fi

# shellcheck disable=SC1091
source .venv/bin/activate
exec python mood_api.py
