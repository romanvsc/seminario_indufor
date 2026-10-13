---
name: indufor-testing-qa
description: Estrategia de testing de INDUFOR - desarrollo test-gated, qué tests escribir por capa (dominio, aplicación, infraestructura, API, frontend, PWA, E2E), tests RBAC, los 10 E2E mínimos, el gate para cerrar fases y cómo convertir los tests en la tabla de casos de prueba de la sección 8 del TP. Úsala siempre que se implemente o cambie cualquier funcionalidad, se corrija un bug, se cierre una tarea o fase, se configure Pest, Vitest, Playwright o CI, o se prepare la sección "Validación y Pruebas" del TP.
---

# Testing y QA de INDUFOR

Dos razones hacen que los tests sean obligatorios acá: las reglas críticas (cotejo exacto, no regresión, idempotencia) fallan en silencio si no se prueban, y la cátedra pide **casos de prueba con resultado esperado y obtenido** (sección 8.1) y **evidencia** de que los requerimientos están implementados. Los tests son esa evidencia.

Fuentes: `Context.md` §2.4, §3 (Testing), §19 (gate), §20, §26–27.

## Regla por cambio

1. Antes de programar, decir qué tests validarán el cambio.
2. Escribir o actualizar primero los tests unitarios de la lógica.
3. Implementar.
4. Ejecutar los tests afectados, la regresión del contexto y, si corresponde, los de RBAC/seguridad y frontend/PWA.
5. No cerrar con tests rojos, omitidos o `skip` sin justificación escrita.

Un bug corregido deja un test que lo reproduce.

## Qué probar en cada capa

| Capa | Herramienta | Qué |
|---|---|---|
| Domain | Pest (sin base de datos) | Reglas puras, transiciones de estado, cotejo, no regresión, períodos |
| Application | Pest | Casos de uso, autorización del caso de uso, transacciones |
| Infrastructure | Pest + base de prueba | Repositorios, mapeo Eloquent ↔ dominio, adaptadores, archivos |
| API | Pest feature | 2xx, 401, 403, 422, paginación y filtros por endpoint |
| Arquitectura | Pest `arch()` | Domain sin `Illuminate\*`; ningún contexto usa el adaptador externo directamente |
| Frontend | Vitest + Testing Library | Formularios, estados pendiente/error, permisos visuales |
| PWA | Vitest + Playwright | Manifest, registro y actualización del SW, cache, offline → online sin duplicados |
| E2E | Playwright | Los 10 flujos de abajo, en viewport móvil para los de campo |

**RBAC:** un test por permiso sensible que pruebe el acceso permitido y el denegado. La matriz rol → permiso se prueba con un dataset.

## E2E mínimos (`Context.md` §20)

1. Encargado registra producción consolidada.
2. Operario de Prusia registra producción individual.
3. Camionero declara viaje → Administración carga remito → viaje validado.
4. Remito incongruente → solicitud de corrección.
5. Lectura válida → persistencia.
6. Lectura inferior → rechazo.
7. Falla → visible y notificada a Mantenimiento.
8. Importación mensual → consolidado disponible.
9. Gerencia consulta el dashboard.
10. Usuario sin permiso pide un reporte financiero → acceso denegado.

## Del test al TP (sección 8)

Mantener `docs/casos-de-prueba.md` con una fila por caso relevante:

| ID | RF/RNF | Caso de prueba | Resultado esperado | Resultado obtenido | Test |
|---|---|---|---|---|---|
| CP-01 | RF03 | Encargado de Papel Misionero carga producción consolidada | Parte guardado con modalidad consolidada | ✅ (fecha de la corrida) | `tests/e2e/produccion-consolidada.spec.ts` |

La columna "resultado obtenido" sale de la última corrida real de la suite, nunca se completa a mano. Cada RF01–RF16 debe tener al menos un caso: es la prueba de que "los requerimientos definidos están implementados".

## Gate de fase

Una fase se cierra con la checklist del **Gate transversal de testing** (`Context.md` §19) completa y la CI en verde. Si la fase rompe algo de una fase anterior, no está terminada.
