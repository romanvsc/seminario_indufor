# INDUFOR SRL — Sistema Integral de Gestión y Control

Sistema web (PWA) que digitaliza producción forestal, logística/remitos, mantenimiento y consumos de Indufor SRL. Es la parte construida del **TP Final de Seminario** (Tecnicatura en Análisis de Sistemas, IAES 2026).

## Ahorro de contexto
- Antes de leer un archivo entero, busca con grep y lee solo lo que necesites.
- Para explorar el proyecto, usa un subagente y tráeme solo el resumen.
- Muéstrame el diff, no el archivo completo.
- No repitas lo que ya hemos decidido en esta sesión.
- Si cambiamos de tarea, propón /compact o una sesión nueva.
- Respuestas cortas por defecto.


## Fuentes, en orden de precedencia

1. Consigna de la cátedra: `C:\Users\roman\Desktop\Estudios\iAes\Sistemas\TP FINAL\TP_FINAL_SEMINARIO.md` (resumen en `Context.md` §24).
2. RF/RNF del PDF `TRABAJO PRACTICO FINAL - TERCER ADELANTO.docx.pdf` (secciones 3.2–3.3).
3. ADRs aprobados en `docs/adr/`.
4. `Context.md` (contexto técnico y funcional completo) y `docs/`:
   - `docs/database.md`: esquema de `indufor_db`.
   - `docs/discrepancias.md`: D01–D20 resueltas o decididas en forma provisoria (revisar en producción). Respetarlas; cambiarlas exige actualizar esquema y DER.
   - `docs/cambios-pdf.md`: correcciones pendientes del PDF.
   - `docs/rbac.md`: matriz rol → permiso (aprobada).
   - `docs/design-tokens.md` y `docs/ui-react-bits.md`: colores de marca, tokens y componentes de React Bits elegidos.
   - `docs/trazabilidad.md`: RF01–RF16 y RNF → caso de uso → endpoint → pantalla → prueba (mantenerla al cambiar un RF).
   - `docs/demo.md`: guion de la defensa; datos con `php artisan db:seed --class=DemoSeeder`.
5. Este archivo, luego skills, tests e implementación.

Leer la ficha de la fase actual en `docs/fases.md` y cargar solo lo que indica. `Context.md` completo solo si la ficha no alcanza.

## Estado actual

**Desarrollo completo: Fases 0–7 cerradas** (gate de Fase 7 cumplido el 2026-10-21: security review, QA con axe, PWA verificada, backup/restore probados, runbook y rollback, CI en verde). RF01–RF16 implementados y demostrables. Deploy preparado y sin publicar (ADR-005): falta elegir el hosting y seguir `docs/runbook.md` §1.

## Herramientas de uso obligatorio

Decisión del 2026-10-13. Toda sesión de trabajo en este repo las usa; no son opcionales.

| Herramienta | Obligación | Estado |
|---|---|---|
| **Ponytail** (plugin) | Activo en toda sesión: el cambio más chico que resuelva la tarea completa. | Instalado |
| **Graphify** | Consultar el grafo del proyecto antes de explorar archivos a mano y se regenera solo al final de cada respuesta (hook `Stop` en `.claude/settings.json` → `graphify update .`). | Instalado (0.9.89) |
| **Agent Skills** | Aplicar su flujo de skills junto con las `indufor-*` en cada tarea. | Instalado (plugin `agent-skills`) |

Si una herramienta no está instalada, se instala antes de seguir con código de aplicación; no se omite en silencio.

En un clon nuevo: `uv tool install graphifyy` y `graphify update .` (el grafo, `graphify-out/`, no se versiona).

## Flujo obligatorio

Aplicar [ODD](ODD.md): explorar requisitos y código, registrar toda tarea en el plan maestro, implementar lo autorizado y verificar proporcionalmente. Los trabajos que requieren continuidad tienen documento ODD y copia en Engram; los pequeños usan el plan maestro. Una auditoría explícitamente de solo lectura no modifica archivos. Declarar ambigüedades antes de asumir una regla de negocio; registrar definiciones pendientes en `docs/discrepancias.md` cuando haya autorización para escribir.

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

## Agentes (`.claude/agents/`)

Delegar en el agente del área; cada uno precarga sus skills y carga el resto según la tarea. Las marcadas *(usuario)* tienen `disable-model-invocation` y solo se lanzan como comando.

| Agente | Cuándo | Skills |
|---|---|---|
| `ui-designer` | Diseñar o pulir una pantalla, tokens, color, tipografía | `interface-design`, `impeccable`, `ui-ux-pro-max` · `design-system`, `ui-styling`, `better-ui`, `better-colors`, `better-typography`, `better-layout`, `build-design`, `brand`, `design` · `/variant`, `/explain-interface` *(usuario)* |
| `ui-reviewer` | Auditar UI y accesibilidad (solo lectura) | `better-interface`, `better-accessibility`, `web-design-guidelines` · `antislop` · `/interface-review`, `/break` *(usuario)* |
| `react-engineer` | Programar en `frontend/` | `indufor-react-frontend`, `vercel-react-best-practices`, `vercel-composition-patterns` · `vercel-react-view-transitions`, `vercel-react-native-skills` (no aplica: PWA) · `/state-machine` *(usuario)* |
| `ux-writer` | Microcopy, errores, estados vacíos, docs | `better-writing`, `writing-guidelines` |
| `presentation-designer` | Defensa del TP: diapositivas y gráficos | `slides`, `banner-design` · `brand`, `teardown` |
| `deploy-engineer` | DEP-001: publicación (ADR-005) | `deploy-to-vercel`, `vercel-cli-with-tokens`, `vercel-optimize` (Vercel solo sirve para la SPA) |

Origen (2026-11-04): `Dammyjay93/interface-design@2f9be32`, `pbakaus/impeccable@5af4319` (4.8.0), `jakubkrehel/skills@60bf140`, `nextlevelbuilder/ui-ux-pro-max-skill@ccce51c`, `vercel-labs/agent-skills@1a2c79d`. Las copias de proyecto de `impeccable` y `ui-ux-pro-max` reemplazan a las de `~/.claude/skills`.

Checklists de inicio y cierre de tarea: `Context.md` §26–27.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
