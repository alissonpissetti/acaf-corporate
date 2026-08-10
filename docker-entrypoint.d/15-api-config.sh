#!/bin/sh
set -e

# nginx usa API_BACKEND_URL para proxy /api (obrigatório em produção Coolify).
url="${API_BACKEND_URL%/}"
url="$(echo "$url" | tr -d '[:space:]')"

if [ -z "$url" ]; then
  url="http://127.0.0.1:8787"
fi

case "$url" in
  http://*|https://*) ;;
  *)
    url="http://${url}"
    ;;
esac

export API_BACKEND_URL="$url"

if echo "$url" | grep -q '127.0.0.1:8787'; then
  echo "[acaf-corporate] AVISO: API_BACKEND_URL aponta a 127.0.0.1:8787 — defina a URL pública da acaf-api no Coolify (runtime)." >&2
fi

echo "[acaf-corporate] nginx proxy /api → ${API_BACKEND_URL}/api/" >&2

direct="${ACAF_API_DIRECT:-}"

if [ "$direct" = "1" ] || [ "$direct" = "true" ]; then
  escaped="${url//\\/\\\\}"
  escaped="${escaped//\"/\\\"}"
  browser_url="$escaped"
else
  browser_url=""
fi

cat > /usr/share/nginx/html/api-config.js <<EOF
window.__ACAF_API_URL__ = "${browser_url}";
EOF
