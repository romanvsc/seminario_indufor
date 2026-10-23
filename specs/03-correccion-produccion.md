# 03 — Corrección de partes de producción

Estado: **aprobado el 2026-10-22** con las opciones recomendadas (`docs/discrepancias.md` D21–D27).

## Problema y evidencia

| ID | Tipo | Hallazgo | Evidencia |
|---|---|---|---|
| H-03.1 | Defecto | El backend permite que el autor corrija su parte y lo audita, pero **no hay pantalla** para hacerlo. Solo se puede adjuntar una foto si falta. | [código] Ruta `PUT /production/{id}` en `backend/routes/api.php:60`; `ProduccionController.php:83-87` (`update-own` + autor); `GestionProduccion::corregir` audita `produccion.corregida`. [código] `ProduccionPage.tsx:25`, `:109`: `puedeCorregir` solo se usa para "Adjuntar" la foto. [test] `ProduccionTest` «solo quien registró corrige su parte» cubre el backend. |
| H-03.2 | — | El listado no tiene un detalle del parte (observaciones, operario, fecha de alta) ni el historial de correcciones visible para el autor. | [código] `ProduccionPage.tsx`: tabla sin vista de detalle. |

## Usuarios y tareas

El encargado o el operario que se equivocó en un parte propio, por ejemplo con toneladas invertidas o un tipo de madera equivocado.

## RF, RNF, contexto y decisiones

RF01 a RF04 · contexto Production · D18 (solo el autor corrige, sin límite de tiempo, con auditoría de antes y después) · `docs/rbac.md` (`production.update-own`).

## Comportamiento esperado

Circuito completo: localizar el parte → abrir el detalle → corregir los campos permitidos → validar → confirmar → ver el resultado.

- **Campos corregibles:** jornada, frente, máquina, tipo de madera, toneladas, m³, observaciones y, en partes consolidados, el operario. Son los mismos que ya acepta `PUT`.
- **No se corrige:** quién registró el parte.
- Se aplican las mismas reglas que en el alta: modalidad del frente, asignación en la fecha y magnitudes (D03, D04, D12, D18).

## Alcance y exclusiones

- **Incluye:** detalle del parte, formulario de corrección para el autor y mensaje de resultado.
- **Excluye:**
  - corrección por parte de Administración u otros roles (sin respaldo funcional);
  - borrar partes;
  - aprobación (D16).

## Reglas e invariantes

- **I-03.1:** solo el autor con `production.update-own` ve "Corregir". El backend vuelve a verificarlo y hoy ya lo hace.
- **I-03.2:** cada corrección deja un evento `produccion.corregida` con antes y después. Hoy ya lo hace.
- **I-03.3 (según C1):** la corrección lleva un motivo.

## Flujo principal y alternativas

1. **Localizar:** en Producción, el autor ve "Corregir" solo en sus partes.
2. **Detalle:** se abre el detalle con todos los datos actuales.
3. **Corregir:** se editan los campos, con las mismas validaciones del alta.
4. **Confirmar:** "Guardar corrección" manda solo los campos que cambiaron.
5. **Resultado:** se informa "Corrección guardada" y el listado muestra el valor nuevo.

**Alternativas:**
- el backend rechaza (por ejemplo, `SIN_ASIGNACION` en la nueva fecha): el mensaje queda junto al campo y los datos editados se conservan;
- no hubo ningún cambio: "No hay cambios para guardar".

## Errores, permisos y conectividad

- `403` si no es el autor.
- Sin conexión no se confirma (D11). Con resultado incierto, rige la spec 04.

## Impacto

- **API:**
  - sin cambios si C1 = sin motivo;
  - con C1 = motivo obligatorio, `PUT` exige `motivo` y se guarda en el evento de auditoría, igual que en D19.
- **Datos:** sin cambios. El motivo va en `auditoria_evento.after_json`.
- **Interfaz:** `ProduccionPage` (acción "Ver o corregir") y un diálogo nuevo `CorregirParteDialog`.

## Criterios de aceptación

- **CA-03.1**
  - Dado: un encargado con un parte propio de 32,50 t.
  - Cuando: abre "Corregir", cambia a 30,00 t (y escribe el motivo, si C1 lo exige) y confirma.
  - Entonces: el listado muestra 30,00 t y hay un evento `produccion.corregida` con 32,50 → 30,00.
- **CA-03.2**
  - Dado: otro encargado del mismo frente.
  - Cuando: mira el listado.
  - Entonces: no ve "Corregir" en ese parte, y un `PUT` directo responde 403.
- **CA-03.3**
  - Dado: el autor corrige la jornada a una fecha en la que no estaba asignado.
  - Entonces: ve `SIN_ASIGNACION` junto al campo y sus cambios quedan en el formulario.
- **CA-03.4**
  - Dado: el autor abre "Corregir".
  - Cuando: confirma sin cambiar nada.
  - Entonces: "No hay cambios para guardar" y no se manda nada.

## Decisiones pendientes

- **C1, ¿la corrección exige motivo?**
  - (a) sí, obligatorio, como en logística con D19 (**recomendada**: deja el porqué en la auditoría);
  - (b) no, como hoy.
  - Consecuencia de (a): `PUT /production/{id}` pasa a exigir un campo nuevo; no rompe nada porque hoy no hay ningún cliente que lo use.

---

## Plan (Fase 2)

- **Diseño mínimo:** un diálogo que reusa los campos y las validaciones de `ParteNuevoPage`. Si C1 = a, `ProduccionController::update` valida `motivo` y `GestionProduccion::corregir` lo agrega al evento.
- **Dependencias:**
  - spec 02, para que el selector de frente use la fecha;
  - spec 04, para manejar el resultado incierto.
- **Migración:** ninguna.

| Tarea | Criterio | Prueba |
|---|---|---|
| T-03.1 (si C1 = a) `motivo` en `PUT` y en el evento | CA-03.1 | `ProduccionTest` |
| T-03.2 `CorregirParteDialog` y acción en el listado | CA-03.1, CA-03.3, CA-03.4 | `ProduccionPage.test` |
| T-03.3 Regresión de permisos | CA-03.2 | `ProduccionTest` (existe) + Vitest de visibilidad |
| T-03.4 E2E de corrección | CA-03.1 | `e2e/sdd-correccion-parte.spec.ts` |

- **Riesgos y reversión:** el cambio es aditivo y se revierte con el commit.
