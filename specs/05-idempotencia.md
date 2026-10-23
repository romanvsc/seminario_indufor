# 05 — Reintentos sin duplicados

Estado: **aprobado el 2026-10-22** con las opciones recomendadas (`docs/discrepancias.md` D21–D27).

## Problema y evidencia

| ID | Tipo | Hallazgo | Evidencia |
|---|---|---|---|
| H-05.1 | Defecto | Dos envíos **simultáneos** con la misma clave pueden crear **dos registros**: primero se consulta la caché, después se crea y recién al final se guarda la clave, sin bloqueo. | [código] `ProduccionController.php:68-77`, `LogisticaController.php:61-82`, `MantenimientoController.php:64-90`. Las tres tienen el comentario `shortcut: dos envíos simultáneos…`. [test] Solo hay tests secuenciales (`ProduccionTest`, `LogisticaTest` «misma clave de idempotencia»). |
| H-05.2 | Defecto | La clave vive **24 h en caché**: un reintento al día siguiente, o después de `cache:clear` o de un cambio de driver, crea un duplicado. | [código] `Cache::put(..., now()->addDay())` en las tres; `CACHE_STORE=database` (`backend/.env.example:41`). |
| H-05.3 | Defecto | Con **la misma clave y datos distintos**, el backend devuelve el registro anterior como si fuera la respuesta, y el usuario cree que se guardó lo nuevo. | [código] Mismo bloque: no se compara el contenido. |
| H-05.4 | — | Si la transacción falla, la clave no se guarda y el reintento vuelve a intentar. Es correcto. | [código] El `put` va después de `registrar`. |
| H-05.5 | — | La foto del parte se sube aparte: si el parte se guardó y la foto falló, se avisa y se adjunta desde el listado. Es correcto. | [código] `ParteNuevoPage.tsx:106-112`. |

## Usuarios y tareas

Toda carga de campo con señal mala: el usuario toca "Enviar" otra vez o el navegador reintenta.

## RF, RNF, contexto y decisiones

RNF02 · contextos Production, Logistics y Maintenance · skill `indufor-field-mobile-ux` (regla 9: reintentos sin duplicados).

## Comportamiento esperado

Una misma operación produce **un solo** registro, en cualquier orden y en cualquier momento.

## Alcance y exclusiones

- **Incluye:** alta de parte, declaración de viaje y alta de lectura.
- **Excluye:**
  - control de matafuegos: hoy no manda clave; se incorpora en la spec 04;
  - correcciones (`PUT`), que son idempotentes por naturaleza;
  - importaciones, que ya usan checksum (spec 01).

## Reglas e invariantes

- **I-05.1:** una clave pertenece a un usuario y a una operación (`parte`, `viaje`, `lectura`). La misma clave en otra operación es otra clave.
- **I-05.2:** a una clave le corresponde a lo sumo un registro. Lo garantiza un índice único, no la caché.
- **I-05.3:** la clave se guarda **en la misma transacción** que el registro. Si la transacción falla, no queda clave.
- **I-05.4:** junto con la clave se guarda un hash del contenido. La misma clave con otro contenido responde `409 CLAVE_REUTILIZADA` y no crea nada.
- **I-05.5:** la clave dura al menos lo mismo que un borrador puede esperar, según E1.

## Flujos

- **Reintento con la misma clave y el mismo contenido:** `200` con el registro existente.
- **Dos envíos simultáneos:** uno crea (`201`) y el otro choca con el índice único, lee el existente y responde `200`.
- **Misma clave y contenido distinto:** `409 CLAVE_REUTILIZADA`, con el mensaje "Este envío ya se registró con otros datos. Revisá el registro guardado antes de cargar uno nuevo".

## Impacto

- **Datos:** tabla técnica nueva `idempotencia`, del mismo tipo que `integracion_lote`:

  | Campo | Tipo |
  |---|---|
  | `id_usuario` | INT UNSIGNED FK |
  | `operacion` | VARCHAR(20) |
  | `clave` | VARCHAR(64) |
  | `hash_contenido` | CHAR(64) |
  | `entidad_id` | BIGINT UNSIGNED |
  | `created_at` | TIMESTAMP |

  - Índice único `(id_usuario, operacion, clave)`.
  - Hay que reflejarla en `docs/database.md` §13 y anotarla en `docs/cambios-pdf.md`. Es una tabla técnica, pero la regla "DER = base implementada" alcanza todas las migraciones de dominio. Ver supuesto S-05.1.
