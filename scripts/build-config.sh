#!/usr/bin/env sh
# Genera js/runtime-config.js a partir de .env.
# El catálogo es estático (GitHub Pages): no lee .env en runtime, así que este
# script "compila" los valores en runtime-config.js, que es el archivo servido.
#
# Uso:  sh scripts/build-config.sh

set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
OUT_FILE="$ROOT_DIR/js/runtime-config.js"

BASE_URL=""
DISABLE_SHELL_REDIRECT="false"

if [ -f "$ENV_FILE" ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      ''|\#*) continue ;;
    esac
    key="${line%%=*}"
    value="${line#*=}"
    # Recorta espacios alrededor de la clave.
    key="$(printf '%s' "$key" | tr -d '[:space:]')"
    case "$key" in
      BASE_URL) BASE_URL="$value" ;;
      DISABLE_SHELL_REDIRECT) DISABLE_SHELL_REDIRECT="$value" ;;
    esac
  done < "$ENV_FILE"
fi

# Normaliza: quita slash final de BASE_URL y espacios.
BASE_URL="$(printf '%s' "$BASE_URL" | sed -e 's/[[:space:]]*$//' -e 's#/*$##')"
DISABLE_SHELL_REDIRECT="$(printf '%s' "$DISABLE_SHELL_REDIRECT" | tr -d '[:space:]')"

if [ "$DISABLE_SHELL_REDIRECT" != "true" ]; then
  DISABLE_SHELL_REDIRECT="false"
fi

cat > "$OUT_FILE" <<EOF
// Generado por scripts/build-config.sh a partir de .env. No editar a mano.
window.CATALOG_BASE_URL = "${BASE_URL}";
window.DISABLE_SHELL_REDIRECT = ${DISABLE_SHELL_REDIRECT};
EOF

echo "Generado $OUT_FILE (BASE_URL='${BASE_URL}', DISABLE_SHELL_REDIRECT=${DISABLE_SHELL_REDIRECT})"
