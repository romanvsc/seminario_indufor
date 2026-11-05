# Decisiones

Las decisiones de negocio siguen en [discrepancias](../discrepancias.md), [specs/decisiones](../../specs/decisiones.md) y [ADR existentes](../adr/). No se duplican aquí.

## DEC-2026-11-04-01 — Kit y plan en un proyecto existente

- Contexto: INDUFOR ya tiene fases, especificaciones y reglas propias.
- Alternativas: reinicializar el proyecto o incorporar recursos compatibles.
- Decisión: integrar el kit sin sustituir fuentes ni código; usar perfil Laravel para el backend y registrar el frontend por separado.
- Fundamento: preservar el sistema y sus decisiones. Alcance: documentación y herramientas de desarrollo.
- Fuente: solicitud y plan aprobado el 2026-11-04; kit `wj-004/Promt-AI`, commit `e073de35c24e58ba79a9dd376cd610e5f5a21e41`.

## DEC-2026-11-04-02 — Visor React independiente

- Contexto: el kit incluye un visor HTML/JS; INDUFOR utiliza React y TypeScript.
- Alternativas: visor original, pantalla de la PWA o herramienta React independiente.
- Decisión: herramienta React independiente que consume el servidor del kit.
- Fundamento: elección del usuario; una sola fuente validada, sin ampliar permisos de producto. Alcance: desarrollo local.

## DEC-2026-11-04-03 — Incorporación de antecedentes

- Contexto: fases y specs tienen estados históricos y algunas notas pendientes.
- Alternativas: comenzar vacío o incorporar resúmenes con fuentes.
- Decisión: incorporar tareas documentales de revisión por fase y spec, sin inferir finalización actual ni reemplazar el detalle fuente.
- Fundamento: preservar trazabilidad y distinguir estados históricos de verificación actual. Alcance: plan maestro.

## DEC-2026-11-04-04 — Puertos y dependencias documentadas

- Contexto: el puerto 8788 estaba ocupado y las fuentes no establecen dependencias entre las revisiones actuales.
- Alternativas: utilizar el puerto ocupado o uno local libre; inferir dependencias o dejarlas sin asignar.
- Decisión: usar 18788 para el servidor y registrar dependencias solo con respaldo explícito.
- Fundamento: evitar interferencias y relaciones ficticias. Alcance: herramienta local y plan.

## DEC-2026-11-04-05 — Visor en el puerto 8788

- Contexto: el usuario indicó que el servicio anterior ya no se utiliza y solicitó abrir el visor en 8788.
- Alternativas: mantener el visor en 5174 o liberar 8788.
- Decisión: detener el servicio anterior y usar 8788 para la interfaz React; el servidor de datos continúa en 18788.
- Fundamento y alcance: preferencia explícita del usuario para el acceso local al visor.

## DEC-2026-11-04-06 — Fidelidad al visor original

- Contexto: el usuario señaló que la primera versión React no reproducía el visor de referencia.
- Alternativas: mantener el rediseño o replicar la estructura, estilos y comportamiento del kit con componentes React.
- Decisión: adoptar el diseño original en React, conservando el esquema y los datos reales de INDUFOR.
- Fundamento y alcance: corrección solicitada por el usuario; interfaz local del plan maestro.

## DEC-2026-11-04-07 — Trazabilidad individual de RF01 a RF16

- Contexto: el usuario señaló que el plan inicial omitía los 16 requerimientos funcionales. La matriz de trazabilidad es del 2026-10-27.
- Alternativas: seguir con tareas generales por fase o representar cada RF individualmente.
- Decisión: agregar una tarea de verificación por RF, con su definición y referencias históricas; no declarar su resultado actual sin contrastar código, interfaz y pruebas.
- Fundamento y alcance: corregir la omisión y preservar el significado de la evidencia. Los RNF01–RNF05 se incorporan también como tareas de verificación, con las mismas reservas de evidencia.

## DEC-2026-11-04-08 — Estados verificados, dependencias y exclusiones

- Contexto: el usuario señaló que el visor mostraba las 36 tareas como pendientes, sin dependencias ni exclusiones, aunque las fases 1–7 están cerradas.
- Alternativas: mantener todo pendiente hasta un nuevo recorrido manual, o cerrar con evidencia de las suites ejecutadas hoy.
- Decisión: pasar a HECHO lo cerrado en las fuentes y con Pest y Vitest en verde el 2026-11-04; PARCIAL para RNF04 (falta medir en producción) y la spec 08 (matafuegos del operario). Las dependencias siguen el orden de fases de `docs/fases.md` y la fase de cada RF. Se agrega DEP-001 (publicación, ADR-005) y se excluyen el rediseño visual (SDD.md) y la exportación CSV/PDF (D27), ambas decididas por el usuario. Sustituye la reserva de DEC-2026-11-04-03 y DEC-2026-11-04-04 sobre estados y dependencias.
- Fundamento y alcance: pedido explícito del usuario («hazlo y corrijamos los problemas»). La E2E de Playwright no se reejecutó.

## DEC-2026-11-05-01 — Modo claro seleccionable

- Contexto: desde el 2026-11-03 la app usaba solo el tema oscuro. El usuario pidió un botón para cambiar a claro, con transición animada, y entregó la paleta «Forest Light Tactical».
- Alternativas: seguir la preferencia del sistema, o dejar oscuro por defecto y que cada persona elija.
- Decisión: oscuro por defecto y botón en la sidebar; la elección queda en el equipo. La paleta se mapea a los tokens existentes y se ajustan los valores que no llegan a AA (`docs/design-tokens.md`).
- Consecuencias: las pruebas de axe corren en ambos temas. La sidebar es oscura en los dos. El tema se aplica desde `public/tema.js` porque la CSP de `deploy/nginx.conf` bloquea scripts en línea.
