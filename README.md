# INDUFOR — Sistema Integral de Gestión y Control

Sistema web (PWA) para la producción forestal, logística, mantenimiento y consumos de Indufor SRL. Proyecto del TP Final de Seminario (Tecnicatura en Análisis de Sistemas, IAES 2026).

- Contexto técnico y funcional: [`Context.md`](Context.md) · reglas para agentes: [`CLAUDE.md`](CLAUDE.md) · documentación: [`docs/`](docs/)

## Estructura

```text
backend/    API Laravel 13 (PHP 8.4) — /api/v1, Sanctum, Pest
frontend/   SPA React 19 + TypeScript + Vite, Tailwind v4, PWA
docs/       esquema, decisiones, RBAC, ADRs, design tokens
```

## Requisitos

- PHP 8.4 con `pdo_mysql`, `mbstring`, `intl`, `openssl`, `fileinfo`, `zip`, `sodium`, `curl`, `gd`
- Composer 2
- MariaDB 10.4+ (en desarrollo, el de XAMPP) con las bases `indufor_db` e `indufor_db_test` en `utf8mb4`
- Node 24

## Puesta en marcha

```bash
# Backend
cd backend
composer install
cp .env.example .env && php artisan key:generate
php artisan migrate --seed
php artisan serve            # http://localhost:8000

# Frontend
cd frontend
npm install
npm run dev                  # http://localhost:5173
```

## Tests

```bash
cd backend && vendor/bin/pest          # usa indufor_db_test (MariaDB)
cd frontend && npm test && npm run build
```

La CI (`.github/workflows/ci.yml`) corre ambas suites en cada push y PR.
