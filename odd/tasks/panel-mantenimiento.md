# Renovar el panel de Mantenimiento

**Plan maestro:** UIX-009 (estado oficial en el plan).

## Objetivo y criterios

Organizar pendientes y estado de flota usando datos reales, filtros combinados, acciones autorizadas y estados de carga, error y vacío. Mantener reglas y API; advertir si se alcanza el límite de 200 unidades.

## Tareas

- [x] Explorar captura, código, permisos y cambios locales.
- [x] Probar conteos, filtros, errores, permisos y atención de fallas.
- [x] Implementar la interfaz con el sistema visual existente.
- [ ] Ejecutar pruebas y revisar escritorio, móvil y teclado cuando el navegador esté disponible.

## Registro

- 2026-11-04: plan aprobado. `maintenance.failure.manage` controla la atención; la lista de unidades tiene límite de 200 y las fallas se consultan paginadas. Se preservan los cambios locales previos.
- 2026-11-04: resumen accionable, filtros combinados y tabla con acceso a historial; avisos de carga, error y límite de unidades. Vitest 136/136, typecheck y build correctos, lint sin errores con 7 advertencias previas, detector sin hallazgos y diff sin errores. No se verificó visualmente ni con dispositivo: el navegador informa `The browser access host is unavailable`. Pendiente comprobar escritorio/móvil, temas, teclado y permisos con sesiones reales.
