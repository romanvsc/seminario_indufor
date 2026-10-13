# Matriz RBAC — Rol → Permiso

> Estado: **propuesta para revisar** (2026-10-12). Fuente de permisos: `Context.md` §10. Reglas de actores: sección 3.1 del TP y RNF03.
> Cada fila se convierte en tests de Fase 1: un caso permitido y uno denegado por rol.

Roles: **adm** administración · **ger** gerencia · **enc** encargado · **ope** operario · **cam** camionero · **log** logística · **man** mantenimiento.

## Identidad, frentes y maquinaria

| Permiso | adm | ger | enc | ope | cam | log | man |
|---|---|---|---|---|---|---|---|
| `users.view` | ✓ | ✓ | | | | | |
| `users.create`, `users.update`, `users.disable` | ✓ | | | | | | |
| `fronts.view`, `machinery.view` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `fronts.manage`, `fronts.assign-users`, `machinery.manage` | ✓ | | | | | | |

## Producción (RF01–RF04)

| Permiso | adm | ger | enc | ope | cam | log | man |
|---|---|---|---|---|---|---|---|
| `production.create`, `production.update-own` | | | ✓ | ✓ | | | |
| `production.view` (solo su frente) | | | ✓ | ✓ | | | |
| `production.view-all` | ✓ | ✓ | | | | | |

## Logística (RF05–RF08)

| Permiso | adm | ger | enc | ope | cam | log | man |
|---|---|---|---|---|---|---|---|
| `logistics.trip.create`, `logistics.trip.view-own` | | | | | ✓ | | |
| `logistics.trip.view-all` | ✓ | ✓ | | | | ✓ | |
| `logistics.remito.create`, `logistics.remito.validate`, `logistics.correction.manage` | ✓ | | | | | | |

## Mantenimiento (RF09–RF11)

| Permiso | adm | ger | enc | ope | cam | log | man |
|---|---|---|---|---|---|---|---|
| `maintenance.reading.create`, `maintenance.extinguisher.create` | | | ✓ | ✓ | | | |
| `maintenance.reading.view` | ✓ | ✓ | ✓ | ✓ | | | ✓ |
| `maintenance.failure.view`, `maintenance.extinguisher.view` | ✓ | ✓ | | | | | ✓ |
| `maintenance.failure.manage` | | | | | | | ✓ |

## Integración, reportes y configuración (RF12–RF16, RNF03)

| Permiso | adm | ger | enc | ope | cam | log | man |
|---|---|---|---|---|---|---|---|
| `integration.import-costs`, `integration.export-readings` (reintento manual), `integration.view-history` | ✓ | | | | | | |
| `reports.production`, `reports.operational` | ✓ | ✓ | | | | | |
| `reports.financial`, `dashboard.management`, `settings.manage`, `audit.view` | ✓ | ✓ | | | | | |

## Reglas que la matriz no expresa sola

- **Alcance por frente:** `production.view` y `maintenance.reading.view` de encargados y operarios se limitan a los frentes asignados en la fecha (`frente_asignado`). La Policy lo verifica, no la UI.
- **Solo lo propio:** `production.update-own` y `logistics.trip.view-own` se limitan a registros del propio usuario.
- **Exportación automática (RF12):** la hace el sistema sin intervención; `integration.export-readings` solo habilita el reintento manual.
- **Sin validación de producción:** no existe `production.validate` (D16).

## Preguntas abiertas para la revisión

1. ¿Logística debe ver producción o lecturas, o solo viajes?
2. ¿Mantenimiento debe ver el reporte operativo (`reports.operational`)?
3. ¿Gerencia necesita gestionar usuarios o solo verlos?
