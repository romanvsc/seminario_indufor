# 04 — Conectividad, borradores y sesión

Estado: **aprobado el 2026-10-22** con las opciones recomendadas (`docs/discrepancias.md` D21–D27).

Decisión vigente que se preserva: **D11**. Sin conexión solo se guardan borradores; para confirmar un registro hace falta conexión. No se implementa sincronización automática.

## Problema y evidencia

| ID | Tipo | Hallazgo | Evidencia |
|---|---|---|---|
| H-04.1 | Defecto | Si se abre la app **sin señal**, el formulario de campo no aparece y el borrador queda inaccesible: el guard de sesión consulta `/auth/me`, falla, y muestra "No se pudo verificar la sesión". | [código] `frontend/src/features/auth/RequireAuth.tsx:10-11`; `features/auth/api.ts:31-32` (sin persistencia, `retry: false`). [observado] 2026-10-22, en el servidor de desarrollo, que no tiene service worker: al reabrir sin señal la app ni siquiera carga (`ERR_INTERNET_DISCONNECTED`). [inferido] En el build de producción, el service worker sirve la app, pero `/auth/me` falla y se muestra el error de sesión. Falta reproducirlo con el build (T-04.1). El E2E de fase 2 solo corta la red **con la página ya cargada**. |
| H-04.2 | Defecto | Los formularios esperan sesión **y catálogos** (asignaciones, frentes, tipos, máquinas). Si una de esas consultas falla, la pantalla queda en "Cargando…" para siempre, sin error ni reintento. | [código] `ParteNuevoPage.tsx:52-53`; `ViajeNuevoPage.tsx:49`; `LecturaNuevaPage.tsx:30` (solo miran `!data`, no `isError`). |
| H-04.3 | Defecto | Si falla el almacenamiento local, el error se ignora y la pantalla sigue diciendo "○ Borrador en este equipo", aunque no se guardó nada. | [código] `shared/borrador.ts:21-22` (catch vacío); `ParteNuevoPage.tsx:194`. |
| H-04.4 | Defecto | **Resultado incierto:** si la red se corta después de que el backend guardó, la pantalla dice "No hay conexión… intentá de nuevo" como si no se hubiera guardado. Reintentar con la misma clave no duplica (spec 05), pero el usuario no sabe que puede estar guardado. | [código] `shared/api/client.ts:49` (`SIN_CONEXION` para cualquier fallo de `fetch`); `ParteNuevoPage.tsx:121`. |
| H-04.5 | Defecto | Al tocar **Salir** se borran **todos** los borradores del equipo sin avisar, incluso si había uno a medio cargar. | [código] `features/auth/api.ts:57` (`borrarTodosLosBorradores()` en `onSettled`). |
| H-04.6 | Defecto | Si la sesión vence durante la carga, al enviar aparece "Tenés que iniciar sesión", pero la app no lleva al login ni vuelve al formulario. El borrador se conserva porque es del mismo usuario. | [código] `client.ts` (401 → `ApiError`); `RequireAuth.tsx` no se entera porque `/auth/me` sigue en caché (`api.ts:31`, `staleTime` de 5 min). [inferido] |
| H-04.7 | Defecto | El control de matafuegos no guarda borrador: cerrar o actualizar la app pierde lo cargado. | [código] `MatafuegoNuevoPage.tsx:28` (solo `useState`). |
| H-04.8 | Uso | "Actualizar" a una versión nueva recarga la página. Los borradores de texto sobreviven porque se guardan en cada cambio, pero **la foto elegida se pierde** y no se avisa. | [código] `UpdatePrompt.tsx:24`; la foto no está en el borrador (`ParteNuevoPage.tsx:67`, `:106`). |

## Usuarios y tareas

Operarios, encargados y camioneros que cargan en el monte con señal intermitente, a veces en celulares compartidos.

## RF, RNF, contexto y decisiones

RNF01, RNF02 · contextos Production, Logistics y Maintenance · D11 · ADR-001 (sesión por cookie) · skill `indufor-field-mobile-ux` (estados visibles, borradores, nunca "guardado" sin confirmación).

