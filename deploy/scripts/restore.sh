#!/usr/bin/env bash
# Restaura un backup de deploy/scripts/backup.sh. REEMPLAZA la base y los archivos privados actuales.
# Uso: deploy/scripts/restore.sh <base>.sql.gz [<base>.archivos.tar.gz] --confirmar
# Antes de restaurar en producción, hacé un backup del estado actual (por si hay que volver).
set -euo pipefail

[ "${!#}" = "--confirmar" ] || { echo "Esto reemplaza la base ${DB_DATABASE:-del .env}. Repetí el comando con --confirmar al final." >&2; exit 2; }
SQL="${1:?Indicá el archivo .sql.gz}"
ARCHIVOS="${2:-}"
[ "$ARCHIVOS" = "--confirmar" ] && ARCHIVOS=""

RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$RAIZ/backend"
leer() { grep -E "^$1=" .env 2>/dev/null | tail -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e 's/[[:space:]]*#.*$//' || true; }
DB_HOST="${DB_HOST:-$(leer DB_HOST)}"
DB_PORT="${DB_PORT:-$(leer DB_PORT)}"
DB_DATABASE="${DB_DATABASE:-$(leer DB_DATABASE)}"
DB_USERNAME="${DB_USERNAME:-$(leer DB_USERNAME)}"
DB_PASSWORD="${DB_PASSWORD:-$(leer DB_PASSWORD)}"
MYSQL="${MYSQL:-mysql}"
PHP="${PHP:-php}"

gzip -t "$SQL"
# Modo mantenimiento mientras se restaura: nadie carga datos que se perderían
"$PHP" artisan down --retry=60 >/dev/null 2>&1 || true
trap '"$PHP" artisan up >/dev/null 2>&1 || true' EXIT

gunzip -c "$SQL" | MYSQL_PWD="$DB_PASSWORD" "$MYSQL" --default-character-set=utf8mb4 -h "${DB_HOST:-127.0.0.1}" -P "${DB_PORT:-3306}" -u "$DB_USERNAME" "$DB_DATABASE"
if [ -n "$ARCHIVOS" ]; then
  rm -rf storage/app/private.restaurando && mkdir -p storage/app/private.restaurando
  tar -xzf "$ARCHIVOS" -C storage/app/private.restaurando
  rm -rf storage/app/private && mv storage/app/private.restaurando/private storage/app/private && rmdir storage/app/private.restaurando
fi
"$PHP" artisan optimize:clear >/dev/null 2>&1 || true
echo "Restaurado $SQL en $DB_DATABASE${ARCHIVOS:+ y archivos desde $ARCHIVOS}"
