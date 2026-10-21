#!/usr/bin/env bash
# Backup de INDUFOR: base de datos (consistente, sin frenar la operación) + archivos privados (fotos, intercambios).
# Uso: deploy/scripts/backup.sh [carpeta_destino]
# Lee DB_* del backend/.env; cualquier variable del entorno tiene prioridad (útil para probar contra otra base).
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$RAIZ/backend"
leer() { grep -E "^$1=" .env 2>/dev/null | tail -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e 's/[[:space:]]*#.*$//' || true; }

DB_HOST="${DB_HOST:-$(leer DB_HOST)}"
DB_PORT="${DB_PORT:-$(leer DB_PORT)}"
DB_DATABASE="${DB_DATABASE:-$(leer DB_DATABASE)}"
DB_USERNAME="${DB_USERNAME:-$(leer DB_USERNAME)}"
DB_PASSWORD="${DB_PASSWORD:-$(leer DB_PASSWORD)}"
DESTINO="${1:-${BACKUP_DIR:-$(leer BACKUP_DIR)}}"
DESTINO="${DESTINO:-$HOME/indufor-backups}"
RETENCION="${BACKUP_RETENCION_DIAS:-$(leer BACKUP_RETENCION_DIAS)}"
GPG_RECIPIENT="${BACKUP_GPG_RECIPIENT:-$(leer BACKUP_GPG_RECIPIENT)}"
MYSQLDUMP="${MYSQLDUMP:-mysqldump}"

mkdir -p "$DESTINO" storage/app/private
BASE="$DESTINO/indufor-$(date +%Y%m%d-%H%M%S)"

# --single-transaction: foto consistente de InnoDB sin bloquear las cargas de campo
MYSQL_PWD="$DB_PASSWORD" "$MYSQLDUMP" --single-transaction --routines --triggers --default-character-set=utf8mb4 \
  -h "${DB_HOST:-127.0.0.1}" -P "${DB_PORT:-3306}" -u "$DB_USERNAME" "$DB_DATABASE" | gzip > "$BASE.sql.gz"
tar -czf "$BASE.archivos.tar.gz" -C storage/app private

# Un dump vacío o cortado no es un backup: se verifica antes de darlo por bueno
gzip -t "$BASE.sql.gz"
gunzip -c "$BASE.sql.gz" | tail -n 1 | grep -q "Dump completed" || { echo "ERROR: el dump quedó incompleto: $BASE.sql.gz" >&2; exit 1; }

if [ -n "$GPG_RECIPIENT" ]; then
  for f in "$BASE.sql.gz" "$BASE.archivos.tar.gz"; do
    gpg --batch --yes --encrypt --recipient "$GPG_RECIPIENT" --output "$f.gpg" "$f" && rm -f "$f"
  done
fi

find "$DESTINO" -maxdepth 1 -name 'indufor-*' -mtime +"${RETENCION:-30}" -delete
echo "$BASE"
