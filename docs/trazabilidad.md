# Matriz de trazabilidad — RF01 a RF16 y RNF01 a RNF05

> Estado al 2026-10-27, rama `mejoras/auditoria`. Cada requerimiento se rastrea hasta el caso de uso, el endpoint, la pantalla y las pruebas automatizadas que lo demuestran.
> Corridas de referencia: Pest 181/181 · Vitest 79/79 · Playwright 45/45 (más 2/2 offline), contra MariaDB 10.4 y PHP 8.4.
> Rutas abreviadas: `B/` = `backend/app/Contexts/`, `F/` = `frontend/src/features/`, `T/` = `backend/tests/`, `E/` = `frontend/e2e/`.

## Producción (RF01–RF04)

| RF | Caso de uso / regla | Endpoint | Pantalla | Pruebas |
|---|---|---|---|---|
| **RF01** Carga diaria pulpable / aserrable | `B/Production/Application/GestionProduccion::registrar`, `B/Production/Domain/ParteProduccion` | `POST /api/v1/production`, `GET /api/v1/wood-types` | `F/production/ParteNuevoPage.tsx` | `T/Feature/Production/ProduccionTest` «valida catálogo, magnitudes y fecha» · `T/Unit/ParteProduccionTest` · `E/fase2` «el encargado carga un parte consolidado» |
| **RF02** Producción por frente, operario y máquina | `GestionProduccion::validar` (asignación en la fecha, D12); máquina de otro frente permitida (D30) | `POST /api/v1/production`, `GET /api/v1/front-assignments?usuario&fecha` | `ParteNuevoPage.tsx` (frentes por jornada, aviso de máquina trasladada) | `ProduccionTest` «rechaza al usuario que no estaba asignado… (D12)» y «D30: acepta una máquina que figura en otro frente» · `ParteNuevoPage.test` «D30» |
| **RF03** Consolidada (encargados) / individual (Prusia) | `ParteProduccion::validar` + `Frentes/Domain/ModalidadProduccion` (D04) | `POST /api/v1/production` | `ParteNuevoPage.tsx` (indica la modalidad del frente) | `ProduccionTest` «el encargado de Papel Misionero carga consolidada», «el operario de Prusia carga individual», «rechaza la carga que no corresponde a la modalidad» · `E/fase2` |
| **RF04** Respaldo fotográfico opcional | `GestionProduccion::adjuntarFoto` (disco privado, auditado) | `POST/GET /api/v1/production/{id}/photo` | `ParteNuevoPage.tsx` (foto), `ProduccionPage.tsx` («Adjuntar» / «Ver») | `ProduccionTest` «el autor adjunta una foto de respaldo (RF04)», «rechaza archivos que no son imagen…» · `E/fase2` |
| *(D18, D25)* Corrección del parte por su autor, con motivo | `GestionProduccion::corregir` | `PUT /api/v1/production/{id}` | `F/production/CorregirParteDialog.tsx` | `ProduccionTest` «D25 / CA-03.1», «CA-03.3» · `ProduccionPage.test` CA-03.1 a CA-03.4 · `E/sdd-correccion-parte` |

## Logística (RF05–RF08)

| RF | Caso de uso / regla | Endpoint | Pantalla | Pruebas |
|---|---|---|---|---|
| **RF05** Declaración digital del viaje (origen Papel Misionero o Prusia) | `B/Logistics/Application/GestionLogistica::declarar` | `POST /api/v1/logistics/trips` | `F/logistics/ViajeNuevoPage.tsx` | `T/Feature/Logistics/LogisticaTest` «el camionero declara un viaje y nace PENDIENTE», «solo Papel Misionero y Prusia son origen (RF05)» · `E/fase3` |
| **RF06** Administración asocia el remito | `GestionLogistica::cargarRemito` | `POST /api/v1/logistics/remitos` | `F/logistics/RemitoDialog.tsx` desde `ViajesPage.tsx` | `LogisticaTest` «no hay forma de validar sin remito ni de cargar dos remitos» · `E/fase3` |
| **RF07** `VALIDADO` solo por coincidencia exacta | `B/Logistics/Domain/Cotejo` (igualdad a 2 decimales, D06) | (el cotejo corre al cargar o corregir el remito; no hay ruta para forzar el estado) | `ViajesPage.tsx` (estado en texto) | `LogisticaTest` «remito idéntico → VALIDADO automáticamente (RF07)» · `T/Unit/CotejoTest` · `E/fase3` |
| **RF08** Solicitud de corrección por volumen, madera o transportista | `Cotejo` + `GestionLogistica::corregir` (D05, D19: motivo y recotejo) | `GET /api/v1/logistics/corrections`, `POST …/{id}/review`, `POST …/{id}/resolve` | `F/logistics/CorreccionesPage.tsx` | `LogisticaTest` «cada incongruencia genera CORRECCION_SOLICITADA (RF08)», «corrección completa (D19)» · `Logistica.test` · `E/fase3` |

