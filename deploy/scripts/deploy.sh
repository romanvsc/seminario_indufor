#!/usr/bin/env bash
# Deploy de una versión (tag o commit) en el servidor Linux de ADR-005.
# Uso: deploy/scripts/deploy.sh <tag|commit>
# Variables: WEB_ROOT (destino de la SPA, por defecto /var/www/indufor-app), PHP, COMPOSER.
# Requiere backend/.env y frontend/.env.production ya configurados (deploy/*.env.production.example).
set -euo pipefail

REF="${1:?Indicá el tag o commit a desplegar (p. ej. v1.0.0)}"
RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
WEB_ROOT="${WEB_ROOT:-/var/www/indufor-app}"
PHP="${PHP:-php}"
COMPOSER="${COMPOSER:-composer}"
cd "$RAIZ"

[ -z "$(git status --porcelain --untracked-files=no)" ] || { echo "Hay cambios locales en el servidor; deploy cancelado." >&2; exit 1; }

# 1. Backup antes de tocar nada: es el punto de vuelta si la migración sale mal
BACKUP="$("$RAIZ/deploy/scripts/backup.sh")"
git rev-parse HEAD > "$RAIZ/.deploy-anterior"
echo "$BACKUP" >> "$RAIZ/.deploy-anterior"

# 2. Código
git fetch --tags --quiet
git checkout --quiet --detach "$REF"

# 3. Backend: dependencias de producción, migraciones y catálogos (los seeders son idempotentes)
cd "$RAIZ/backend"
"$COMPOSER" install --no-dev --optimize-autoloader --no-interaction --quiet
"$PHP" artisan down --retry=30
trap '"$PHP" artisan up' EXIT
"$PHP" artisan migrate --force
for s in RbacSeeder FrentesSeeder TiposMaderaSeeder; do "$PHP" artisan db:seed --class="$s" --force; done
"$PHP" artisan optimize

# 4. Frontend: build con frontend/.env.production y publicación atómica
cd "$RAIZ/frontend"
npm ci --no-audit --no-fund --silent
npm run build
mkdir -p "$WEB_ROOT"
rsync -a --delete dist/ "$WEB_ROOT.nuevo/"
rm -rf "$WEB_ROOT.anterior" && mv "$WEB_ROOT" "$WEB_ROOT.anterior" && mv "$WEB_ROOT.nuevo" "$WEB_ROOT"

echo "Desplegado $REF. Backup previo: $BACKUP. Para volver: deploy/scripts/rollback.sh"
