---
name: indufor-managerial-reporting
description: Reportes y dashboard gerencial de INDUFOR (RF14–RF16, RNF03) - sumatoria quincenal de producción por frente y tipo de madera, consolidado mensual de gastos y consumos del período vencido antes del día 15, filtros históricos por fechas, máquina, frente y operario, y permisos financieros. Úsala siempre que se toquen endpoints `/reports` o `/dashboard`, consultas de agregación, KPIs, gráficos para Gerencia, exportes de reportes o permisos `reports.*`, aunque el pedido sea solo "mostrar un total" o "agregar un gráfico".
---

# Reportes y dashboard gerencial (RF14–RF16)

Gerencia hoy decide con cuadernitos que llegan tarde. El dashboard reemplaza eso, pero solo si los totales son **reproducibles**: el mismo filtro devuelve siempre el mismo número y se puede explicar desde los registros fuente.

Fuentes: `Context.md` §8 (RF14–RF16), §9 (RNF03), §16 · `docs/discrepancias.md` D09, D10.

## Reglas

1. **Quincenal (RF14):** sumatoria de producción por frente y tipo de producto al cierre de cada quincena.
2. **Mensual (RF15):** consolida datos operativos e insumos importados (RF13) del **período vencido** (mes anterior). Debe estar disponible **antes del día 15**. "Entregar el día 15" es el circuito actual, no el plazo del nuevo sistema.
3. **Filtros (RF16):** rango de fechas, máquina, frente y operario, para producción y consumos. Validados en el backend y paginados.
4. **Sin mezclas:** pulpable y aserrable separados; toneladas y m³ separados; nunca un "total general" que sume magnitudes distintas.
5. **Permisos:** reportes financieros (costos, consumos valorizados) solo para Administración y Gerencia (`reports.financial`). Los filtros históricos respetan RBAC: un encargado no ve otros frentes. El acceso a reportes financieros puede auditarse.
6. **Reporting no tiene tablas de escritura propias:** lee de los contextos mediante consultas autorizadas. Si se agregan tablas de snapshot o cierre, primero hace falta un ADR y su reflejo en el DER (D10).
7. **Rendimiento:** consultas apoyadas en los índices de `docs/database.md` §15; verificar con `EXPLAIN` antes de agregar índices.
8. **Visualización:** usar la skill `dataviz` para gráficos. React Bits solo como acento visual; los números deben leerse sin animación.

## Decisiones provisorias vigentes (revisar en producción)

- **D10:** quincenas del 1 al 15 y del 16 a fin de mes, zona `America/Argentina/Buenos_Aires`. Reportes calculados al consultar; sin cierres congelados.
- **D09:** consumos filtrables por período y máquina. Frente y operario se muestran como "no disponible" en v1; nunca inventar el desglose.

## Tests mínimos

- Totales quincenales reproducibles con datos fijos (criterio de salida de Fase 6), incluidos los bordes de los días 15 y 16.
- Pulpable y aserrable nunca se suman.
- El consolidado mensual usa el período vencido.
- Usuario sin permiso que pide un reporte financiero recibe 403 (E2E 10).
- Gerencia consulta el dashboard (E2E 9).
- Un encargado que filtra por otro frente no recibe datos de ese frente.
