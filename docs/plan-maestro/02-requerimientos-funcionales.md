# Requerimientos funcionales oficiales

Cada tarjeta representa el relevamiento y la verificación de un requerimiento, no su estado de implementación. La matriz documenta evidencia histórica al 2026-10-27; no se han vuelto a ejecutar sus pruebas ni validado los flujos en esta revisión. Consultar las fuentes para el detalle y decisiones vigentes.

## Tareas

### [HECHO] REQ-001 — RF01: Carga diaria por tipo de madera

- **Capa:** SOLICITADO
- **Fuente:** Context.md sección 8 (RF01); docs/trazabilidad.md (RF01)
- **Contexto propietario:** Producción
- **Dependencias:** FAS-002
- **Alcance:** carga diaria de producción diferenciando estrictamente madera pulpable y aserrable.
- **Fuera de alcance:** cambiar reglas de negocio aprobadas
- **Invariantes:** respetar las decisiones y restricciones documentadas en las fuentes de trazabilidad y docs/discrepancias.md
- **Contratos y archivos previstos:** docs/trazabilidad.md, fila RF01; Context.md sección 8
- **Criterios de aceptación:** RF01 implementado y demostrable; los tests de su fila en docs/trazabilidad.md pasan
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-04
- **Última actualización:** 2026-11-04
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** La matriz del 2026-10-27 registra: `B/Production/Application/GestionProduccion::registrar`, `B/Production/Domain/ParteProduccion`; `POST /api/v1/production`, `GET /api/v1/wood-types`; `F/production/ParteNuevoPage.tsx`; `T/Feature/Production/ProduccionTest` «valida catálogo, magnitudes y fecha» · `T/Unit/ParteProduccionTest` · `E/fase2` «el encargado carga un parte consolidado». Verificación 2026-11-04: suites completas en verde (Pest 185/185, 1016 aserciones; Vitest 93/93 en 21 archivos). E2E Playwright no reejecutado.

### [HECHO] REQ-002 — RF02: Producción por frente, operario y máquina

- **Capa:** SOLICITADO
- **Fuente:** Context.md sección 8 (RF02); docs/trazabilidad.md (RF02)
- **Contexto propietario:** Producción
- **Dependencias:** FAS-002
- **Alcance:** producción parametrizada por frente operativo, operario e ID de máquina.
- **Fuera de alcance:** cambiar reglas de negocio aprobadas
- **Invariantes:** respetar las decisiones y restricciones documentadas en las fuentes de trazabilidad y docs/discrepancias.md
- **Contratos y archivos previstos:** docs/trazabilidad.md, fila RF02; Context.md sección 8
- **Criterios de aceptación:** RF02 implementado y demostrable; los tests de su fila en docs/trazabilidad.md pasan
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-04
- **Última actualización:** 2026-11-04
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** La matriz del 2026-10-27 registra: `GestionProduccion::validar` (asignación en la fecha, D12); máquina de otro frente permitida (D30); `POST /api/v1/production`, `GET /api/v1/front-assignments?usuario&fecha`; `ParteNuevoPage.tsx` (frentes por jornada, aviso de máquina trasladada); `ProduccionTest` «rechaza al usuario que no estaba asignado… (D12)» y «D30: acepta una máquina que figura en otro frente» · `ParteNuevoPage.test` «D30». Verificación 2026-11-04: suites completas en verde (Pest 185/185, 1016 aserciones; Vitest 93/93 en 21 archivos). E2E Playwright no reejecutado.

### [HECHO] REQ-003 — RF03: Producción consolidada e individual

- **Capa:** SOLICITADO
- **Fuente:** Context.md sección 8 (RF03); docs/trazabilidad.md (RF03)
- **Contexto propietario:** Producción
- **Dependencias:** FAS-002
- **Alcance:** encargados de Papel Misionero y Bosques pueden reportar producción consolidada; operarios de Prusia pueden reportarla individualmente.
- **Fuera de alcance:** cambiar reglas de negocio aprobadas
- **Invariantes:** respetar las decisiones y restricciones documentadas en las fuentes de trazabilidad y docs/discrepancias.md
- **Contratos y archivos previstos:** docs/trazabilidad.md, fila RF03; Context.md sección 8
- **Criterios de aceptación:** RF03 implementado y demostrable; los tests de su fila en docs/trazabilidad.md pasan
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-04
- **Última actualización:** 2026-11-04
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** La matriz del 2026-10-27 registra: `ParteProduccion::validar` + `Frentes/Domain/ModalidadProduccion` (D04); `POST /api/v1/production`; `ParteNuevoPage.tsx` (indica la modalidad del frente); `ProduccionTest` «el encargado de Papel Misionero carga consolidada», «el operario de Prusia carga individual», «rechaza la carga que no corresponde a la modalidad» · `E/fase2`. Verificación 2026-11-04: suites completas en verde (Pest 185/185, 1016 aserciones; Vitest 93/93 en 21 archivos). E2E Playwright no reejecutado.

