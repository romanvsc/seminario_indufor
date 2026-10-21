# ADR-004 — Contrato CSV v1 con el Sistema de Control de Gastos e Insumos

Status: Aceptado
Date: 2026-10-19

## Context

RF12 exige exportar **automáticamente** las lecturas validadas al sistema externo y RF13, importar su consolidado mensual de combustible (litros y costo por unidad). El PDF no define formato, transporte ni identificadores, y no hay acceso al sistema real. D13 fija un contrato CSV v1 con simulador; este ADR lo detalla. La integración vive en el contexto External Costs Integration, que es un Anti-Corruption Layer: el formato no cruza al dominio.

## Decision

**Identidad de la unidad (`codigo_unidad`):** la patente (`maquinaria.dominio_patente`) si la tiene; si no, `INT-<id_unidad>`. Es única y estable en los dos sentidos.

**Exportación de lecturas (RF12).**
- Se dispara sola al responder el alta de una lectura (después del commit, sin cola ni worker). Solo se exportan lecturas con valor: una lectura sin valor por instrumento roto no tiene nada que liquidar.
- Un archivo por lectura en `storage/app/private/integracion/salida/lectura-<id_lectura>.csv`, UTF-8, separador coma, punto decimal:

  ```text
  version,id_lectura,codigo_unidad,fecha_lectura,metrica,valor
  1,42,AB123CD,2026-10-19 08:30:00,KILOMETRAJE,85000
  ```
- Cada intento queda en `integracion_lote` (`tipo = EXPORT_LECTURAS`, `nombre_archivo`, `checksum` SHA-256, `estado` `OK` o `ERROR`, `detalle_error`).
- **Reintento sin duplicar:** el nombre del archivo es fijo por lectura, así que reexportar lo reemplaza. Una lectura está pendiente mientras no tenga un lote `OK` con su archivo. El reintento manual (`integration.export-readings`) y el comando `php artisan integracion:exportar-pendientes` (programable) exportan solo las pendientes.

**Importación del consolidado mensual (RF13).**
- Administración sube el CSV del período `YYYY-MM`:

  ```text
  periodo,codigo_unidad,litros,costo_total,referencia_externa
  2026-09,AB123CD,412.50,535950.00,LIQ-2026-09-001
  ```
- El encabezado tiene que ser exactamente ese. Todas las filas son del período declarado. Litros y costo van con punto decimal, ≥ 0 y hasta 2 decimales; el dinero se guarda en `DECIMAL(14,2)`.
- **Idempotencia:**
  - El mismo archivo (mismo checksum SHA-256) vuelve a responder con el lote original y no inserta nada.
  - Un archivo **distinto** para un período ya importado se rechaza (`PERIODO_YA_IMPORTADO`). Solo entra con el reemplazo explícito (`reemplazar = true` y motivo): en una transacción se borran los consumos del período, el lote anterior queda `REEMPLAZADO` y se audita `consumos.reemplazados`.
  - Nunca se suman dos lotes del mismo período.
- **Fallas parciales:**
  - Una fila con unidad desconocida, valores inválidos o una unidad repetida en el archivo queda en `detalle_error` con su número de fila, y las filas válidas se importan (`estado = PARCIAL`).
  - Si ninguna fila es válida, no se inserta nada (`estado = ERROR`).
  - No se crean unidades automáticamente.

**Simulador.** Como no hay acceso al sistema real, el comando `php artisan simulador:consumos YYYY-MM` y el botón "Descargar archivo de prueba" de la pantalla de Integración generan un consolidado v1 válido para las unidades activas. El simulador no corre en producción. Lo que exporta INDUFOR queda en la carpeta de salida, que hace de buzón del sistema externo.

## Alternatives

- **API REST del sistema externo:** sería lo ideal para RF12, pero no existe ni está documentada.
- **Leer la base del sistema externo:** prohibido por `Context.md` §16; acopla el dominio a un esquema ajeno.
- **Cola con worker para la exportación:** exige un proceso `queue:work` siempre vivo en el hosting, que todavía no está elegido. La exportación al terminar la respuesta, más un comando programable para pendientes, da el mismo resultado sin otro proceso.

## Consequences

- Cambiar de CSV a una API es otro adaptador de los mismos puertos (`ExportadorLecturas`, `LectorConsolidado`); el dominio no cambia.
- Si el servidor se cae entre el commit y la exportación, la lectura queda pendiente hasta el próximo reintento: nunca se pierde ni se duplica.
- Impacto en el TP: secciones 6.1 y 6.2 (construcción), DFD de nivel 0 (flujos con el Sistema de Control de Gastos e Insumos) y diccionario de `integracion_lote` y `consumo_importado`.
