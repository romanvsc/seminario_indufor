---
name: indufor-maintenance-meter-rules
description: Reglas de mantenimiento de INDUFOR (RF09–RF12, RNF05) - lectura semanal de horómetros y kilometrajes con corte los lunes, prohibición de lecturas menores a la anterior, alerta en tiempo real por números invertidos, fallas instrumentales notificadas a Mantenimiento, control mensual de matafuegos y exportación automática de lecturas validadas al sistema externo. Úsala siempre que se toque `lectura_mantenimiento`, `control_matafuego`, endpoints `/maintenance`, formularios de lectura o matafuegos, notificaciones de fallas, el panel técnico o la exportación de lecturas.
---

# Lecturas, fallas y matafuegos (RF09–RF12, RNF05)

Los números invertidos en las planillas de horómetros son uno de los errores que motivaron el proyecto (problema P3). La regla de no regresión es lo que la cátedra va a buscar en las pruebas: debe ser imposible de saltear y debe avisar en el momento, no después.

Fuentes: `Context.md` §8 (RF09–RF12), §9 (RNF05), §16 · `docs/database.md` §12.15–12.16 · `docs/discrepancias.md` D08, D15.

## Lecturas (RF09, RNF05)

1. **Corte semanal los lunes.** La lectura pertenece a la semana operativa cuyo corte es el lunes.
2. **Métrica según la unidad:** horómetro para máquinas forestales, kilometraje para vehículos livianos y camionetas. La unidad determina qué campo es obligatorio y cuál debe ir vacío. `tipo_maquinaria.metrica` (HOROMETRO/KILOMETRAJE) lo define (D08).
3. **No regresión:** una lectura nunca puede ser menor que la anterior de la misma unidad y métrica. Se valida en el dominio (autoritativo) y en el formulario (aviso inmediato: "la lectura anterior fue X").
4. **Alerta en tiempo real:** ante saltos sospechosos o dígitos posiblemente invertidos, avisar en pantalla antes de enviar. El aviso no reemplaza el rechazo del backend.
5. Comparar contra la última lectura **dentro de una transacción con bloqueo**, para que dos cargas simultáneas no pasen ambas la validación.

## Fallas (RF10)

- `tiene_falla = true` exige `detalle_falla`.
- Una falla genera una novedad visible para Mantenimiento y una notificación inmediata. El mecanismo de notificación requiere ADR.
- La falla **no** invalida la lectura ni agrega una aprobación humana (Figura 11).

## Matafuegos (RF11)

- Control mensual de estado y vencimiento de carga por **unidad móvil de la flota**. Decisión D15: aplica a todas las unidades activas.
- `fecha_vencimiento_carga` vencida o próxima debe ser visible para Mantenimiento.

## Exportación (RF12)

- Automática después de persistir una lectura válida. No hay aprobación humana extra.
- Una lectura inválida nunca se exporta.
- Pasa por el puerto de `indufor-external-costs-integration`; Maintenance no conoce el formato externo.
- Un error de exportación no borra ni revierte la lectura local; queda registrado para reintento.

## Decisión D08 (provisoria, revisar en producción)

- Primera lectura sin antecedente: se acepta.
- Lectura atrasada: debe ser ≥ la anterior y ≤ la posterior de la misma unidad, ordenadas por fecha.
- Concurrencia: bloqueo de fila por unidad durante la validación.
- Cambio o reemplazo de instrumento: fuera de v1. Si aparece, registrar discrepancia; nunca abrir una excepción silenciosa a la no regresión.

## Tests mínimos

- Lectura válida persiste y dispara la exportación (E2E 5).
- Lectura inferior a la anterior se rechaza con mensaje claro (E2E 6).
- Falla sin detalle se rechaza; falla con detalle notifica a Mantenimiento (E2E 7).
- Horómetro en un vehículo liviano (o km en una máquina forestal) se rechaza.
- Dos lecturas concurrentes: solo una pasa si la otra quedaría en regresión.
- Lectura atrasada mayor que la lectura posterior se rechaza.
- La lectura inválida no aparece en ningún lote de exportación.