### [HECHO] REQ-004 — RF04: Respaldo fotográfico

- **Capa:** SOLICITADO
- **Fuente:** Context.md sección 8 (RF04); docs/trazabilidad.md (RF04)
- **Contexto propietario:** Producción
- **Dependencias:** FAS-002
- **Alcance:** permitir adjuntar respaldo fotográfico de monitor o planilla de campo. El adjunto es opcional en la Figura 9 y nullable en el diccionario; no se exige foto para toda carga.
- **Fuera de alcance:** cambiar reglas de negocio aprobadas
- **Invariantes:** respetar las decisiones y restricciones documentadas en las fuentes de trazabilidad y docs/discrepancias.md
- **Contratos y archivos previstos:** docs/trazabilidad.md, fila RF04; Context.md sección 8
- **Criterios de aceptación:** RF04 implementado y demostrable; los tests de su fila en docs/trazabilidad.md pasan
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-04
- **Última actualización:** 2026-11-04
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** La matriz del 2026-10-27 registra: `GestionProduccion::adjuntarFoto` (disco privado, auditado); `POST/GET /api/v1/production/{id}/photo`; `ParteNuevoPage.tsx` (foto), `ProduccionPage.tsx` («Adjuntar» / «Ver»); `ProduccionTest` «el autor adjunta una foto de respaldo (RF04)», «rechaza archivos que no son imagen…» · `E/fase2`. Verificación 2026-11-04: suites completas en verde (Pest 185/185, 1016 aserciones; Vitest 93/93 en 21 archivos). E2E Playwright no reejecutado.

### [HECHO] REQ-005 — RF05: Declaración digital de viajes

- **Capa:** SOLICITADO
- **Fuente:** Context.md sección 8 (RF05); docs/trazabilidad.md (RF05)
- **Contexto propietario:** Logística
- **Dependencias:** FAS-003
- **Alcance:** registrar declaraciones digitales de viajes completadas por transportistas, indicando origen Papel Misionero o Prusia y destino. Bosques del Plata es frente de producción, pero no figura como origen habilitado en este RF; ampliarlo requiere un cambio de requerimiento aprobado.
- **Fuera de alcance:** cambiar reglas de negocio aprobadas
- **Invariantes:** respetar las decisiones y restricciones documentadas en las fuentes de trazabilidad y docs/discrepancias.md
- **Contratos y archivos previstos:** docs/trazabilidad.md, fila RF05; Context.md sección 8
- **Criterios de aceptación:** RF05 implementado y demostrable; los tests de su fila en docs/trazabilidad.md pasan
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-04
- **Última actualización:** 2026-11-04
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** La matriz del 2026-10-27 registra: `B/Logistics/Application/GestionLogistica::declarar`; `POST /api/v1/logistics/trips`; `F/logistics/ViajeNuevoPage.tsx`; `T/Feature/Logistics/LogisticaTest` «el camionero declara un viaje y nace PENDIENTE», «solo Papel Misionero y Prusia son origen (RF05)» · `E/fase3`. Verificación 2026-11-04: suites completas en verde (Pest 185/185, 1016 aserciones; Vitest 93/93 en 21 archivos). E2E Playwright no reejecutado.

### [HECHO] REQ-006 — RF06: Asociación de remitos

