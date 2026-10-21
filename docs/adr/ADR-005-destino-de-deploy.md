# ADR-005 — Destino y estrategia de deploy

Status: Aceptado (preparado; la publicación queda pendiente de elegir el proveedor)
Date: 2026-10-21

## Context

El sistema se desarrolló con XAMPP "hasta que lo subamos a un host" (decisión de Fase 1). La Fase 7 exige configuración productiva, backup/restore, logs, runbook y rollback. El proveedor todavía no está elegido; el usuario decidió dejar todo preparado y probado sin publicar. ADR-001 fija SPA y API separadas con Sanctum por cookies, y ADR-004 evita colas y workers.

## Decision

- **Servidor objetivo:** un Linux (Ubuntu LTS) con Nginx, PHP-FPM 8.4 y MariaDB 10.11, que es la versión que corre el CI. Un VPS chico alcanza: no hay colas ni procesos persistentes.
- **Dominios:**
  - la SPA va en `app.<dominio>` y la API en `api.<dominio>`, ambas en subdominios del mismo dominio;
  - así las cookies de sesión (`SESSION_DOMAIN=.<dominio>`, `SameSite=Lax`, `Secure`) funcionan sin CORS abierto.
  - Configuración en `deploy/nginx.conf`, `deploy/backend.env.production.example` y `deploy/frontend.env.production.example`.
- **Deploy por versión etiquetada** (`deploy/scripts/deploy.sh <tag>`):
  1. backup previo;
  2. checkout del tag;
  3. `composer install --no-dev`, con la API en modo mantenimiento;
  4. migraciones y catálogos idempotentes;
  5. `artisan optimize`;
  6. build de la SPA y publicación atómica, guardando la versión anterior.
- **Rollback** (`deploy/scripts/rollback.sh`):
  - vuelve al commit anterior y a la SPA anterior;
  - con `--con-base`, además restaura el backup previo. Esto solo se usa si una migración rompió datos, porque se pierde lo cargado después del deploy.
- **Backups:**
  - `deploy/scripts/backup.sh` se programa todos los días por cron. Toma un dump consistente con `--single-transaction`, verificado, más los archivos privados (fotos y buzón de integración).
  - Tiene retención configurable y cifrado opcional con GPG.
  - `restore.sh` exige `--confirmar` y pone la API en mantenimiento mientras restaura.
- **Tareas programadas:** el cron de Laravel (`schedule:run` cada minuto) reintenta las exportaciones pendientes (ADR-004).
- **Logs:** canal `daily` con nivel `warning` y 30 días de retención. La auditoría funcional queda en `auditoria_evento`.

## Alternatives

- **Hosting compartido con cPanel:** más barato. Pero el cron es limitado, no se controla PHP-FPM ni Nginx (cabeceras, CSP) y el deploy es manual por FTP. Sirve solo para una demostración.
- **PaaS (Forge, Ploi, Railway):** simplifican el deploy, pero suman costo mensual y dependencia del proveedor. Los mismos scripts sirven de base si se elige uno.
- **Contenedores (Docker):** reproducibles, pero agregan una capa que el equipo de INDUFOR no va a operar. Quedan como evolución.

## Consequences

- Antes de publicar falta: elegir el proveedor y el dominio, crear el usuario de base con permisos mínimos, emitir certificados, cargar los `.env` y crear el primer administrador con `php artisan usuarios:crear-admin`. Todo eso está en `docs/runbook.md`.
- Los scripts se probaron en local: el backup y la restauración sobre una base temporal dieron las mismas tablas y filas, y los archivos quedaron idénticos. `deploy.sh` y `rollback.sh` necesitan el servidor Linux (Nginx y rsync): se validó su sintaxis, el build de producción de la SPA y `artisan optimize`.
- Impacto en el TP: sección 7 (implementación y despliegue).
