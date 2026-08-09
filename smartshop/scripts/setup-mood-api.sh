#!/usr/bin/env bash
# Create mood_model/.venv and install API runtime deps.
set -euo pipefail
cd "$(dirname "$0")/../mood_model"

if [[ ! -d .venv ]]; then
  python3 -m venv .venv
fi

# shellcheck disable=SC1091
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo "Mood API environment ready. Start with: npm run mood-api"
