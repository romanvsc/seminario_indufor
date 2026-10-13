---
name: indufor-logistics-remito-validation
description: Reglas de logística de INDUFOR (RF05–RF08) - declaración digital de viajes del camionero, carga del remito por Administración, cotejo exacto viaje↔remito, estados PENDIENTE/VALIDADO/CORRECCION_SOLICITADA y solicitudes de corrección. Úsala siempre que se toque `viaje_logistica`, `remito`, `solicitud_correccion`, endpoints `/logistics`, la pantalla del camionero, la bandeja de cotejo de Administración, máquinas de estado del viaje o tests de validación, incluso si solo se pide "agregar un campo al remito" o "permitir aprobar el viaje a mano".
---

# Logística, remitos y cotejo (RF05–RF08)

Hoy Administración coteja a mano cada mensaje de WhatsApp contra el remito en papel. El sistema automatiza ese control, pero solo sirve si el estado `VALIDADO` significa siempre lo mismo: declaración y documento coinciden exactamente. Toda puerta lateral (aprobar a mano, tolerancias, editar la declaración) destruye ese valor.

Fuentes: `Context.md` §8 (RF05–RF08), §16 · `docs/database.md` §12.12–12.14 · `docs/discrepancias.md` D05, D06, D07.

## Ciclo de vida

```text
Camionero declara viaje ──► PENDIENTE
Administración carga remito y se ejecuta el cotejo
   ├─ coincidencia exacta ──► VALIDADO
   └─ diferencia ───────────► CORRECCION_SOLICITADA + solicitud_correccion(PENDIENTE)
```

- El viaje **nace `PENDIENTE`**. Un viaje sin remito es válido y queda pendiente (Figura 10).
- `VALIDADO` solo lo asigna el cotejo. No hay endpoint, botón ni permiso que lo fuerce.
- El cotejo es responsabilidad de Administración (RF06). Logística aporta datos, no valida.

## Reglas

1. **Origen (RF05):** solo Papel Misionero o Prusia. Bosques del Plata no es origen habilitado; ampliarlo requiere un cambio de RF.
2. **Coincidencia exacta (RF07):** sin tolerancias ni redondeos de negocio. Ambos volúmenes están en toneladas `DECIMAL(10,2)` y se comparan con igualdad exacta (D06).
3. **Campos del cotejo (RF08):** volumen, tipo de madera e ID de transportista. Cada diferencia se describe en `detalle_diferencias`.
4. **Transportista documental (D05):** `remito.id_transportista` lo carga Administración tal como figura en el remito y se compara con `viaje_logistica.id_usuario_camionero`. Nunca copiarlo del viaje: el cotejo dejaría de detectar diferencias.
5. **Relación 1:1 viaje–remito:** `remito.id_viaje` es único. `numero_remito` es la PK del modelo fuente; si la numeración se repite por emisor o serie, cambiarla requiere ADR (D07).
6. **Inmutabilidad de la declaración:** la declaración original no se corrige en silencio. Las correcciones quedan registradas y auditadas.
7. **Varias solicitudes por viaje:** `solicitud_correccion` es 1:N con PK propia (`id_solicitud`). Estados: `PENDIENTE` → `EN_REVISION` → `RESUELTA`.
8. Todo el cotejo (estado del viaje y solicitud) ocurre en **una transacción** y se audita.

**No definido todavía:** qué ocurre después de `RESUELTA` (¿nuevo remito, re-declaración, re-cotejo?). Si la tarea lo necesita, registrar la discrepancia y preguntar.

## Tests mínimos

- Viaje recién declarado queda `PENDIENTE`.
- Remito idéntico → `VALIDADO` (E2E 3).
- Diferencia en volumen, en tipo de madera o en transportista → `CORRECCION_SOLICITADA` y solicitud con el detalle (E2E 4), un caso por campo.
- No existe forma de pasar a `VALIDADO` sin remito: probar la API directamente, no solo la UI.
- Un camionero solo ve sus viajes (`logistics.trip.view-own`).
- Un segundo remito para el mismo viaje se rechaza.
- Viaje con origen Bosques del Plata se rechaza.
