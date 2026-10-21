#!/usr/bin/env bash
# Vuelve a la versión anterior al último deploy.sh.
# Uso: deploy/scripts/rollback.sh            → solo código y SPA (si el deploy no migró la base)
#      deploy/scripts/rollback.sh --con-base → además restaura el backup tomado antes del deploy
# Con --con-base se pierde lo cargado después del deploy: usarlo solo si la migración rompió datos.
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
WEB_ROOT="${WEB_ROOT:-/var/www/indufor-app}"
PHP="${PHP:-php}"
COMPOSER="${COMPOSER:-composer}"
[ -f "$RAIZ/.deploy-anterior" ] || { echo "No hay registro de un deploy anterior (.deploy-anterior)." >&2; exit 1; }
COMMIT="$(sed -n 1p "$RAIZ/.deploy-anterior")"
BACKUP="$(sed -n 2p "$RAIZ/.deploy-anterior")"

cd "$RAIZ"
git checkout --quiet --detach "$COMMIT"
cd backend
"$COMPOSER" install --no-dev --optimize-autoloader --no-interaction --quiet
if [ "${1:-}" = "--con-base" ]; then
  "$RAIZ/deploy/scripts/restore.sh" "$BACKUP.sql.gz" "$BACKUP.archivos.tar.gz" --confirmar
fi
"$PHP" artisan optimize

# La SPA anterior quedó guardada por deploy.sh: se restituye sin recompilar
if [ -d "$WEB_ROOT.anterior" ]; then
  mv "$WEB_ROOT" "$WEB_ROOT.descartado" && mv "$WEB_ROOT.anterior" "$WEB_ROOT" && rm -rf "$WEB_ROOT.descartado"
fi
echo "Rollback a $COMMIT completo${1:+ (base restaurada desde $BACKUP)}."