- **Capa:** SOLICITADO
- **Fuente:** Context.md sección 8 (RF06); docs/trazabilidad.md (RF06)
- **Contexto propietario:** Logística
- **Dependencias:** FAS-003
- **Alcance:** Administración debe asociar y cotejar cada declaración digital con el remito comercial.
- **Fuera de alcance:** cambiar reglas de negocio aprobadas
- **Invariantes:** respetar las decisiones y restricciones documentadas en las fuentes de trazabilidad y docs/discrepancias.md
- **Contratos y archivos previstos:** docs/trazabilidad.md, fila RF06; Context.md sección 8
- **Criterios de aceptación:** RF06 implementado y demostrable; los tests de su fila en docs/trazabilidad.md pasan
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-04
- **Última actualización:** 2026-11-04
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** La matriz del 2026-10-27 registra: `GestionLogistica::cargarRemito`; `POST /api/v1/logistics/remitos`; `F/logistics/RemitoDialog.tsx` desde `ViajesPage.tsx`; `LogisticaTest` «no hay forma de validar sin remito ni de cargar dos remitos» · `E/fase3`. Verificación 2026-11-04: suites completas en verde (Pest 185/185, 1016 aserciones; Vitest 93/93 en 21 archivos). E2E Playwright no reejecutado.

### [HECHO] REQ-007 — RF07: Validación por coincidencia exacta

- **Capa:** SOLICITADO
- **Fuente:** Context.md sección 8 (RF07); docs/trazabilidad.md (RF07)
- **Contexto propietario:** Logística
- **Dependencias:** FAS-003
- **Alcance:** marcar automáticamente un viaje como `VALIDADO` solo cuando exista coincidencia exacta entre la declaración del camionero y los datos del remito físico cargado. No admitir aprobación manual que omita el cotejo ni tolerancias de negocio no aprobadas.
- **Fuera de alcance:** cambiar reglas de negocio aprobadas
- **Invariantes:** respetar las decisiones y restricciones documentadas en las fuentes de trazabilidad y docs/discrepancias.md
- **Contratos y archivos previstos:** docs/trazabilidad.md, fila RF07; Context.md sección 8
- **Criterios de aceptación:** RF07 implementado y demostrable; los tests de su fila en docs/trazabilidad.md pasan
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-04
- **Última actualización:** 2026-11-04
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** La matriz del 2026-10-27 registra: `B/Logistics/Domain/Cotejo` (igualdad a 2 decimales, D06); (el cotejo corre al cargar o corregir el remito; no hay ruta para forzar el estado); `ViajesPage.tsx` (estado en texto); `LogisticaTest` «remito idéntico → VALIDADO automáticamente (RF07)» · `T/Unit/CotejoTest` · `E/fase3`. Verificación 2026-11-04: suites completas en verde (Pest 185/185, 1016 aserciones; Vitest 93/93 en 21 archivos). E2E Playwright no reejecutado.

### [HECHO] REQ-008 — RF08: Solicitud de corrección

- **Capa:** SOLICITADO
- **Fuente:** Context.md sección 8 (RF08); docs/trazabilidad.md (RF08)
- **Contexto propietario:** Logística
- **Dependencias:** FAS-003
- **Alcance:** generar una alerta o Solicitud de Corrección por incongruencias en volumen, tipo de madera o ID de transportista. El flujo de la Figura 10 y este proyecto materializan la Solicitud de Corrección; la falta del dato de transportista en el esquema del remito debe resolverse antes de implementar el cotejo.
- **Fuera de alcance:** cambiar reglas de negocio aprobadas
- **Invariantes:** respetar las decisiones y restricciones documentadas en las fuentes de trazabilidad y docs/discrepancias.md
- **Contratos y archivos previstos:** docs/trazabilidad.md, fila RF08; Context.md sección 8
- **Criterios de aceptación:** RF08 implementado y demostrable; los tests de su fila en docs/trazabilidad.md pasan
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-04
- **Última actualización:** 2026-11-04
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** La matriz del 2026-10-27 registra: `Cotejo` + `GestionLogistica::corregir` (D05, D19: motivo y recotejo); `GET /api/v1/logistics/corrections`, `POST …/{id}/review`, `POST …/{id}/resolve`; `F/logistics/CorreccionesPage.tsx`; `LogisticaTest` «cada incongruencia genera CORRECCION_SOLICITADA (RF08)», «corrección completa (D19)» · `Logistica.test` · `E/fase3`. Verificación 2026-11-04: suites completas en verde (Pest 185/185, 1016 aserciones; Vitest 93/93 en 21 archivos). E2E Playwright no reejecutado.

### [HECHO] REQ-009 — RF09: Lecturas semanales de unidades

