#!/bin/sh
set -e

# Defaults antes do envsubst (20-envsubst-on-templates.sh).
: "${PORT:=80}"
: "${API_BACKEND_URL:=http://127.0.0.1:8787}"

export PORT API_BACKEND_URL
