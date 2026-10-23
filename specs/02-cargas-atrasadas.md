# 02 — Cargas atrasadas

Estado: **aprobado el 2026-10-22** con las opciones recomendadas (`docs/discrepancias.md` D21–D27).

## Problema y evidencia

| ID | Tipo | Hallazgo | Evidencia |
|---|---|---|---|
| H-02.1 | Defecto | El formulario de producción solo ofrece los frentes asignados **hoy**, aunque el backend valida la asignación **en la fecha del parte**. Un encargado que cambió de frente no puede cargar un parte atrasado de su frente anterior, que la regla sí permite. Si hoy no tiene ninguna asignación, ni siquiera ve el formulario. | [código] `frontend/src/features/production/api.ts:46` (`vigentes=1`); `ParteNuevoPage.tsx:55-57` filtra y muestra "No estás asignado a ningún frente hoy". El backend valida bien: `ProduccionRepositorioEloquent.php:17-23` usa la fecha del parte. [test] `ProduccionTest` «parte atrasado dentro de la asignación» cubre el backend, no el formulario. |
| H-02.2 | Defecto | El formulario de lecturas compara contra la última lectura **a la fecha de hoy**, no contra las vecinas de la fecha ingresada. Con 100 h el lunes y 120 h el miércoles, una lectura de 110 h del martes **queda bloqueada en pantalla** aunque el backend la acepta. | [código] `MantenimientoController.php:38` (`lecturaVecina(..., now(), anterior: true)`); `LecturaNuevaPage.tsx:43-45` y `:68` (bloquea), `:151` (botón deshabilitado). El backend es correcto: `ReglaLectura.php:56-60`, más `MantenimientoRepositorioEloquent.php:20-21` (vecinas por fecha). [test] `ReglaLecturaTest` «una lectura atrasada no puede superar a la posterior» y `MantenimientoTest` «lectura atrasada» cubren el backend. [observado] 2026-10-22: `GET /maintenance/units/{HV-E2E4}/last-reading?fecha=2026-10-21T08:00` devolvió `anterior = 1200.00 h (21/10 15:56)`, una lectura **posterior** a la fecha pedida. El parámetro se ignora y el formulario compara contra esa. |
| H-02.3 | Defecto | Con 130 h del martes (mayor que las 120 del miércoles), el formulario **no avisa** y recién el backend la rechaza al enviar. | [código] `avisoLectura.ts` solo recibe la anterior. |

## Usuarios y tareas

Encargados y operarios que cargan partes o lecturas de días anteriores, por ejemplo al recuperar señal o al pasar en limpio una planilla.

## RF, RNF, contexto y decisiones

RF01 a RF03, RF09 y RNF05 · contextos Production, Maintenance y Frentes · D08 (lectura atrasada entre la anterior y la posterior), D12 (asignación en la fecha del parte) y D18.

## Comportamiento esperado

- La **fecha ingresada** decide las referencias:
  - frentes asignados **en esa fecha**;
  - lectura anterior y posterior **a esa fecha y hora**.
- Al cambiar la fecha se recalculan las opciones y los avisos.

## Alcance y exclusiones

- **Incluye:** los formularios de parte y de lectura y las consultas que necesitan.
- **Excluye:**
  - cambiar las reglas: el backend sigue siendo la autoridad y ya es correcto;
  - el historial de ubicación de máquinas (D12, fuera de v1).

## Reglas e invariantes

- **I-02.1:** el aviso del formulario nunca es más estricto que el backend: no bloquea lo que el backend acepta.
- **I-02.2:** el backend sigue rechazando. El aviso solo adelanta el resultado.

## Flujo principal y alternativas

**Parte de producción:**
1. El usuario elige la jornada. Por defecto es hoy.
2. El formulario pide `GET /front-assignments?usuario=me&fecha=AAAA-MM-DD` y ofrece esos frentes.
3. Si la fecha cambia, se recarga la lista. Si el frente elegido ya no corresponde, se limpia y se avisa.
4. Si no tiene ninguna asignación en esa fecha, muestra "No estabas asignado a ningún frente el DD/MM. Cambiá la fecha o pedile a Administración que revise tus asignaciones", **sin** ocultar el formulario: la fecha queda editable.

**Lectura:**
1. El usuario elige la unidad y la fecha y hora.
2. El formulario pide `GET /maintenance/units/{u}/last-reading?fecha=...`, que devuelve `anterior` y `posterior`.
3. El aviso bloquea si el valor es menor que la anterior o mayor que la posterior, y muestra las dos referencias.

