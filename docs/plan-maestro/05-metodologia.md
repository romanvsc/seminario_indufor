# Metodología de trabajo

## Tareas

### [PARCIAL] MET-001 — Adoptar ODD y memoria Engram para Claude y Codex

- **Capa:** SOLICITADO
- **Fuente:** plan aprobado por el usuario el 2026-11-04 para sustituir SDD por ODD e instalar Engram para ambos agentes
- **Contexto propietario:** coordinación y herramientas del proyecto
- **Dependencias:** ninguna
- **Alcance:** instrucciones ODD compartidas, registro de todas las tareas, transición histórica de SDD, instalación e integración local de Engram para Claude y Codex
- **Fuera de alcance:** cambios funcionales en INDUFOR; publicación de memorias o sincronización externa
- **Invariantes:** preservar cambios locales, decisiones y trazabilidad; plan maestro como registro de tareas; no guardar secretos en memoria
- **Contratos y archivos previstos:** AGENTS.md, CLAUDE.md, Context.md, SDD.md, specs/README.md y [documento ODD](../../odd/tasks/adoptar-odd.md); configuración oficial de Engram para ambos clientes
- **Criterios de aceptación:** reglas coherentes en ambos agentes; antecedentes SDD preservados; plan validado; Engram operativo y misma memoria de proyecto comprobada con ambos clientes o limitación explícita de integración pendiente
- **Responsable:** Codex
- **Fecha de inicio:** 2026-11-04
- **Última actualización:** 2026-11-04
- **Próximo paso:** iniciar nuevas sesiones de Claude y Codex y comprobar desde las herramientas MCP de ambos la escritura y lectura de una misma observación del proyecto; reconciliar el documento ODD con su copia de Engram.
- **Evidencia actual:** ODD.md, AGENTS.md, CLAUDE.md y Context.md actualizados; SDD.md y specs conservados como historia. Engram 3.6.2 y dependencia jq 1.8.2 instalados de releases oficiales con SHA-256 verificado; configuración oficial de ambos clientes completada. `claude mcp get engram`: Connected; `codex mcp get engram`: habilitado; el MCP ejecutado directamente detecta `seminario_indufor` y guardó y recuperó íntegra la copia del documento ODD en `odd/adoptar-odd/tasks` (observación 1); `engram doctor --project seminario_indufor`: 10 comprobaciones correctas. `roadmap.py check`: 48 tareas válidas; `git diff --check` sin errores. Falta comprobar acceso efectivo de los agentes en sesiones reiniciadas y lectura/escritura compartida entre ellos; configuración y conexión no acreditan ese intercambio.