## Mantenimiento (RF09–RF11) y RNF05

| RF | Caso de uso / regla | Endpoint | Pantalla | Pruebas |
|---|---|---|---|---|
| **RF09** Lectura semanal (horómetro / kilometraje), corte los lunes | `B/Maintenance/Application/GestionMantenimiento::registrarLectura`, `Maintenance/Domain/ReglaLectura`, `Maquinaria/Domain/Metrica`; solo sobre unidades asignadas (D28) | `POST /api/v1/maintenance/readings`, `GET …/units/{id}/last-reading`, `GET …/panel` | `F/maintenance/LecturaNuevaPage.tsx`, `PanelPage.tsx`, `MisLecturasPage.tsx` | `MantenimientoTest` «la unidad decide la métrica», «el panel marca qué unidades tienen lectura desde el lunes (RF09)», «D28: …» · `E/fase4` · `PendientesTest` (unidades sin lectura de la semana) |
| **RF10** Fallas notificadas a Mantenimiento | `GestionMantenimiento::registrarLectura` (falla) y `::atenderFalla` (ADR-003, D20) | `GET /api/v1/maintenance/failures`, `POST …/failures/{id}/attend` | `LecturaNuevaPage.tsx`, `PanelPage.tsx` (contador en el menú), `HistorialUnidadPage.tsx` | `MantenimientoTest` «falla de punta a punta (RF10)» · `E/fase4` «falla de punta a punta» |
| **RF11** Control mensual de matafuegos | `GestionMantenimiento::registrarControl`, `ReglaMatafuego` (D15, D24) | `POST/GET /api/v1/maintenance/extinguishers` | `F/maintenance/MatafuegoNuevoPage.tsx`, `PanelPage.tsx`, `HistorialUnidadPage.tsx` | `MantenimientoTest` «control mensual de matafuegos (RF11)» · `T/Feature/Sdd/MatafuegoFaltanteTest` · `T/Unit/ReglaMatafuegoTest` · `E/fase4`, `E/sdd-bloque3` |
| **RNF05** Sin lecturas menores a la anterior; aviso en tiempo real | `ReglaLectura` con bloqueo de fila por unidad (D08); aviso en el cliente `F/maintenance/avisoLectura.ts` | `POST /api/v1/maintenance/readings` | `LecturaNuevaPage.tsx` (lectura anterior a la vista, envío bloqueado) | `MantenimientoTest` «…la siguiente no puede ser menor (RNF05)», «la validación bloquea la unidad…», «una lectura atrasada debe quedar entre la anterior y la posterior (D08)» · `T/Unit/ReglaLecturaTest` · `avisoLectura.test` · `E/fase4` «dos cargas simultáneas…» · `E/sdd-bloque1` |

## Sistema externo de gastos e insumos (RF12–RF13)

| RF | Caso de uso / regla | Endpoint | Pantalla | Pruebas |
|---|---|---|---|---|
| **RF12** Exportación automática de lecturas validadas | `B/ExternalCosts/Application/GestionIntegracion::exportarLectura` (después de responder; un error no revierte la lectura; ADR-004) | automático tras `POST /maintenance/readings`; reintento `POST /api/v1/integrations/exports/retry` | `F/integration/IntegracionPage.tsx` (pendientes y reintento) | `IntegracionTest` «una lectura válida se exporta sola…», «si el envío falla, la lectura queda guardada y pendiente…» · `E/fase5` |
| **RF13** Importación del consolidado mensual de combustible | `GestionIntegracion::importar`, `ExternalCosts/Domain/Consolidado` (D21: reemplazo total o nulo) | `POST /api/v1/integrations/imports`, `GET …/batches`, `GET …/consumptions`, `GET …/simulator/consumptions` | `IntegracionPage.tsx` (historial paginado) | `IntegracionTest` «importa el consolidado…», «falla parcial…», «CA-01.1», «CA-01.5», «CA-08.2» · `T/Unit/ConsolidadoTest` · `E/fase5` |

