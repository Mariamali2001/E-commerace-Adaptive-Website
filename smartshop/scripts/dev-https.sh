#!/usr/bin/env bash
# HTTPS dev server so iPhone Safari can use the camera (secure context).
set -euo pipefail
cd "$(dirname "$0")/.."

IP="$(ipconfig getifaddr en0 2>/dev/null || true)"
if [[ -z "${IP}" ]]; then
  IP="$(ipconfig getifaddr en1 2>/dev/null || true)"
fi
if [[ -z "${IP}" ]]; then
  IP="127.0.0.1"
fi

mkdir -p certificates
openssl req -x509 -newkey rsa:2048 \
  -keyout certificates/dev-key.pem \
  -out certificates/dev-cert.pem \
  -days 825 -nodes \
  -subj "/CN=SmartShop-Dev" \
  -addext "subjectAltName=DNS:localhost,DNS:*.local,IP:127.0.0.1,IP:${IP}" \
  >/dev/null 2>&1

echo ""
echo "SmartShop HTTPS (iPhone camera)"
echo "  Computer:  https://localhost:3000"
echo "  iPhone:    https://${IP}:3000"
echo "  (same Wi‑Fi; tap Advanced → Continue if Safari warns)"
echo "  Also keep mood API running: cd mood_model && python3 mood_api.py"
echo ""

exec npx next dev \
  --experimental-https \
  --experimental-https-key ./certificates/dev-key.pem \
  --experimental-https-cert ./certificates/dev-cert.pem \
  --hostname 0.0.0.0 \
  --port 3000
