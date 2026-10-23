# 08 — Consultas e historial

Estado: **aprobado el 2026-10-22** con las opciones recomendadas (`docs/discrepancias.md` D21–D27).

## Problema y evidencia

| ID | Tipo | Hallazgo | Evidencia |
|---|---|---|---|
| H-08.1 | Defecto | El panel técnico muestra "— h" como última lectura cuando la lectura más reciente es una falla sin valor, aunque la unidad tiene lecturas anteriores con valor. Confunde a Mantenimiento. | [código] `MantenimientoController.php:150` (subconsulta de la última lectura sin filtrar valor nulo), `:158-159`, `:168`. [observado] HV-E2E4 muestra "— h · 21/10/2026 18:56" aunque tiene lecturas anteriores con valor (1000 h y la que ganó la prueba concurrente). |
| H-08.2 | Defecto | Varias listas muestran **solo la primera página**, sin forma de ver la siguiente. Datos que existen quedan inaccesibles desde la interfaz. | [código] Backend: `IntegracionController.php:30` (`paginate(30)`), `LogisticaController.php:116` (`paginate(50)`, correcciones), `MantenimientoController.php:106` (`paginate(50)`, fallas). El frontend no ofrece paginación en `IntegracionPage.tsx`, `CorreccionesPage.tsx` ni `PanelPage.tsx`. Los selectores cargan como máximo 100 elementos: `fronts/api.ts:45`, `logistics/api.ts:60`, `ParteNuevoPage.tsx:49` y otros. |
| H-08.3 | Uso | Hay filtros del backend que la interfaz no ofrece: producción por **máquina** y **operario** (`ProduccionController.php:38-41`), viajes por **origen** (`LogisticaController.php:33`) y consumos por **unidad** (`ReportesController.php:66`). | [código] Filtros del frontend: `production/api.ts:32`, `logistics/api.ts:45`, `ReportesPage.tsx` (Consumos sin selector de unidad). |
| H-08.4 | Uso | No se puede buscar un viaje por **número de remito**, **camión** ni **camionero**. El backend tampoco tiene esos filtros. | [código] `LogisticaController.php:29-35` (solo estado, fechas y origen). |
| H-08.5 | Uso | No hay pantallas de historial de lecturas, de controles de matafuego ni de fallas atendidas. Los endpoints existen. | [código] `GET /maintenance/readings`, `GET /maintenance/extinguishers` y `GET /maintenance/failures?estado=atendidas` (`backend/routes/api.php`); el frontend solo usa fallas abiertas (`maintenance/api.ts`). |
| H-08.6 | Uso | Los filtros se pierden al navegar porque viven en el estado del componente. | [código] `ProduccionPage.tsx:19`, `ViajesPage.tsx:19`, `MaquinariaPage.tsx:17`, `UsuariosPage.tsx:14`. |
| H-08.7 | Negocio, posterior | Exportar o imprimir reportes y listados. | Pedido en `SDD.md`; no hay RF explícito más allá de RF14 a RF16. |

## Usuarios y tareas

- **Administración:** buscar un remito o un viaje y revisar el historial de importaciones.
- **Mantenimiento:** historial de una unidad (lecturas, fallas atendidas y controles).
- **Gerencia:** filtrar producción por máquina y operario (RF16).

## RF, RNF y decisiones

RF16 (filtros históricos por fechas, máquina, frente y operario) · RF10, RF11 · D09.

## Comportamiento esperado

- **Panel técnico:** muestra el último **valor** conocido con su fecha y, aparte, "última carga: falla sin valor, DD/MM" si corresponde.
- **Paginación:** toda lista paginada del backend ofrece "Anterior / Siguiente" o "Cargar más". Los selectores con más de 100 opciones pasan a buscar por texto.
- **Filtros:** los que exige RF16 están en la interfaz. Viajes se busca por número de remito, camión y camionero.
- **Historial de unidad en Mantenimiento:** lecturas, fallas (abiertas y atendidas, con nota) y controles de matafuego.
- **Filtros en la URL** (`?desde=...`): sobreviven a la navegación y se pueden compartir.

