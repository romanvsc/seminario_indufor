---
name: indufor-external-costs-integration
description: Anti-corruption layer de INDUFOR con el Sistema de Control de Gastos e Insumos (terminador externo) - exportación automática de lecturas validadas (RF12), importación del consolidado mensual de combustible con litros y costos por unidad (RF13), lotes de integración, idempotencia, reintentos, fallas parciales y simulador para la entrega del TP. Úsala siempre que se toquen `integracion_lote`, `consumo_importado`, endpoints `/integrations`, jobs de importación/exportación, parsers de archivos, o cuando alguien quiera "leer directo de la base del sistema de gastos" o guardar el formato externo en el dominio.
---

# Integración con el Sistema de Control de Gastos e Insumos (RF12–RF13)

El sistema externo sigue existiendo y es dueño de la liquidación de insumos. INDUFOR le entrega lecturas validadas y recibe su consolidado mensual. Esta capa existe para que un cambio de formato del otro lado no rompa el dominio, y para que importar dos veces el mismo archivo nunca duplique costos en el reporte de Gerencia.

Fuentes: `Context.md` §6.1 (External Costs Integration), §16, §24.2 · `docs/database.md` §13 · `docs/discrepancias.md` D09, D13.

## Arquitectura

```text
Maintenance ──(puerto ExportadorLecturas)──► Adaptador ──► archivo/API externa
Reporting   ◄─(consumos en modelo interno)── Adaptador ◄── consolidado mensual externo
```

- Los puertos se definen en el lado interno con tipos del dominio (unidad, período, litros, costo).
- El adaptador traduce. Ningún nombre de columna, código ni estructura externa cruza hacia Domain o Application.
- No existe una tabla que "represente" al sistema externo. `integracion_lote` y `consumo_importado` son registros locales del intercambio.

## Reglas

1. **Exportación automática (RF12):** se dispara después de persistir una lectura válida, por cola (job), con reintentos controlados. Solo lecturas válidas.
2. **Importación mensual (RF13):** litros y costo total por unidad y período `YYYY-MM`. Dinero en `DECIMAL`; nunca `FLOAT`.
3. **Idempotencia:** checksum del archivo **más** una clave semántica (período + unidad + identidad del lote externo). El checksum solo no evita duplicados entre archivos distintos (D13).
4. **Correcciones del mismo período:** reemplazar un consolidado debe ser explícito, auditado y transaccional. Hasta que D13 lo defina, rechazar el segundo lote del mismo período con un mensaje claro en lugar de sumar.
5. **Fallas parciales:** registrar qué filas fallaron (`detalle_error`). Nunca destruir datos locales válidos por un error de integración.
6. **Mapeo de unidades:** cada fila externa se vincula a una `maquinaria` interna. Las filas sin unidad conocida se reportan; no se crean unidades automáticamente.
7. **Auditoría:** cada lote registra actor (o sistema), inicio, fin, estado y `correlation_id`.

## Para la entrega del TP

La cátedra exige que todos los RF funcionen. Si no hay acceso al sistema real, el adaptador trabaja con **archivos** (por ejemplo CSV con contrato versionado) y se incluye un **simulador** documentado que produce el consolidado mensual y recibe las exportaciones. El formato es una decisión pendiente (D13) y requiere ADR.

## Pendientes (no improvisar)

- **D13:** formato, transporte, identidad externa, confirmaciones y lotes corregidos.
- **D09:** el consolidado es mensual por unidad, pero RF16 pide filtros de consumo por fecha y operario. No fabricar detalle diario ni atribuir el consumo al operario actual de la máquina.

## Tests mínimos

- Importar el mismo archivo dos veces no duplica consumos (criterio de salida de Fase 5).
- Un archivo distinto con el mismo período y unidades se rechaza o reemplaza según la regla vigente, nunca se suma.
- Una fila con unidad desconocida queda en el detalle de error y las válidas no se pierden.
- La exportación de una lectura reintenta sin duplicar.
- Ninguna clase de Domain importa tipos del adaptador (test de arquitectura).
- Importación mensual → consolidado disponible (E2E 8).