- **API:** las tres altas responden igual que hoy, más el `409` nuevo.
- **Interfaz:** mostrar el `409` en los 3 formularios y descartar ese borrador si el usuario lo confirma.

## Criterios de aceptación

- **CA-05.1**
  - Dado: dos `POST /production` **simultáneos** con la misma clave y el mismo contenido.
  - Entonces: hay un solo parte y las respuestas son 201 y 200, con el mismo `id`.
- **CA-05.2**
  - Dado: un parte creado con la clave K.
  - Cuando: se reenvía K **25 horas después**.
  - Entonces: 200 con el mismo parte y ninguno nuevo.
- **CA-05.3**
  - Dado: un parte creado con K.
  - Cuando: se envía K con otras toneladas.
  - Entonces: `409 CLAVE_REUTILIZADA` y nada creado.
- **CA-05.4**
  - Dado: falla la transacción del alta (por ejemplo, `SIN_ASIGNACION`).
  - Cuando: el usuario corrige y reintenta con K.
  - Entonces: se crea un registro, porque la clave no había quedado guardada.
- **CA-05.5**
  - Dado: la clave K de producción.
  - Cuando: se usa K en una lectura.
  - Entonces: se crea la lectura, porque son operaciones distintas.
- **CA-05.6**
  - Dado: `php artisan cache:clear`.
  - Cuando: se reenvía K.
  - Entonces: sigue sin duplicar.
- Los criterios CA-05.1 a CA-05.3 se repiten para viajes y lecturas.

## Decisiones pendientes

- **E1, ¿cuánto se guardan las claves?**
  - (a) Para siempre: son pocas filas por día (**recomendada** para v1, por ser la más simple y segura).
  - (b) Se purgan a los 90 días con el cron que ya existe.
  - Consecuencias: (a) crece unas decenas de filas por día, sin impacto real; (b) un borrador de más de 90 días podría duplicarse.

## Supuestos

- **S-05.1:** la tabla `idempotencia` se documenta en el DER como tabla técnica, igual que `integracion_lote`. Si preferís dejarla fuera del DER del TP, hay que decirlo explícitamente en `docs/cambios-pdf.md`.

---

## Plan (Fase 2)

- **Diseño mínimo:** un puerto compartido `RegistroIdempotente`:
  - `ejecutar(usuario, operacion, clave, hash, callable crear): {id, nuevo}`;
  - corre dentro de la transacción del caso de uso: inserta la clave con `entidad_id` pendiente, crea el registro y actualiza;
  - ante un choque de índice único, lee la fila existente y compara el hash.
  - Reemplaza los tres bloques `Cache::*` y sus comentarios `shortcut`.
- **Migración:** solo crea la tabla. No toca datos existentes: las claves que hoy están en caché siguen valiendo hasta vencer, y lo nuevo va a la tabla.
- **Pruebas por riesgo:**
  - concurrencia real: un test que lanza dos procesos PHP contra la base de test, o el E2E con `Promise.all` y `PHP_CLI_SERVER_WORKERS` en CI, como ya se hace con RNF05;
  - viaje en el tiempo con `travel(25)->hours()` para CA-05.2;
  - `cache:clear` para CA-05.6.

| Tarea | Criterio | Prueba |
|---|---|---|
| T-05.1 Migración `idempotencia` y documentación DER | — | migrate + `docs/database.md` |
| T-05.2 `RegistroIdempotente` (puerto y adaptador) | CA-05.1 a CA-05.6 | `IdempotenciaTest` (Feature) |
| T-05.3 Usarlo en las 3 altas; quitar la caché | CA-05.1 a CA-05.5 | tests existentes + nuevos por operación |
| T-05.4 `409` en los formularios | CA-05.3 | Vitest |
| T-05.5 E2E concurrente | CA-05.1 | `e2e/sdd-idempotencia.spec.ts` |

- **Riesgos y reversión:**
  - un cambio en el camino crítico de las tres altas: lo cubren los tests de regresión de las fases 2 a 4;
  - se revierte con el commit y un `migrate:rollback` de una tabla técnica sin datos de negocio.