## Alcance y exclusiones

- **Incluye:** H-08.1 a H-08.6.
- **Excluye:** H-08.7 (exportación e impresión) hasta que lo definas en H1. Mientras tanto, la impresión del navegador sobre reportes alcanza para la defensa.

## Reglas e invariantes

- **I-08.1:** los filtros nuevos respetan el alcance de cada permiso. El camionero sigue viendo solo sus viajes, y encargados y operarios solo sus frentes (D20, `production.view`).
- **I-08.2:** la búsqueda por remito es exacta o por prefijo. Nunca se arma SQL con el texto: se usa el query builder.

## Criterios de aceptación

- **CA-08.1**
  - Dado: una unidad con 1200 h el lunes y una lectura con falla sin valor el martes.
  - Entonces: el panel muestra "1200 h (lunes)" y "Última carga: falla sin valor (martes)".
- **CA-08.2**
  - Dado: 35 lotes de integración.
  - Cuando: se abre el historial.
  - Entonces: se pueden ver los 35, paginados.
- **CA-08.3**
  - Dado: 60 solicitudes de corrección abiertas.
  - Entonces: se pueden ver las 60.
- **CA-08.4**
  - Dado: Gerencia en Producción.
  - Cuando: filtra por máquina HV-01 y por operario.
  - Entonces: ve solo esos partes, y la URL conserva los filtros al volver.
- **CA-08.5**
  - Dado: Administración.
  - Cuando: busca el remito "E2E-0002".
  - Entonces: encuentra su viaje.
- **CA-08.6**
  - Dado: un camionero.
  - Cuando: busca un remito de otro camionero.
  - Entonces: no lo encuentra, porque sigue limitado a lo propio.
- **CA-08.7**
  - Dado: Mantenimiento.
  - Cuando: abre una unidad en el panel.
  - Entonces: ve su historial de lecturas, fallas atendidas (con la nota) y controles.

## Decisiones pendientes

- **H1, exportación e impresión:**
  - (a) Imprimir con el navegador, más una hoja de estilos de impresión para Reportes. Es suficiente para la defensa (**recomendada** por ahora).
  - (b) CSV de cada reporte.
  - (c) PDF generado en el servidor.
  - Consecuencias:
    - (b) es poco trabajo, pero agrega un endpoint por reporte;
    - (c) suma una dependencia y no se justifica en v1.

---

## Plan (Fase 2)

- **Diseño mínimo:**
  - **H-08.1:** las subconsultas del panel filtran `whereNotNull` de la métrica para el valor, y se agrega `ultima_carga` aparte.
  - **H-08.2:** un componente `Paginacion` compartido. Ya existe el patrón en `UsuariosPage` y se extrae.
  - **Filtros:** `useSearchParams` de react-router, que ya está instalado.
  - **Remito:** filtros `remito`, `camion` y `camionero` en `LogisticaController::viajes`.
  - **Historial:** una pantalla `/mantenimiento/unidad/:id` que reusa los endpoints existentes.
- **Dependencias:** ninguna crítica. Va después de los bloques 1 a 3.

| Tarea | Criterio | Prueba |
|---|---|---|
| T-08.1 Panel: último valor y última carga | CA-08.1 | `MantenimientoTest` (regresión) |
| T-08.2 Paginación en Integración, Correcciones y fallas | CA-08.2, CA-08.3 | Vitest + Feature |
| T-08.3 Filtros RF16 en Producción y Consumos | CA-08.4 | Vitest + `ProduccionTest` |
| T-08.4 Búsqueda de viajes por remito, camión y camionero | CA-08.5, CA-08.6 | `LogisticaTest` (RBAC) |
| T-08.5 Historial de unidad | CA-08.7 | Vitest + E2E |
| T-08.6 Filtros en la URL | CA-08.4 | Vitest |

- **Riesgos y reversión:** cambios aditivos. Se revierte con el commit.