- **Capa:** SOLICITADO
- **Fuente:** Context.md sección 8 (RF09); docs/trazabilidad.md (RF09)
- **Contexto propietario:** Mantenimiento
- **Dependencias:** FAS-004
- **Alcance:** registrar semanalmente horómetros de máquinas forestales y kilometrajes de vehículos livianos y camionetas, con corte operativo los lunes. La aplicación de esta captura a otras unidades debe definirse expresamente.
- **Fuera de alcance:** cambiar reglas de negocio aprobadas
- **Invariantes:** respetar las decisiones y restricciones documentadas en las fuentes de trazabilidad y docs/discrepancias.md
- **Contratos y archivos previstos:** docs/trazabilidad.md, fila RF09; Context.md sección 8
- **Criterios de aceptación:** RF09 implementado y demostrable; los tests de su fila en docs/trazabilidad.md pasan
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-04
- **Última actualización:** 2026-11-04
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** La matriz del 2026-10-27 registra: `B/Maintenance/Application/GestionMantenimiento::registrarLectura`, `Maintenance/Domain/ReglaLectura`, `Maquinaria/Domain/Metrica`; solo sobre unidades asignadas (D28); `POST /api/v1/maintenance/readings`, `GET …/units/{id}/last-reading`, `GET …/panel`; `F/maintenance/LecturaNuevaPage.tsx`, `PanelPage.tsx`, `MisLecturasPage.tsx`; `MantenimientoTest` «la unidad decide la métrica», «el panel marca qué unidades tienen lectura desde el lunes (RF09)», «D28: …» · `E/fase4` · `PendientesTest` (unidades sin lectura de la semana). Verificación 2026-11-04: suites completas en verde (Pest 185/185, 1016 aserciones; Vitest 93/93 en 21 archivos). E2E Playwright no reejecutado.

### [HECHO] REQ-010 — RF10: Aviso de fallas a mantenimiento

- **Capa:** SOLICITADO
- **Fuente:** Context.md sección 8 (RF10); docs/trazabilidad.md (RF10)
- **Contexto propietario:** Mantenimiento
- **Dependencias:** FAS-004
- **Alcance:** notificar fallas instrumentales o sensores dañados al área de Mantenimiento.
- **Fuera de alcance:** cambiar reglas de negocio aprobadas
- **Invariantes:** respetar las decisiones y restricciones documentadas en las fuentes de trazabilidad y docs/discrepancias.md
- **Contratos y archivos previstos:** docs/trazabilidad.md, fila RF10; Context.md sección 8
- **Criterios de aceptación:** RF10 implementado y demostrable; los tests de su fila en docs/trazabilidad.md pasan
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-04
- **Última actualización:** 2026-11-04
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** La matriz del 2026-10-27 registra: `GestionMantenimiento::registrarLectura` (falla) y `::atenderFalla` (ADR-003, D20); `GET /api/v1/maintenance/failures`, `POST …/failures/{id}/attend`; `LecturaNuevaPage.tsx`, `PanelPage.tsx` (contador en el menú), `HistorialUnidadPage.tsx`; `MantenimientoTest` «falla de punta a punta (RF10)» · `E/fase4` «falla de punta a punta». Verificación 2026-11-04: suites completas en verde (Pest 185/185, 1016 aserciones; Vitest 93/93 en 21 archivos). E2E Playwright no reejecutado.

### [HECHO] REQ-011 — RF11: Control mensual de matafuegos

- **Capa:** SOLICITADO
- **Fuente:** Context.md sección 8 (RF11); docs/trazabilidad.md (RF11)
- **Contexto propietario:** Mantenimiento
- **Dependencias:** FAS-004
- **Alcance:** registrar mensualmente estado y vencimiento de matafuegos por cada unidad móvil de la flota. Qué tipos de maquinaria entran en ese universo debe definirse (ver D15 en `docs/discrepancias.md`).
- **Fuera de alcance:** cambiar reglas de negocio aprobadas
- **Invariantes:** respetar las decisiones y restricciones documentadas en las fuentes de trazabilidad y docs/discrepancias.md
- **Contratos y archivos previstos:** docs/trazabilidad.md, fila RF11; Context.md sección 8
- **Criterios de aceptación:** RF11 implementado y demostrable; los tests de su fila en docs/trazabilidad.md pasan
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-04
- **Última actualización:** 2026-11-04
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** La matriz del 2026-10-27 registra: `GestionMantenimiento::registrarControl`, `ReglaMatafuego` (D15, D24); `POST/GET /api/v1/maintenance/extinguishers`; `F/maintenance/MatafuegoNuevoPage.tsx`, `PanelPage.tsx`, `HistorialUnidadPage.tsx`; `MantenimientoTest` «control mensual de matafuegos (RF11)» · `T/Feature/Sdd/MatafuegoFaltanteTest` · `T/Unit/ReglaMatafuegoTest` · `E/fase4`, `E/sdd-bloque3`. Verificación 2026-11-04: suites completas en verde (Pest 185/185, 1016 aserciones; Vitest 93/93 en 21 archivos). E2E Playwright no reejecutado.