## Comportamiento esperado: estados que la app comunica con precisión

| Estado | Cuándo | Texto (propuesta) |
|---|---|---|
| Borrador conservado | Se guardó en el equipo | "○ Borrador guardado en este equipo (sin enviar)" |
| Conservación fallida | El almacenamiento falló | "⚠ No se pudo guardar el borrador en este equipo. No cierres la app hasta enviarlo." |
| Envío en curso | Esperando respuesta | "↻ Enviando…" |
| Resultado incierto | La red falló **después** de enviar | "? No sabemos si llegó. Tocá «Reintentar»: si ya se guardó, no se va a duplicar." |
| Registro confirmado | El backend respondió 201 o 200 | "✓ Guardado" y se borra el borrador |
| Error recuperable | 4xx con datos a corregir | El mensaje del backend junto al campo, con el borrador intacto |

## Alcance y exclusiones

- **Incluye:**
  - abrir los formularios sin señal usando la última sesión y los últimos catálogos conocidos;
  - errores de carga con "Reintentar";
  - los estados de la tabla;
  - borrador de matafuego;
  - aviso al salir con borradores;
  - volver al formulario después de iniciar sesión otra vez.
- **Excluye:**
  - enviar sin conexión;
  - colas de envío automático (D11);
  - guardar la foto en el borrador, que supera el límite razonable de almacenamiento local. Se avisa que hay que volver a elegirla.

## Reglas e invariantes

- **I-04.1:** nunca se muestra "guardado" sin una respuesta 2xx del backend.
- **I-04.2:** el borrador solo se borra después de un 2xx, o cuando el usuario lo descarta en forma explícita (según D1).
- **I-04.3:** sin señal, la app usa la última sesión y los catálogos guardados **solo para mostrar el formulario**. Toda confirmación vuelve a pasar por el backend, que revalida la sesión y los permisos.
- **I-04.4:** el borrador es de un usuario. Otro usuario en el mismo equipo no lo ve.

## Flujos

- **Abrir sin señal:**
  1. Se usan la última sesión y los catálogos del equipo, y se muestra el formulario con el borrador.
  2. El botón dice "Sin conexión".
  3. Al volver la señal, se revalida la sesión. Si venció, se va al login y después de entrar se vuelve al formulario con el borrador.
- **Resultado incierto:**
  1. El envío falla por la red.
  2. Se muestra el estado "?".
  3. "Reintentar" reenvía con **la misma** clave de idempotencia (spec 05).
  4. Si el backend responde 200 (ya existía), se muestra "✓ Guardado (ya había llegado)".
- **Salir con borradores:** se aplica según D1.

## Errores, permisos y recuperación

- **Catálogo que no carga:** "No se pudo cargar la lista de máquinas", con "Reintentar". Si hay una copia guardada, se usa y se indica "datos de DD/MM HH:mm".
- **401 al enviar:** se conserva el borrador, se lleva al login con la vuelta al formulario y, al regresar, el envío se hace otra vez con la misma clave.

## Impacto

- **API:** ninguno.
- **Datos:** ninguno en la base. En el equipo se guarda una copia de la última sesión y de los catálogos, sin datos sensibles más allá del nombre y los permisos.
- **Interfaz:**
  - `RequireAuth`;
  - los 4 formularios de campo;
  - `shared/borrador.ts`, que tiene que devolver si pudo guardar;
  - `client.ts`, que tiene que distinguir "no salió" de "salió y no volvió la respuesta" si el navegador lo permite;
  - `AppLayout` (botón Salir).

## Criterios de aceptación

- **CA-04.1**
  - Dado: un operario que cargó un borrador de lectura y cerró la app.
  - Cuando: la reabre sin señal.
  - Entonces: ve el formulario con su borrador y el botón "Sin conexión".
- **CA-04.2**
  - Dado: falla la consulta de máquinas y no hay copia guardada.
  - Cuando: abre el formulario.
  - Entonces: ve el error con "Reintentar", nunca "Cargando…" indefinido.
