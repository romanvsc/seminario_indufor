# Fases de construcción — fichas por sesión

Cada sesión de trabajo lee **solo** la ficha de su fase y lo que ella indica en **Cargar**. `Context.md` completo se abre solo si la ficha no alcanza.

**Siempre, en toda fase:** Graphify antes de explorar código · `indufor-traceability-audit` si hay una acción crítica · `indufor-adr-docs` si cambia el DER o el PDF · gate transversal de testing (`Context.md` §19, al final).

Cada incremento termina en un commit con sus tests en verde.

---

## Fase 1 (resto) — Frentes + Maquinaria

Cerrada el 2026-10-13 (CI en verde). Hecho: 1.1 identidad, RBAC y auditoría (backend) · 1.2 login y usuarios (frontend) · 1.3 frentes y asignaciones (D17) · 1.4 maquinaria · 1.5 E2E (`frontend/e2e`; correr con `npm run e2e`, requiere la base `indufor_db_e2e` y `PHP_BIN` apuntando a PHP 8.4).

- **Alcance:** frentes con `modalidad_produccion` (seed: Papel Misionero y Bosques del Plata CONSOLIDADA, Prusia INDIVIDUAL); `frente_asignado` histórico; `tipo_maquinaria` (con `metrica`) y `maquinaria` mínimas; pantallas de alta y consulta.
- **Cargar:** `indufor-laravel-backend`, `indufor-react-frontend` · `docs/database.md` §12.1, §12.7–12.9 · `docs/rbac.md` (fronts.*, machinery.*) · molde de código: `backend/app/Contexts/IdentityAccess`, `frontend/src/features/users`.
- **Incrementos:** 1.3 frentes + asignaciones (API + UI) · 1.4 maquinaria (API + UI) · 1.5 E2E Playwright (login, usuarios, frentes).
- **Gate:** `fecha_hasta ≥ fecha_desde` y asignaciones históricas consultables · RBAC de fronts/machinery con tests permitido y denegado · asignaciones auditadas · E2E y CI en verde.

## Fase 2 — Producción (RF01–RF04)

Hecho: 2.1 dominio + API (D18) · 2.2 foto de respaldo (disco privado, servida por la API con la misma autorización que el parte) · 2.3 pantalla de campo (borrador local, envío con clave de idempotencia, sin envío offline por D11) y listado con filtros.

- **Alcance:** parte diario; tipos de madera (pulpable/aserrable); modalidad consolidada o individual según frente; foto de respaldo; filtros operativos.
- **Cargar:** `indufor-production-rules`, `indufor-field-mobile-ux` · `Context.md` §8 Producción, §16 Producción · `docs/discrepancias.md` D03, D04, D11, D12, D16 · `docs/database.md` §12.10–12.11.
- **Incrementos:** 2.1 dominio + API · 2.2 foto de respaldo · 2.3 pantalla de campo + listado con filtros.
- **Gate:** flujo Papel/Bosques (consolidado) y Prusia (individual) en tests · usuario fuera de su frente rechazado · trazabilidad de quién registra.

## Fase 3 — Logística y remitos (RF05–RF08)

- **Alcance:** viajes del camionero; carga de remitos; cotejo viaje ↔ remito; estados; solicitudes de corrección.
- **Cargar:** `indufor-logistics-remito-validation` · `Context.md` §8 Logística, §16 Logística · D05, D06, D07 · `docs/database.md` §12.12–12.14.
- **Incrementos:** 3.1 viajes · 3.2 remitos + cotejo · 3.3 correcciones + pantallas.
- **Gate:** ningún viaje `VALIDADO` sin cotejo exacto · cada incongruencia reproducida en un test · flujo de corrección completo y auditado.

## Fase 4 — Mantenimiento (RF09–RF11)

- **Alcance:** lecturas semanales de horómetro/kilometraje; fallas y alertas internas; control mensual de matafuegos; panel técnico.
- **Cargar:** `indufor-maintenance-meter-rules`, `indufor-field-mobile-ux` · `Context.md` §8 Mantenimiento, §16 Mantenimiento · D08, D15 · `docs/database.md` §12.15–12.16.
- **Incrementos:** 4.1 lecturas (RNF05) · 4.2 fallas + alertas · 4.3 matafuegos + panel técnico.
- **Gate:** lectura inferior a la anterior rechazada (incluida la carga concurrente) · falla trazable de punta a punta · control mensual operativo.

## Fase 5 — Sistema externo (RF12–RF13)

- **Alcance:** Anti-Corruption Layer; exportación de lecturas validadas; importación mensual de consumos (CSV v1 + simulador); `integracion_lote`, `consumo_importado`; historial.
- **Cargar:** `indufor-external-costs-integration` · `Context.md` §16 Sistema externo · D13 · `docs/database.md` §13.
- **Incrementos:** 5.1 exportación · 5.2 importación idempotente + historial.
- **Gate:** reintento seguro · archivo duplicado no duplica consumos · errores parciales auditados · el dominio no conoce el formato externo.

## Fase 6 — Reportes y dashboard (RF14–RF16)

- **Alcance:** consolidados quincenal y mensual; filtros históricos; reportes operativos y financieros; dashboard gerencial.
- **Cargar:** `indufor-managerial-reporting` · `Context.md` §16 Reportes · D09, D10 · `docs/ui-react-bits.md` (acentos del dashboard).
- **Incrementos:** 6.1 consolidados · 6.2 reportes operativos y financieros · 6.3 dashboard.
- **Gate:** totales reproducibles · filtros consistentes · permisos financieros verificados · consultas con tiempo aceptable.

## Fase 7 — Hardening + deploy

- **Alcance:** security review, QA completo, design QA, performance e índices, backup/restore, logs, configuración productiva, deploy.
- **Cargar:** `/security-review`, `indufor-testing-qa`, `design:accessibility-review` · `Context.md` §19 Fase 7, §21.
- **Incrementos:** 7.1 revisión y correcciones · 7.2 deploy + runbook + rollback.
- **Gate:** el de Fase 7 en `Context.md` §19. No hay producción sin él.
