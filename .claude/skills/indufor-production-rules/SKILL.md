---
name: indufor-production-rules
description: Reglas de negocio de producción forestal de INDUFOR (RF01–RF04) - parte diario, pulpable vs aserrable, toneladas y metros cúbicos, carga consolidada del encargado (Papel Misionero, Bosques del Plata) vs individual del operario (Prusia), unidad/máquina, frente, asignaciones vigentes y foto de respaldo. Úsala siempre que se diseñe, programe, pruebe o revise cualquier cosa de producción - tabla `produccion`, formulario de carga, endpoint `/production`, validaciones, sumatorias, filtros o dashboard que muestre producción - aunque el pedido no mencione "RF01".
---

# Reglas de producción (RF01–RF04)

Producción es el dato que más pasa por manos hoy (foto → WhatsApp → cuadernito) y el que Gerencia más consulta. Las reglas protegen dos cosas: que pulpable y aserrable nunca se mezclen, y que cada parte se pueda rastrear hasta persona, frente, máquina y jornada.

Fuentes: `Context.md` §8 (RF01–RF04), §16 · `docs/database.md` §12.11 · `docs/discrepancias.md` D03, D04, D12, D16.

## Reglas aprobadas

1. **Tipo de madera estricto (RF01).** Solo valores del catálogo `tipo_madera` habilitados (`pulpable`, `aserrable`). Nada de texto libre ni "mixto".
2. **Parametrización (RF02).** Todo parte tiene frente, usuario y unidad (`id_unidad`). Se seleccionan de listas, no se escriben.
3. **Modalidad por frente (RF03).** Encargados reportan consolidado en Papel Misionero y Bosques del Plata; operarios reportan individual en Prusia. Ambos flujos coexisten sin perder el origen.
4. **Foto opcional (RF04).** El respaldo fotográfico es evidencia, no reemplaza datos estructurados. Validar MIME (imagen) y tamaño; guardar con la abstracción de storage, nunca la ruta absoluta del servidor.
5. **Magnitudes.** `cantidad_toneladas` y `metros_cubicos` son nullable; debe existir al menos una válida. Sin negativos. **Nunca sumar toneladas con m³ ni convertir con factores supuestos.**
6. **Fecha.** `fecha_registro` es la jornada del parte, distinta de `created_at`.
7. **Coherencia histórica.** Frente, usuario y unidad deben ser coherentes con la asignación vigente **en la fecha del parte** (`frente_asignado`). El frente actual de la máquina no prueba dónde estaba antes.
8. **Correcciones auditadas.** Cambiar un parte ya registrado genera evento de auditoría (ver `indufor-traceability-audit`).

## Decisiones pendientes: no improvisar

| ID | Qué falta | Qué hacer mientras tanto |
|---|---|---|
| D04 | Cómo persistir la modalidad (el DER no tiene `tipoRegistro`), separar informante de operario productor y evitar el doble cómputo consolidado + individual | No inventar columnas. Si la tarea lo necesita, detenerse y pedir la decisión. |
| D03 | "Unidades de carga" como tercera magnitud | Solo toneladas y m³. |
| D12 | Validación de partes atrasados y el historial de la máquina | Validar contra `frente_asignado` en la fecha; no usar `maquinaria.id_frente_actual` para hechos pasados. |
| D16 | Aprobación de producción por Administración | No existe estado ni permiso de validación. |

## Tests mínimos

- Rechaza un tipo de madera fuera del catálogo y valores negativos.
- Rechaza un parte sin ninguna magnitud.
- Encargado de Papel Misionero carga consolidado (E2E 1); operario de Prusia carga individual (E2E 2).
- Rechaza un usuario no asignado al frente en la fecha del parte.
- Una foto con MIME no permitido se rechaza; un parte sin foto se acepta.
- Las sumatorias por tipo nunca mezclan pulpable con aserrable ni toneladas con m³.
- Las policies impiden cargar en un frente ajeno.