- **CA-04.3**
  - Dado: el almacenamiento local está bloqueado o lleno.
  - Cuando: escribe en el formulario.
  - Entonces: ve "No se pudo guardar el borrador en este equipo".
- **CA-04.4**
  - Dado: el backend guardó el parte, pero la respuesta no llegó.
  - Cuando: el usuario toca "Reintentar".
  - Entonces: hay un solo parte en la base y la app muestra "Guardado (ya había llegado)".
- **CA-04.5**
  - Dado: hay un borrador pendiente.
  - Cuando: toca "Salir".
  - Entonces: se aplica D1, y en ningún caso se borra sin que el usuario lo vea.
- **CA-04.6**
  - Dado: la sesión venció durante la carga.
  - Cuando: envía.
  - Entonces: va al login y, al entrar, vuelve al formulario con el borrador intacto.
- **CA-04.7**
  - Dado: un control de matafuego a medio cargar.
  - Cuando: se cierra y se reabre la app.
  - Entonces: el borrador está.
- **CA-04.8**
  - Dado: un parte con foto elegida y una versión nueva disponible.
  - Cuando: el usuario toca "Actualizar".
  - Entonces: antes se le avisa que la foto se va a perder.

## Decisiones pendientes

- **D1, ¿qué pasa con los borradores al salir?**
  - (a) Se avisa: "Tenés N borradores sin enviar. Si salís se borran de este equipo", con "Salir igual" y "Volver". Al confirmar, se borran (**recomendada**: protege los celulares compartidos y nada se pierde sin aviso).
  - (b) Se conservan para el próximo ingreso del mismo usuario. Otro usuario no los ve, pero quedan en el equipo.
  - (c) Como hoy: se borran sin avisar.

## Supuestos

- Que la app abra sin señal depende de que el service worker ya tenga la app guardada, lo que pasa después de la primera visita. Hoy precachea el shell: `vite.config.ts`, `registerType: 'prompt'`.
- Que el navegador permita distinguir "no salió" de "no volvió la respuesta". Si no se puede, todo fallo de red durante el envío se trata como incierto, que es lo seguro gracias a la spec 05.

---

## Plan (Fase 2)

- **Diseño mínimo:**
  - guardar la sesión y los catálogos en el almacenamiento local con un helper chico, sin agregar dependencias;
  - un componente `EstadoEnvio` compartido por los 4 formularios;
  - `guardarBorrador` devuelve `boolean`;
  - `ErrorConReintento` reemplaza el "Cargando…" indefinido.
- **Dependencias:** spec 05, para que el reintento después de un resultado incierto sea seguro.
- **Migración:** ninguna.
- **Pruebas por riesgo:**
  - E2E con `context.setOffline(true)` **antes** de abrir la app (CA-04.1);
  - E2E que corta la respuesta con `page.route` después de que el backend guardó (CA-04.4);
  - Vitest para los estados, el almacenamiento fallido y Salir.

| Tarea | Criterio | Prueba |
|---|---|---|
| T-04.1 Sesión y catálogos guardados para abrir sin señal | CA-04.1 | E2E `sdd-offline.spec.ts` |
| T-04.2 Error con reintento en lugar de "Cargando…" | CA-04.2 | Vitest de los 4 formularios |
| T-04.3 `guardarBorrador` informa el fallo | CA-04.3 | Vitest |
| T-04.4 Estado incierto y reintento con la misma clave | CA-04.4 | E2E con `page.route` |
| T-04.5 Salir con borradores según D1 | CA-04.5 | Vitest + E2E |
| T-04.6 401 → login → vuelta al formulario | CA-04.6 | Vitest |
| T-04.7 Borrador de matafuego | CA-04.7 | Vitest |
| T-04.8 Aviso de foto antes de actualizar | CA-04.8 | Vitest de `UpdatePrompt` |

- **Riesgos y reversión:**
  - abrir sin señal con una sesión vencida muestra un formulario que después exige iniciar sesión. Es aceptable porque nada se confirma sin backend;
  - se revierte con el commit; los datos guardados en el equipo se descartan solos al cambiar la versión de la clave.
