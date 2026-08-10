#!/bin/sh
set -e

# nginx usa API_BACKEND_URL para proxy /api (obrigatório em produção).
# Por padrão o browser chama /api na mesma origem (evita mixed content e CORS).
# Para forçar URL absoluta no browser: ACAF_API_DIRECT=1
url="${API_BACKEND_URL%/}"
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
