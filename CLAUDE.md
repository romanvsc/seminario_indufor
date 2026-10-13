# INDUFOR SRL — Sistema Integral de Gestión y Control

Sistema web (PWA) que digitaliza producción forestal, logística/remitos, mantenimiento y consumos de Indufor SRL. Es la parte construida del **TP Final de Seminario** (Tecnicatura en Análisis de Sistemas, IAES 2026).

## Fuentes, en orden de precedencia

1. Consigna de la cátedra: `C:\Users\roman\Desktop\Estudios\iAes\Sistemas\TP FINAL\TP_FINAL_SEMINARIO.md` (resumen en `Context.md` §24).
2. RF/RNF del PDF `TRABAJO PRACTICO FINAL - TERCER ADELANTO.docx.pdf` (secciones 3.2–3.3).
3. ADRs aprobados en `docs/adr/`.
4. `Context.md` (contexto técnico y funcional completo) y `docs/`:
   - `docs/database.md`: esquema de `indufor_db`.
   - `docs/discrepancias.md`: D01–D16 resueltas o decididas en forma provisoria (revisar en producción). Respetarlas; cambiarlas exige actualizar esquema y DER.
   - `docs/cambios-pdf.md`: correcciones pendientes del PDF.
   - `docs/rbac.md`: matriz rol → permiso (aprobada).
   - `docs/design-tokens.md` y `docs/ui-react-bits.md`: colores de marca, tokens y componentes de React Bits elegidos.
5. Este archivo, luego skills, tests e implementación.

Leer `Context.md` antes de cualquier tarea que no sea trivial.

## Estado actual

**Fase 0 — Harness.** No se escribe código de aplicación hasta cumplir el gate de `Context.md` §5.

## Flujo obligatorio

**Auditar → Planificar → Programar** (`Context.md` §2). Declarar ambigüedades antes de asumir una regla de negocio. No inventar reglas: si falta una definición, registrarla en `docs/discrepancias.md`.

## Stack

Laravel + Sanctum (API `/api/v1`, arquitectura hexagonal) · React + TypeScript + Vite (SPA separada) · TanStack Query · React Hook Form + Zod · Tailwind con tokens semánticos · shadcn/ui · React Bits solo como acento visual, nunca en pantallas de campo · PWA con `vite-plugin-pwa` · MySQL/MariaDB `indufor_db` · Pest/PHPUnit, Vitest + RTL, Playwright.

## Reglas que no se negocian

- **DER = base implementada.** Toda migración de dominio se refleja en la sección 5 del PDF (DER, relacional, normalización, diccionario) o se anota en `docs/cambios-pdf.md`.
- **Todos los RF01–RF16 deben quedar implementados y demostrables.**
- Test-gated: no hay cambio terminado con tests pendientes, omitidos o fallando.
- Autorización siempre en backend; ocultar botones no es seguridad.
- Un viaje solo pasa a `VALIDADO` por cotejo exacto con su remito (RF07).
- Ninguna lectura de horómetro o kilometraje puede ser inferior a la anterior de la misma unidad (RNF05).
- El Sistema de Control de Gastos e Insumos es externo: se accede solo por su adaptador (anti-corruption layer).
- Nunca informar "guardado" o "sincronizado" sin confirmación del backend.
- Sin colores Tailwind arbitrarios cuando exista un token semántico.

## Skills

| Tarea | Skills |
|---|---|
| Dominio, bounded contexts, RBAC | `indufor-domain-map`, `clean-ddd-hexagonal` |
| Producción (RF01–RF04) | `indufor-production-rules` |
| Viajes y remitos (RF05–RF08) | `indufor-logistics-remito-validation` |
| Lecturas, fallas, matafuegos (RF09–RF12, RNF05) | `indufor-maintenance-meter-rules` |
| Sistema externo (RF12–RF13) | `indufor-external-costs-integration` |
| Reportes y dashboard (RF14–RF16) | `indufor-managerial-reporting` |
| Auditoría y trazabilidad | `indufor-traceability-audit` |
| Backend, API, migraciones, policies | `indufor-laravel-backend` |
| Frontend React y PWA | `indufor-react-frontend` |
| Pantallas de campo | `indufor-field-mobile-ux` |
| UI general / cierre visual | `ui-ux-pro-max` / `impeccable`, `design:accessibility-review` |
| Tests | `indufor-testing-qa` |
| ADRs y sincronía con el PDF | `indufor-adr-docs` |
| Seguridad / PR | `/security-review` / `/code-review` |

Checklists de inicio y cierre de tarea: `Context.md` §26–27.