### [HECHO] REQ-012 — RF12: Exportación automática de lecturas

- **Capa:** SOLICITADO
- **Fuente:** Context.md sección 8 (RF12); docs/trazabilidad.md (RF12)
- **Contexto propietario:** Integración externa
- **Dependencias:** FAS-005
- **Alcance:** exportar automáticamente las lecturas instrumentales ya validadas al Sistema de Control de Gastos e Insumos para habilitar la liquidación externa. La Figura 11 valida, almacena y luego exporta; no establece una aprobación humana adicional obligatoria.
- **Fuera de alcance:** cambiar reglas de negocio aprobadas
- **Invariantes:** respetar las decisiones y restricciones documentadas en las fuentes de trazabilidad y docs/discrepancias.md
- **Contratos y archivos previstos:** docs/trazabilidad.md, fila RF12; Context.md sección 8
- **Criterios de aceptación:** RF12 implementado y demostrable; los tests de su fila en docs/trazabilidad.md pasan
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-04
- **Última actualización:** 2026-11-04
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** La matriz del 2026-10-27 registra: `B/ExternalCosts/Application/GestionIntegracion::exportarLectura` (después de responder; un error no revierte la lectura; ADR-004); automático tras `POST /maintenance/readings`; reintento `POST /api/v1/integrations/exports/retry`; `F/integration/IntegracionPage.tsx` (pendientes y reintento); `IntegracionTest` «una lectura válida se exporta sola…», «si el envío falla, la lectura queda guardada y pendiente…» · `E/fase5`. Verificación 2026-11-04: suites completas en verde (Pest 185/185, 1016 aserciones; Vitest 93/93 en 21 archivos). E2E Playwright no reejecutado.

### [HECHO] REQ-013 — RF13: Importación mensual de combustible

- **Capa:** SOLICITADO
- **Fuente:** Context.md sección 8 (RF13); docs/trazabilidad.md (RF13)
- **Contexto propietario:** Integración externa
- **Dependencias:** FAS-005
- **Alcance:** importar el consolidado mensual de combustible del sistema externo, con litros y costos por máquina/vehículo.
- **Fuera de alcance:** cambiar reglas de negocio aprobadas
- **Invariantes:** respetar las decisiones y restricciones documentadas en las fuentes de trazabilidad y docs/discrepancias.md
- **Contratos y archivos previstos:** docs/trazabilidad.md, fila RF13; Context.md sección 8
- **Criterios de aceptación:** RF13 implementado y demostrable; los tests de su fila en docs/trazabilidad.md pasan
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-04
- **Última actualización:** 2026-11-04
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** La matriz del 2026-10-27 registra: `GestionIntegracion::importar`, `ExternalCosts/Domain/Consolidado` (D21: reemplazo total o nulo); `POST /api/v1/integrations/imports`, `GET …/batches`, `GET …/consumptions`, `GET …/simulator/consumptions`; `IntegracionPage.tsx` (historial paginado); `IntegracionTest` «importa el consolidado…», «falla parcial…», «CA-01.1», «CA-01.5», «CA-08.2» · `T/Unit/ConsolidadoTest` · `E/fase5`. Verificación 2026-11-04: suites completas en verde (Pest 185/185, 1016 aserciones; Vitest 93/93 en 21 archivos). E2E Playwright no reejecutado.

### [HECHO] REQ-014 — RF14: Sumatoria quincenal de producción

