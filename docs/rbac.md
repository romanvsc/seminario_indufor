# Matriz RBAC — Rol → Permiso

> Estado: **aprobada** (2026-10-12). Fuente de permisos: `Context.md` §10. Reglas de actores: sección 3.1 del TP y RNF03.
> Cada fila se convierte en tests de Fase 1: un caso permitido y uno denegado por rol.

Roles: **adm** administración · **ger** gerencia · **enc** encargado · **ope** operario · **cam** camionero · **log** logística · **man** mantenimiento.

## Identidad, frentes y maquinaria

| Permiso | adm | ger | enc | ope | cam | log | man |
|---|---|---|---|---|---|---|---|
| `users.view` | ✓ | ✓ | | | | | |
| `users.create`, `users.update`, `users.disable` | ✓ | ✓ | | | | | |
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
| `reports.production` | ✓ | ✓ | | | | | |
| `reports.operational` | ✓ | ✓ | | | | | ✓ |
| `reports.financial`, `dashboard.management`, `settings.manage`, `audit.view` | ✓ | ✓ | | | | | |

## Reglas que la matriz no expresa sola

- **Alcance por frente:** `production.view` y `maintenance.reading.view` de encargados y operarios se limitan a los frentes asignados en la fecha (`frente_asignado`). La Policy lo verifica, no la UI.
- **Carga de mantenimiento por frente (D28):** `maintenance.reading.create` y `maintenance.extinguisher.create` solo valen para unidades del frente al que el usuario estaba asignado en la fecha de la carga, o de las que es responsable. Lo verifica el caso de uso.
- **Historial de asignaciones (D29):** con `fronts.view` solo se consultan las asignaciones propias; las de otros usuarios exigen `fronts.assign-users` o `users.view`. Lo verifica el controller.
- **Solo lo propio:** `production.update-own` y `logistics.trip.view-own` se limitan a registros del propio usuario.
- **Exportación automática (RF12):** la hace el sistema sin intervención; `integration.export-readings` solo habilita el reintento manual.
- **Sin validación de producción:** no existe `production.validate` (D16).

## Decisiones de la revisión (2026-10-12)

1. **Logística ve solo viajes.** No accede a producción ni a lecturas (`logistics.trip.view-all` y catálogos de frentes y maquinaria).
2. **Mantenimiento ve el reporte operativo** (`reports.operational`), por ahora. Revisar en producción.
3. **Gerencia gestiona usuarios** con alta, consulta, modificación y baja. La baja es lógica (`users.disable`): el usuario queda inactivo y auditado, nunca se borra, porque sus registros de producción, viajes y lecturas deben seguir siendo trazables.
