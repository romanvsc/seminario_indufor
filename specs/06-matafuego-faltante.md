# 06 — Matafuego faltante y datos obligatorios por estado

Estado: **aprobado el 2026-10-22** con las opciones recomendadas (`docs/discrepancias.md` D21–D27).

## Problema y evidencia

| ID | Tipo | Hallazgo | Evidencia |
|---|---|---|---|
| H-06.1 | Defecto | Se puede elegir `FALTANTE`, pero se exige la fecha de vencimiento de una etiqueta que no está. El usuario tiene que **inventar una fecha** para poder enviar. | [código] `MantenimientoController.php:131-133` (`fecha_vencimiento_carga` required); migración `2026_10_19_000002_create_mantenimiento_tables.php:39` (NOT NULL); `MatafuegoNuevoPage.tsx:36`. |
| H-06.2 | — | Con `DANADO` o `DESCARGADO` la etiqueta puede estar ilegible. Hay que confirmarlo con tu respuesta. | [inferido] |
| H-06.3 | — | El panel calcula "vencido" o "por vencer" con la fecha del último control. Si el matafuego falta, hoy depende de la fecha inventada. | [código] `MantenimientoController.php:161-163`. |

## Usuarios y tareas

Encargados y operarios que hacen el control mensual (RF11), y Mantenimiento, que lo supervisa.

## RF, RNF, contexto y decisiones

RF11 · contexto Maintenance · D15 (todas las unidades activas) · D20 (estados `OK`, `DESCARGADO`, `DANADO` y `FALTANTE`).

## Comportamiento esperado (sujeto a F1)

- Los datos obligatorios dependen del estado. Nunca se guarda una fecha ficticia.
- El panel muestra "Falta el matafuego" en lugar de una fecha de vencimiento cuando no aplica.

## Alcance y exclusiones

- **Incluye:** reglas por estado, esquema (fecha nullable), formulario y panel.
- **Excluye:** el reemplazo del matafuego (compra o recarga) como circuito nuevo.

## Reglas e invariantes (propuesta F1 = a)

| Estado | Vencimiento de carga | Nota |
|---|---|---|
| `OK` | Obligatorio | Lo informa la etiqueta |
| `DESCARGADO` | Obligatorio, salvo que se marque "etiqueta ilegible" | |
| `DANADO` | Obligatorio, salvo que se marque "etiqueta ilegible" | |
| `FALTANTE` | **No se pide**, queda vacío | El panel lo marca como alerta |

- **I-06.1:** `fecha_vencimiento_carga` es NULL solo en `FALTANTE`, o cuando se marcó "etiqueta ilegible".
- **I-06.2:** un control sin vencimiento nunca aparece como "vigente" en el panel.

## Flujo

1. El usuario elige el estado.
2. Con `FALTANTE`, el campo de vencimiento desaparece.
3. Con `DANADO` o `DESCARGADO` aparece "No se puede leer la etiqueta".

## Errores, permisos y conectividad

- Permisos sin cambios: `maintenance.extinguisher.create`.
- El borrador se maneja en la spec 04 (H-04.7).

## Impacto

- **Datos:** `control_matafuego.fecha_vencimiento_carga` pasa a NULL. Se agrega `etiqueta_ilegible` BOOLEAN DEFAULT FALSE solo si F1 = a. **Hay que reflejarlo en el DER** y en `docs/cambios-pdf.md`. Los datos existentes no cambian, porque todos tienen fecha.
- **API:** validación condicional por estado.
- **Interfaz:** formulario y panel.

## Criterios de aceptación

- **CA-06.1**
  - Dado: un operario.
  - Cuando: registra `FALTANTE` sin fecha.
  - Entonces: 201, el control queda con vencimiento NULL y el panel muestra "⚠ Falta el matafuego".
- **CA-06.2**
  - Cuando: se registra `OK` sin fecha.
  - Entonces: 422 en `fecha_vencimiento_carga`.
- **CA-06.3**
  - Cuando: se registra `DANADO` con "etiqueta ilegible" y sin fecha.
  - Entonces: 201, y el panel muestra "Dañado · etiqueta ilegible".
- **CA-06.4**
  - Cuando: se registra `FALTANTE` **con** fecha.
  - Entonces: se rechaza (422), para no guardar un dato sin sentido.

## Decisiones pendientes

- **F1, datos obligatorios por estado:**
  - (a) La tabla de arriba (**recomendada**).
  - (b) La fecha es obligatoria salvo en `FALTANTE`, sin la opción "etiqueta ilegible". Es más simple, pero obliga a inventar una fecha si la etiqueta no se lee.
  - (c) La fecha siempre es opcional. Es lo más flexible, pero se pierde el control de vencimientos.

---

## Plan (Fase 2)

- **Diseño mínimo:**
  - migración: `fecha_vencimiento_carga` nullable, más `etiqueta_ilegible` si F1 = a;
  - validación condicional en `registrarMatafuego` y una regla de dominio `ControlMatafuego::validar(estado, fecha, ilegible)`, testeable sin base;
  - el panel trata NULL como alerta.
- **Migración:** cambio de nulabilidad compatible con los datos existentes. El `down` solo es posible si no hay NULL, y así queda documentado.

| Tarea | Criterio | Prueba |
|---|---|---|
| T-06.1 Regla de dominio por estado | CA-06.1 a CA-06.4 | `ControlMatafuegoTest` (Unit) |
| T-06.2 Migración y validación del API | CA-06.1 a CA-06.4 | `MantenimientoTest` |
| T-06.3 Formulario condicional | CA-06.1, CA-06.3 | Vitest |
| T-06.4 Panel con NULL | CA-06.1, CA-06.3 | `MantenimientoTest` + Vitest |
| T-06.5 DER y `cambios-pdf.md` | — | revisión |

- **Riesgos y reversión:** la reversión exige que no haya filas con NULL.
