# 01 — Integridad de consumos y reportes

Estado: **aprobado el 2026-10-22** con las opciones recomendadas (`docs/discrepancias.md` D21–D27).

## Problema y evidencia

| ID | Tipo | Hallazgo | Evidencia |
|---|---|---|---|
| H-01.1 | Defecto | Reemplazar un período con un archivo **parcial** borra todos los consumos anteriores e inserta solo las filas válidas: una unidad que estaba bien y ahora viene con error pierde su consumo. | [código] `backend/app/Contexts/ExternalCosts/Application/GestionIntegracion.php:92` calcula `PARCIAL`; `:101-109` con `$validas !== []` borra el período (`:103`) e inserta solo `$validas` (`:109`). [test] `IntegracionTest` cubre el reemplazo con archivo **sin** filas válidas (no borra), pero no el reemplazo con archivo parcial. |
| H-01.2 | Defecto | El mensual dice "✓ Consolidado completo" con que exista consumo de **una** unidad, aunque el lote vigente sea `PARCIAL`. | [código] `backend/app/Contexts/Reporting/Interface/Http/ReportesController.php:92` (`consumos_importados = unidades > 0`); `frontend/src/features/reports/ReportesPage.tsx:164-165`. [observado] El dashboard de Gerencia muestra "Gastos de combustible 2026-09 $135.000 · 1 unidades", y el lote vigente de ese período es `PARCIAL`. |
| H-01.3 | Defecto | Ni el reporte ni el dashboard dicen **qué lote** respalda los números, ni si quedaron filas sin importar. | [código] `ReportesController.php:84-101` no devuelve el lote; `ConsultasReportesDb::totalConsumos` suma sin mirar el estado del lote. |
| H-01.4 | — | La reimportación del mismo archivo es correcta: no duplica, y un archivo `ERROR` se puede reintentar. | [código] `IntegracionRepositorioEloquent.php:59-61`; [test] `IntegracionTest` «el mismo archivo otra vez no duplica nada». |
| H-01.5 | — | Un período no puede sumar dos lotes: la base lo impide. | [código] `2026_10_19_000003_create_integracion_tables.php:43` `unique(periodo, id_unidad)`. |

## Usuarios y tareas

- **Administración:** importa el consolidado mensual y, si el sistema externo corrige, lo reemplaza.
- **Gerencia:** decide con el consolidado mensual y el dashboard.

## RF, RNF, contexto y decisiones vigentes

RF13, RF15, RNF03 · contextos External Costs Integration (ACL) y Reporting · D09, D13 · ADR-004.

## Comportamiento actual

1. **Primera importación:** con todas las filas válidas queda `OK`; con algunas filas con error, `PARCIAL` (se insertan las válidas); sin ninguna válida, `ERROR` (no inserta nada).
2. **Reemplazo** (marcar "Reemplazar" y escribir el motivo):
   - si el archivo nuevo trae alguna fila válida, se borra **todo** el período, el lote anterior queda `REEMPLAZADO` y se insertan solo las válidas;
   - si no trae ninguna válida, se registra un lote `ERROR` y lo anterior queda intacto.
3. **Reportes:** cualquier consumo del período cuenta como "completo".

## Comportamiento esperado (sujeto a A1 y A2)

- Un reemplazo nunca deja al período con **menos información válida** que antes sin que Administración lo vea y lo acepte.
- Los reportes muestran el **estado del lote vigente** (número, archivo, fecha, cantidad de unidades y de filas con error) y **nunca** dicen "completo": el sistema no puede saberlo (ver A2).

## Alcance y exclusiones

- **Incluye:** política de reemplazo; significado de los estados; lote vigente visible en el mensual, el dashboard y la pantalla de Integración.
- **Excluye:**
  - comparar contra la flota activa: puede haber unidades sin consumo y no hay regla aprobada;
  - cambiar el formato CSV v1;
  - un circuito de aprobación.

## Reglas e invariantes

- **I-01.1:** un período tiene a lo sumo un lote vigente (`OK` o `PARCIAL`) y sus consumos pertenecen todos a ese lote. Hoy se cumple por `:103-109` más el índice único.
- **I-01.2:** un archivo con checksum igual al de un lote vigente no modifica nada. Hoy se cumple.
- **I-01.3 (nueva, según A1):** un reemplazo se aplica entero o no se aplica.
- **I-01.4:** ninguna pantalla afirma completitud. Se informa "importado", "importado con N filas con error" o "sin importar".

**Significado de cada estado** (para documentar en ADR-004):

| Estado | Significado | ¿Vigente? |
|---|---|---|
| `OK` | Todas las filas del archivo se importaron. No implica que estén todas las unidades. | Sí |
| `PARCIAL` | Se importaron las filas válidas; las demás figuran en el detalle del lote. | Sí |
| `ERROR` | No se importó nada. | No |
| `REEMPLAZADO` | Fue vigente y lo sustituyó otro lote. | No |
| `RECHAZADO` | Nuevo, solo con A1 = a: reemplazo no aplicado porque el archivo traía errores. | No |

## Flujos

- **Principal, reemplazo con A1 = a (recomendada):**
  1. Administración sube el archivo corregido y marca "Reemplazar" con un motivo.
  2. Si el archivo trae **cero** filas con error, se aplica el reemplazo.
  3. Si trae alguna fila con error, no se toca nada: se registra un lote `RECHAZADO` con el detalle y se muestra "Reemplazo no aplicado: N filas con error. Corregí el archivo y volvé a importarlo".
