# Comparación visual del visor

- Referencia: visor original del kit, renderizado con el mismo plan de INDUFOR y tarea seleccionada, a 938 × 1066; también se tuvo en cuenta la captura compartida por el usuario.
- Implementación: visor React, misma resolución, datos y selección. Se compararon ambas capturas lado a lado.
- Primer pase: el nodo seleccionado aparecía descentrado y con otra escala. Se corrigió el centrado desde la lista y la escala inicial; el segundo pase conserva la composición, colores, lista, filtros y panel de detalle del original.
- Las tareas reales tienen títulos y cantidades distintos a la demostración. No se agregaron relaciones ficticias para imitar la captura.
- Verificación funcional: búsqueda, selección, ayuda, zoom y cadena; flecha y cadena adicionales con datos simulados. Build y validador del plan correctos.
- final result: passed