## Errores, permisos y conectividad

- **Permisos sin cambios:** `production.create` y `maintenance.reading.create`. El endpoint de asignaciones ya existe con `fronts.view`; el parámetro `fecha` solo restringe.
- **Sin conexión:** si la consulta de referencias falla, el formulario dice "No se pudo verificar contra las lecturas anteriores; el sistema lo va a validar al enviar" y **no** bloquea. Esto se coordina con la spec 04.

## Impacto

- **API:**
  - `/front-assignments` acepta `fecha=AAAA-MM-DD`, que devuelve las asignaciones vigentes en esa fecha;
  - `/maintenance/units/{u}/last-reading` acepta `fecha` y devuelve también `posterior`.
- **Datos:** sin cambios.
- **Interfaz:** `ParteNuevoPage`, `LecturaNuevaPage` y `avisoLectura`.

## Criterios de aceptación

- **CA-02.1**
  - Dado: una unidad con 100 h el lunes 08:00 y 120 h el miércoles 08:00.
  - Cuando: se ingresa 110 h el martes 08:00.
  - Entonces: el formulario no bloquea y el backend responde 201.
- **CA-02.2**
  - Dado: el mismo caso.
  - Cuando: se ingresan 130 h el martes.
  - Entonces: el formulario avisa "Ya hay una lectura posterior de 120 h (miércoles)" y bloquea, y el backend responde `422 LECTURA_REGRESIVA`.
- **CA-02.3**
  - Dado: el mismo caso.
  - Cuando: se ingresan 90 h el martes.
  - Entonces: el formulario avisa con la anterior (100 h) y bloquea.
- **CA-02.4**
  - Dado: un encargado asignado a Papel Misionero del 01/10 al 15/10 y a Bosques del Plata desde el 16/10.
  - Cuando: elige la jornada 10/10.
  - Entonces: el formulario ofrece Papel Misionero y el parte se registra.
- **CA-02.5**
  - Dado: el mismo encargado.
  - Cuando: cambia la jornada al 20/10.
  - Entonces: la lista pasa a Bosques del Plata, y si estaba elegido Papel Misionero se limpia con un aviso.
- **CA-02.6**
  - Dado: un usuario sin asignación vigente hoy, pero con asignación el 05/10.
  - Cuando: abre "Cargar parte".
  - Entonces: ve el formulario con el aviso y puede elegir el 05/10.

## Supuestos

- La lectura "anterior" con la misma fecha y hora exacta cuenta como anterior. Es lo que ya hace el backend con `<=` en `MantenimientoRepositorioEloquent.php:20`.

---

## Plan (Fase 2)

- **Diseño mínimo:**
  - **Backend:**
    - filtro `fecha` en `FrenteController::asignaciones` (misma condición que `vigentes`, con la fecha dada);
    - `ultimaLectura` recibe `fecha` y devuelve también `posterior`, reusando `lecturaVecina`.
  - **Frontend:**
    - `useMisAsignacionesVigentes(id, fecha)`;
    - `useUltimaLectura(id, fecha)`;
    - `avisoLectura` recibe la anterior y la posterior.
- **Dependencias:** ninguna.
- **Migración:** ninguna.
- **Pruebas por riesgo:**
  - Feature tests de los dos endpoints con fecha;
  - Vitest de `avisoLectura` con el caso obligatorio 100/120/110/130;
  - E2E del caso obligatorio, cargando las 3 lecturas desde la interfaz.

| Tarea | Criterio | Prueba |
|---|---|---|
| T-02.1 `fecha` en `/front-assignments` | CA-02.4, CA-02.5 | `FrentesTest` «asignaciones en una fecha» |
| T-02.2 Formulario de parte por fecha, sin ocultarlo | CA-02.4 a CA-02.6 | `ParteNuevoPage.test` |
| T-02.3 `last-reading` con `fecha` y `posterior` | CA-02.1 a CA-02.3 | `MantenimientoTest` |
| T-02.4 `avisoLectura` con anterior y posterior | CA-02.1 a CA-02.3 | `avisoLectura.test` (caso obligatorio) |
| T-02.5 E2E del caso obligatorio | CA-02.1, CA-02.2 | `e2e/sdd-cargas-atrasadas.spec.ts` |

- **Riesgos y reversión:** cambios aditivos; los parámetros nuevos son opcionales y, si no se mandan, el comportamiento es el actual. Se revierte con el commit.
