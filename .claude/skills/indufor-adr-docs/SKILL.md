---
name: indufor-adr-docs
description: Documentación de decisiones y sincronía documental de INDUFOR - redactar ADRs en docs/adr/, registrar y resolver discrepancias en docs/discrepancias.md, y mantener el PDF del TP (DER, modelo relacional, diccionario, DFD, diagramas de secuencia, secciones 6–8) coherente con lo implementado mediante docs/cambios-pdf.md. Úsala siempre que se tome una decisión técnica duradera (autenticación, offline, notificaciones, formato de integración, cache, colas, deploy), cuando cambie el esquema de la base o un flujo, cuando haya que actualizar Context.md, CLAUDE.md o docs/, o cuando el usuario pregunte qué hay que corregir en el TP.
---

# ADRs y sincronía con el TP

La cátedra desaprueba por **inconsistencia entre análisis, requerimientos e implementación** y exige que **el DER coincida con la base implementada**. El código cambia rápido y el PDF no, así que esta skill existe para que ninguna diferencia quede sin registrar.

Fuentes: `Context.md` §22, §24, §25 · `docs/discrepancias.md` · `docs/cambios-pdf.md` · consigna `C:\Users\roman\Desktop\Estudios\iAes\Sistemas\TP FINAL\TP_FINAL_SEMINARIO.md`.

## ADRs

- Ubicación: `docs/adr/ADR-NNN-titulo-en-kebab.md`, numeración correlativa sin reutilizar números.
- Requeridos para: estrategia de autenticación, offline/PWA, persistencia de archivos, notificaciones, formato de intercambio con el sistema externo, cambios de cardinalidad respecto del DER, tablas de dominio nuevas, cache, colas, infraestructura y deploy.
- ADRs ya previstos: **ADR-001** SPA separada + Sanctum (decidido en `Context.md` §3, falta redactarlo); ADR de offline; ADR-002 formato de errores de la API (aceptado); ADR del contrato de integración (D13).
- Un ADR no puede cambiar un RF por sí solo. Si la decisión cambia el negocio, primero se aprueba el requerimiento.

Plantilla:

```markdown
# ADR-NNN — Título
Status: Propuesto | Aceptado | Reemplazado por ADR-XXX
Date: AAAA-MM-DD
Context:
Decision:
Alternatives:
Consequences:
Affected bounded contexts:
Migration/rollback:
Impacto en el TP: (secciones del PDF que cambian, o "ninguno")
```

## Discrepancias

Cuando aparece algo que el PDF no define o contradice:
1. Agregar una fila `Dnn` en `docs/discrepancias.md` con la evidencia (página física del PDF) y la decisión requerida.
2. No implementar la parte ambigua hasta que se resuelva.
3. Al resolverla: actualizar la fila, el ADR o RF correspondiente y `docs/cambios-pdf.md` si cambia el documento.

## Sincronía con el PDF

Cada cambio que afecte al documento agrega o actualiza una fila en `docs/cambios-pdf.md`:

| Cambio en el código | Qué actualizar en el TP |
|---|---|
| Tabla o columna de dominio nueva o modificada | 5.1 DER, 5.2 modelo relacional, 5.3 normalización si cambian las claves, 5.4 diccionario |
| Cambio de un flujo de producción, cotejo o lecturas | Figuras 9, 10 u 11 |
| RF nuevo o modificado | 3.2, 3.4 matriz de trazabilidad y, si corresponde, alcance (1.4) |
| Tecnología o arquitectura | 6.1 y 6.2 |
| Funcionalidad terminada | 6.3 funcionalidades y 6.4 capturas |
| Test E2E o de regla nueva | 8.1 casos de prueba (`docs/casos-de-prueba.md`) |

Los DFD (2.4) representan el **sistema actual**: no se modifican por cambios del sistema nuevo.

Las correcciones se aplican sobre el documento fuente en Google Drive y los diagramas en diagrams.net, no sobre el PDF exportado. Si no hay acceso a esas herramientas en la sesión, dejar la fila en `docs/cambios-pdf.md` y avisar al usuario.

## Mantenimiento de Context.md y CLAUDE.md

- `CLAUDE.md` es breve (se carga en cada sesión): reglas y punteros. El detalle va a `Context.md` o `docs/`.
- Al mover contenido, actualizar las referencias cruzadas (`§n`, rutas de `docs/`).
- No duplicar reglas: una regla vive en un solo lugar y los demás la referencian.
