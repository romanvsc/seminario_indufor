# Especificaciones (SDD) — confiabilidad para el uso diario

Origen: `SDD.md` (2026-10-22). **Specs y decisiones aprobados por el usuario el 2026-10-22** (decisiones D21–D27 en `docs/discrepancias.md`). Fase 3 en curso: implementación por bloques.

## Convención

- Un archivo por capacidad funcional: `NN-capacidad.md`.
- Cada spec tiene: problema y evidencia, usuarios, RF/RNF y decisiones, comportamiento actual y esperado, alcance, reglas, flujos, errores y recuperación, impacto, criterios Dado/Cuando/Entonces (`CA-NN.x`), decisiones pendientes y supuestos, y el plan (Fase 2) con tareas `T-NN.x`.
- **Trazabilidad:** hallazgo (`H-NN.x`) → requisito (`R-NN.x`) → criterio (`CA-NN.x`) → tarea (`T-NN.x`) → prueba (nombrada en la tarea).
- **Tipo de evidencia**, siempre explícito:
  - `[código]`: leído en el código actual (archivo:línea).
  - `[test]`: hay un test automatizado que lo cubre.
  - `[observado]`: visto en la app real (recorrido del 2026-10-22 contra `indufor_db_e2e`).
  - `[inferido]`: deducido del código, sin reproducirlo.
- **Clasificación de cada ítem:**
  - **Defecto**: contradice una regla vigente o pierde, duplica o falsea datos.
  - **Uso**: mejora de la tarea diaria sin regla nueva.
  - **Negocio**: requiere una definición tuya.

## Índice y prioridad

| # | Spec | Defectos | Uso | Decisiones | Prioridad |
|---|---|---|---|---|---|
| 01 | [Integridad de consumos y reportes](01-integridad-consumos.md) | 3 | — | A1, A2 | **1** (datos financieros) |
| 05 | [Reintentos sin duplicados](05-idempotencia.md) | 3 | — | E1 | **1** (duplicación) |
| 02 | [Cargas atrasadas](02-cargas-atrasadas.md) | 2 | — | — | **1** (bloquea datos válidos) |
| 04 | [Conectividad, borradores y sesión](04-conectividad-borradores.md) | 6 | 1 | D1 | **2** (pérdida de borradores) |
| 06 | [Matafuego faltante](06-matafuego-faltante.md) | 1 | — | F1 | **2** (obliga a inventar datos) |
| 03 | [Corrección de producción](03-correccion-produccion.md) | 1 | — | C1 | **2** (función sin interfaz) |
| 08 | [Consultas e historial](08-consultas-historial.md) | 2 | 5 | H1 | **3** |
| 07 | [Uso diario](07-uso-diario.md) | — | 6 | G1 | **3** |

## Bloques de implementación propuestos (Fase 3, tras aprobación)

1. ✅ **Bloque 1 (implementado el 2026-10-22, sin commit), datos correctos sin decisiones pendientes:** spec 02 (cargas atrasadas), spec 05 (idempotencia persistente) y el defecto H-08.1 del panel técnico. Son defectos que hoy duplican registros o rechazan datos válidos, y no dependen de tu respuesta.
2. ✅ **Bloque 2 (implementado el 2026-10-22), consumos:** spec 01 con D21.
3. ✅ **Bloque 3 (implementado el 2026-10-22), no perder lo cargado:** spec 04, y spec 06 después de F1.
4. **Bloque 4, completar circuitos:** spec 03 (después de C1) y la parte de defectos de la spec 08. Spec 03 implementada el 2026-10-27 (Hito 5 de la auditoría): `PUT` con motivo (D25), `CorregirParteDialog` y E2E `sdd-correccion-parte.spec.ts`. El cambio de operario en partes consolidados queda fuera, porque el alta tampoco lo pide. Defecto H-08.2 de la spec 08 resuelto el 2026-10-27 (Hito 6): componente `Paginacion` compartido en Integración, Correcciones, fallas del Panel y los 4 listados que ya paginaban. Los selectores recorren todas las páginas (`todasLasPaginas`) en lugar de cortar en 100. Usos H-08.3 a H-08.6 y H-07.3 resueltos el 2026-10-27 (Hito 7):
   - Producción filtra por máquina y operario; Consumos, por máquina.
   - Viajes se busca por remito (prefijo), camión y camionero.
   - Historial por unidad en `/mantenimiento/unidad/:id`.
   - "Lecturas" (`/lecturas`) muestra las del usuario y su frente.
   - Los filtros de Producción, Viajes, Maquinaria y Usuarios viven en la URL (`useFiltrosUrl`).
   - Pendiente: los controles de matafuego del operario (`GET /maintenance/extinguishers` exige `maintenance.extinguisher.view`).
5. **Bloque 5, uso diario:** spec 07 y el resto de la spec 08. Spec 07 implementada el 2026-10-27 (Hito 8):
   - `GET /me/pending` con conteos por permiso (`PendientesTest`).
   - Inicio por rol con borradores, accesos y pendientes.
   - `ConfirmacionEnvio` persistente en los 4 formularios de campo.
   - Precarga de la última máquina, el camión y el origen (en el equipo).
   - Menú compacto por secciones en el celular.
   - Corregido: abrir un formulario ya no crea un borrador (preselección automática o StrictMode).
   - Corregido: la máquina elegida no se pierde al reagruparse por frente.

El rediseño visual (formato de números, menú en celular, densidad) queda fuera de todos los bloques, como pide `SDD.md`.

## Decisiones de negocio pendientes

Las detalla cada spec. Resumen en [decisiones.md](decisiones.md).