- **Alternativa con A1 = b, fusión por unidad:** se reemplazan solo las unidades presentes y válidas en el archivo nuevo, y se conservan las demás. Exige registrar a qué lote pertenece cada consumo, cosa que ya pasa (`consumo_importado.id_lote`).

## Errores, permisos y recuperación

- Solo `integration.import-costs` (Administración) importa o reemplaza. Gerencia ve el estado en los reportes (`reports.financial`).
- **Recuperación:** como el reemplazo es total o nulo, un archivo malo nunca destruye datos. El lote anterior sigue vigente.

## Impacto

- **API:**
  - `POST /integrations/imports` puede devolver `422 REEMPLAZO_CON_ERRORES` con el detalle;
  - `GET /reports/monthly` y `/dashboard` agregan `lote_vigente {id, estado, archivo, fecha, unidades, filas_con_error}`;
  - se elimina `consumos_importados` o se renombra con un significado exacto.
- **Datos:** ninguna columna nueva. Solo un estado nuevo, `RECHAZADO`, si A1 = a. Hay que documentarlo en `docs/database.md` §13 y en el diccionario (fila en `docs/cambios-pdf.md`).
- **Interfaz:** mensual, dashboard e Integración.

## Criterios de aceptación

- **CA-01.1**
  - Dado: el período 2026-09 tiene vigente un lote `OK` con las unidades A y B.
  - Cuando: Administración reemplaza con un archivo donde A es válida y B tiene un error.
  - Entonces: (A1 = a) la respuesta es `422 REEMPLAZO_CON_ERRORES`, A y B conservan sus valores anteriores y el lote anterior sigue vigente.
- **CA-01.2**
  - Dado: el período tiene un lote vigente `PARCIAL` con 2 filas con error.
  - Cuando: Gerencia abre el consolidado mensual.
  - Entonces: ve "Importado con 2 filas con error (lote #N, archivo, fecha)" y nunca "completo".
- **CA-01.3**
  - Dado: no hay lote vigente para el período.
  - Cuando: se abre el mensual o el dashboard.
  - Entonces: dice "Sin importar" y la fecha límite del día 15.
- **CA-01.4**
  - Dado: un lote vigente.
  - Cuando: se importa el mismo archivo.
  - Entonces: no cambia ningún consumo y se informa "ya importado" (vigente hoy; test de regresión).
- **CA-01.5**
  - Dado: un reemplazo válido y aplicado.
  - Entonces:
    - el lote anterior queda `REEMPLAZADO`;
    - hay un evento `consumos.reemplazados` con motivo, lotes previos y cantidad de consumos;
    - los consumos del período pertenecen solo al lote nuevo.

## Decisiones pendientes

- **A1, política de reemplazo:**
  - (a) total o nulo: solo se reemplaza con un archivo sin errores (**recomendada**);
  - (b) fusión por unidad;
  - (c) actual.
  - Consecuencias:
    - (a) es la más simple y nunca pierde datos, pero obliga a corregir el archivo completo;
    - (b) permite avanzar con archivos imperfectos, pero un período puede quedar mezclando dos lotes y la trazabilidad es más difícil de explicar;
    - (c) mantiene el riesgo H-01.1.
- **A2, qué evidencia permite decir que un período está "completo":**
  - (a) ninguna: el sistema informa estado y cantidades, nunca "completo" (**recomendada**);
  - (b) el archivo externo trae un total de control (contrato CSV v2) y se compara;
  - (c) una confirmación manual de Administración ("período cerrado").
  - Consecuencias:
    - (b) exige que el sistema externo cambie, y no lo controlamos;
    - (c) agrega un circuito y una columna nueva.

## Supuestos

- La primera importación `PARCIAL` sigue permitida: hay datos útiles y el detalle de errores queda visible.

---

## Plan (Fase 2)

- **Diseño mínimo con A1 = a:** en `GestionIntegracion::importar`, si hay lotes previos y `$errores !== []`, se registra el lote `RECHAZADO` con el detalle y se lanza `REEMPLAZO_CON_ERRORES` **antes** de borrar nada. Reporting expone el lote vigente con una consulta sobre `integracion_lote`.
- **Dependencias:** ninguna con otros specs.
- **Migración:** ninguna; `estado` es un VARCHAR. Los datos existentes no cambian.
- **Pruebas por riesgo:** Feature tests de CA-01.1 a CA-01.5 sobre MariaDB de test, y el E2E de fase 5 adaptado al reemplazo rechazado.

| Tarea | Criterio | Prueba |
|---|---|---|
| T-01.1 Reemplazo total o nulo (`RECHAZADO`) | CA-01.1, CA-01.5 | `IntegracionTest`: «reemplazo con filas inválidas no toca el período» |
| T-01.2 `lote_vigente` en el mensual y el dashboard; quitar "completo" | CA-01.2, CA-01.3 | `ReportesTest` + `ReportesPage`/`DashboardPage` (Vitest) |
| T-01.3 Mensaje de reemplazo rechazado en Integración | CA-01.1 | `IntegracionPage.test` + E2E fase5 |
| T-01.4 Documentar los estados en ADR-004, `docs/database.md` y `cambios-pdf.md` | — | revisión |

- **Riesgos y reversión:** el cambio queda en un solo caso de uso y no tiene migración; se revierte con el commit. Riesgo: Administración puede no entender el rechazo, así que el mensaje tiene que decir qué filas corregir.
