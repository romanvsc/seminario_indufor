# Decisiones de negocio

**Resueltas el 2026-10-22: el usuario aprobó todas las recomendaciones ("sí a todo lo recomendado").** Quedaron registradas en `docs/discrepancias.md`: A1 y A2 → D21, E1 y S-05.1 → D22, D1 → D23, F1 → D24, C1 → D25, G1 → D26, H1 → D27.

| ID | Spec | Pregunta | Opciones | Recomendación | Bloquea |
|---|---|---|---|---|---|
| **A1** | 01 | ¿Cómo se reemplaza un consolidado ya importado? | (a) total o nulo: solo con un archivo sin errores · (b) fusión por unidad · (c) como hoy | **(a)**: un archivo malo nunca destruye datos válidos | Bloque 2 |
| **A2** | 01 | ¿Con qué evidencia se dice que un período está "completo"? | (a) ninguna: se informa estado y cantidades, nunca "completo" · (b) total de control en el CSV v2 · (c) cierre manual por Administración | **(a)**: no inventa una regla y no depende del sistema externo | Bloque 2 |
| **E1** | 05 | ¿Cuánto se guardan las claves de idempotencia? | (a) para siempre · (b) se purgan a los 90 días | **(a)**: pocas filas, nunca duplica | No (se puede cambiar después) |
| **D1** | 04 | ¿Qué pasa con los borradores al salir? | (a) aviso con confirmación y después se borran · (b) se conservan para el mismo usuario · (c) como hoy | **(a)**: protege los celulares compartidos y nada se pierde sin aviso | Solo T-04.5 |
| **F1** | 06 | ¿Qué datos se exigen según el estado del matafuego? | (a) vencimiento obligatorio salvo FALTANTE o etiqueta ilegible · (b) salvo FALTANTE · (c) siempre opcional | **(a)**: no obliga a inventar fechas y mantiene el control | Bloque 3 (spec 06) |
| **C1** | 03 | ¿La corrección de un parte exige motivo? | (a) sí · (b) no | **(a)**: igual que en logística (D19) | Bloque 4 (spec 03) |
| **G1** | 07 | ¿Qué muestra el inicio por rol? | (a) accesos y pendientes por rol · (b) solo accesos | **(a)** | Bloque 5 |
| **H1** | 08 | ¿Exportación e impresión? | (a) impresión del navegador · (b) CSV por reporte · (c) PDF en el servidor | **(a)** por ahora | No |
| **S-05.1** | 05 | ¿La tabla técnica `idempotencia` entra en el DER del TP? | sí, como `integracion_lote` · no, con una nota explícita | **sí** | Documentación del bloque 1 |

Las decisiones se registran en `docs/discrepancias.md` como **D21** en adelante, con la fecha y la indicación "decidida por el usuario".