## Reportes (RF14–RF16)

| RF | Caso de uso / regla | Endpoint | Pantalla | Pruebas |
|---|---|---|---|---|
| **RF14** Sumatoria quincenal por frente y tipo | `B/Reporting/Domain/Periodos` (quincenas, D10) + consultas de reporte | `GET /api/v1/reports/production/fortnight`, `GET /api/v1/dashboard` | `F/reports/ReportesPage.tsx` (Quincenal), `DashboardPage.tsx` | `ReportesTest` «quincenal (RF14)…» · `T/Unit/PeriodosTest` · `E/fase6` |
| **RF15** Consolidado mensual del período vencido antes del día 15 | `Periodos::periodoVencido` + lote vigente (D21) | `GET /api/v1/reports/monthly` | `ReportesPage.tsx` (Consolidado mensual); el inicio avisa si falta importar | `ReportesTest` «mensual (RF15)…», «CA-01.2», «CA-01.3» · `PendientesTest` · `E/fase6` |
| **RF16** Filtros históricos por fechas, máquina, frente y operario | Filtros del listado y del reporte; consumos por máquina (D09: frente y operario no disponibles) | `GET /api/v1/reports/production`, `GET /api/v1/production?unidad&operario&frente&desde&hasta`, `GET /api/v1/reports/consumption?unidad` | `ReportesPage.tsx`, `ProduccionPage.tsx` (filtros en la URL) | `ReportesTest` «filtros históricos (RF16)…», «consumos (D09)…» · `ProduccionPage.test` «CA-08.4» |

## Requerimientos no funcionales

| RNF | Cómo se cumple | Evidencia |
|---|---|---|
| **RNF01** Usabilidad de campo | Una columna, selects y botones grandes, borradores locales, precarga de la última máquina, confirmación persistente con número y datos, menú compacto en el celular, inicio con accesos y pendientes por rol (spec 07) | `InicioPage.test`, `ParteNuevoPage.test`, `LecturaNuevaPage.test` · `E/fase7-accesibilidad` (axe en las pantallas de campo) |
| **RNF02** Inmediatez | Cada carga se confirma contra el backend y queda visible al instante para Administración; sin conexión solo se guardan borradores (D11), nunca "guardado" sin respuesta. Reintentos sin duplicar (D22) | `T/Feature/Sdd/IdempotenciaTest` · `Conectividad.test` · `E/sdd-bloque3` «CA-04.4», `E/sdd-offline` |
| **RNF03** Seguridad / RBAC | Sanctum + matriz rol → permiso (`docs/rbac.md`), verificada en el backend; alcance por frente (D20, D28), historial de asignaciones restringido (D29), cierre de sesión solo con confirmación del servidor | `T/Feature/IdentityAccess/RbacTest`, `T/Unit/MatrizRbacTest`, `FrentesTest` «D29», `ReportesTest` «permisos (RNF03)» · `E/fase6` «un encargado no ve reportes…» · `E/cierre-sesion` |
| **RNF04** Disponibilidad > 99,5 % en la ventana operativa | Preparado, no medible todavía: deploy y runbook listos (ADR-005, `docs/runbook.md`), `/up` verifica la base, backup y restore probados. **Falta el entorno desplegado para medir el uptime.** | `HardeningTest` · `docs/runbook.md` |
| **RNF05** Confiabilidad de lecturas | Ver la fila RNF05 de Mantenimiento | — |

## Límites del alcance que conviene decir en la defensa

- **Sistema externo (RF12–RF13):** el intercambio es por archivos CSV con un contrato versionado (ADR-004), y en la entrega se demuestra con el **simulador** (`GET /integrations/simulator/consumptions`). No hay conexión operativa con el Sistema de Control de Gastos e Insumos real: el adaptador está aislado (anti-corruption layer) para poder reemplazar el simulador sin tocar el dominio.
- **RNF04:** la disponibilidad se sostiene con el diseño de despliegue, pero el 99,5 % solo puede medirse con el sistema en producción.
- **Sin señal (D11):** los borradores no son registros confirmados. La sincronización ocurre cuando el usuario reenvía con conexión.
- **Consumos por frente y operario (D09):** el consolidado externo llega por máquina y mes; el sistema lo informa como "no disponible" en vez de inventar un desglose.
