#!/bin/sh
set -e

# Gera config de runtime para o SPA chamar a API diretamente (evita 502 do proxy no Coolify).
url="${API_BACKEND_URL%/}"
escaped="${url//\\/\\\\}"
escaped="${escaped//\"/\\\"}"

cat > /usr/share/nginx/html/api-config.js <<EOF
window.__ACAF_API_URL__ = "${escaped}";
EOF