- **Capa:** SOLICITADO
- **Fuente:** Context.md sección 8 (RF14); docs/trazabilidad.md (RF14)
- **Contexto propietario:** Reportes
- **Dependencias:** FAS-006
- **Alcance:** automatizar sumatoria quincenal de producción por unidad/frente y tipo de producto.
- **Fuera de alcance:** cambiar reglas de negocio aprobadas
- **Invariantes:** respetar las decisiones y restricciones documentadas en las fuentes de trazabilidad y docs/discrepancias.md
- **Contratos y archivos previstos:** docs/trazabilidad.md, fila RF14; Context.md sección 8
- **Criterios de aceptación:** RF14 implementado y demostrable; los tests de su fila en docs/trazabilidad.md pasan
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-04
- **Última actualización:** 2026-11-04
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** La matriz del 2026-10-27 registra: `B/Reporting/Domain/Periodos` (quincenas, D10) + consultas de reporte; `GET /api/v1/reports/production/fortnight`, `GET /api/v1/dashboard`; `F/reports/ReportesPage.tsx` (Quincenal), `DashboardPage.tsx`; `ReportesTest` «quincenal (RF14)…» · `T/Unit/PeriodosTest` · `E/fase6`. Verificación 2026-11-04: suites completas en verde (Pest 185/185, 1016 aserciones; Vitest 93/93 en 21 archivos). E2E Playwright no reejecutado.

### [HECHO] REQ-015 — RF15: Reporte consolidado del período vencido

- **Capa:** SOLICITADO
- **Fuente:** Context.md sección 8 (RF15); docs/trazabilidad.md (RF15)
- **Contexto propietario:** Reportes
- **Dependencias:** FAS-006
- **Alcance:** unificar todos los datos operativos y de insumos en el reporte consolidado de gastos disponible para Gerencia antes del día 15 de cada mes, correspondiente al período vencido. La narrativa identifica el mes anterior; las menciones a entrega el día 15 describen el circuito actual y no sustituyen el plazo del nuevo sistema.
- **Fuera de alcance:** cambiar reglas de negocio aprobadas
- **Invariantes:** respetar las decisiones y restricciones documentadas en las fuentes de trazabilidad y docs/discrepancias.md
- **Contratos y archivos previstos:** docs/trazabilidad.md, fila RF15; Context.md sección 8
- **Criterios de aceptación:** RF15 implementado y demostrable; los tests de su fila en docs/trazabilidad.md pasan
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-04
- **Última actualización:** 2026-11-04
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** La matriz del 2026-10-27 registra: `Periodos::periodoVencido` + lote vigente (D21); `GET /api/v1/reports/monthly`; `ReportesPage.tsx` (Consolidado mensual); el inicio avisa si falta importar; `ReportesTest` «mensual (RF15)…», «CA-01.2», «CA-01.3» · `PendientesTest` · `E/fase6`. Verificación 2026-11-04: suites completas en verde (Pest 185/185, 1016 aserciones; Vitest 93/93 en 21 archivos). E2E Playwright no reejecutado.

### [HECHO] REQ-016 — RF16: Filtros históricos de producción y consumos

- **Capa:** SOLICITADO
- **Fuente:** Context.md sección 8 (RF16); docs/trazabilidad.md (RF16)
- **Contexto propietario:** Reportes
- **Dependencias:** FAS-006
- **Alcance:** filtros históricos de producción y consumos por rango de fechas, máquina, unidad/frente y operario. El formato mensual importado aún debe definir cómo soportará rango de fechas y operario para consumos.
- **Fuera de alcance:** cambiar reglas de negocio aprobadas
- **Invariantes:** respetar las decisiones y restricciones documentadas en las fuentes de trazabilidad y docs/discrepancias.md
- **Contratos y archivos previstos:** docs/trazabilidad.md, fila RF16; Context.md sección 8
- **Criterios de aceptación:** RF16 implementado y demostrable; los tests de su fila en docs/trazabilidad.md pasan
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-04
- **Última actualización:** 2026-11-04
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** La matriz del 2026-10-27 registra: Filtros del listado y del reporte; consumos por máquina (D09: frente y operario no disponibles); `GET /api/v1/reports/production`, `GET /api/v1/production?unidad&operario&frente&desde&hasta`, `GET /api/v1/reports/consumption?unidad`; `ReportesPage.tsx`, `ProduccionPage.tsx` (filtros en la URL); `ReportesTest` «filtros históricos (RF16)…», «consumos (D09)…» · `ProduccionPage.test` «CA-08.4». Verificación 2026-11-04: suites completas en verde (Pest 185/185, 1016 aserciones; Vitest 93/93 en 21 archivos). E2E Playwright no reejecutado.
