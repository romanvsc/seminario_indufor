# INDUFOR — ficha del proyecto

Sistema web para producción forestal, logística, mantenimiento, consumos y reportes. Fuentes y reglas: [CLAUDE.md](../CLAUDE.md), [Context.md](../Context.md), [fases](fases.md), [especificaciones](../specs/README.md), [RBAC](rbac.md) y [discrepancias](discrepancias.md).

- Backend: Laravel y Sanctum, API `/api/v1`, PHP y persistencia MySQL/MariaDB.
- Cliente operativo: React, TypeScript, Vite y PWA separada; ver `frontend/package.json`.
- Herramientas del plan: Python estándar y visor independiente React/TypeScript/Vite.
- Despliegue: decisión y estado en [ADR-005](adr/ADR-005-destino-de-deploy.md).

Las versiones y el estado real se consultan en los manifiestos y las fuentes vigentes; esta ficha no sustituye la evidencia de ejecución.
