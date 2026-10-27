# Correcciones pendientes del PDF del TP

> Documento revisado: `TRABAJO PRACTICO FINAL - TERCER ADELANTO.docx.pdf` (31 páginas físicas).
> Contrastado con la consigna `TP FINAL/TP_FINAL_SEMINARIO.md`, la Unidad 5A (reglas de DFD) y las guías de DER y secuencia de la cátedra.
> Las correcciones se aplican sobre el documento fuente (Google Drive) y los diagramas (diagrams.net); después se reexporta el PDF.
> Páginas: posición física en el archivo (ver `docs/discrepancias.md` §29.1).

**Estado (2026-10-12):** aplicadas en `TRABAJO PRACTICO FINAL - CUARTO ADELANTO.docx` todas las filas marcadas ✅. Las filas sin marca siguen pendientes. La sección 5 (DER en Figuras 12a y 12b, modelo relacional, normalización y diccionario) se regenera desde `docs/database.md` y se verifica automáticamente contra él. El Tercer Adelanto quedó intacto. Los DFD nuevos están en `INDUFORSRL - CUARTO ADELANTO.drawio` (páginas DFD CONTEXTO y DFD NIVEL 0), generados desde un único modelo de flujos para garantizar el balanceo.

Prioridad: **Alta** = riesgo directo frente a un criterio obligatorio o motivo de desaprobación. **Media** = coherencia o completitud. **Baja** = forma.

## 1. Secciones de la plantilla que faltan

| # | Prioridad | Sección | Problema | Corrección |
|---|---|---|---|---|
| ✅ 1.1 | Alta | 2.4.3 Diccionario de procesos | No existe. La plantilla lo exige después del DFD Nivel 0. | Tabla Proceso / Descripción para 1.0–5.0, usando la tabla de "Procesos principales" (pág. 4) como base. |
| ✅ 1.2 | Alta | 2.4.4 Diccionario de datos del DFD | No existe. La Unidad 5A cierra la metodología con "documentar mediante Diccionario de Datos". | Tabla Flujo / Descripción con cada flujo y almacén de las Figuras 7 y 8 (composición de datos de cada flujo). |
| ✅ 1.3 | Media | 2.2 Observación directa | La plantilla pide la tabla "Proceso observado / Usuario"; el PDF solo tiene entrevistas y documentación. | Agregar la tabla. Si no hubo observación directa, declararlo explícitamente. |
| 1.4 | — | 6 a 9 | Construcción, despliegue, pruebas y conclusiones. Corresponden a entregas posteriores. | Se alimentan desde el desarrollo (`Context.md` §24.3). |

## 2. DFD del sistema actual (Figuras 7 y 8, págs. 13–14)

| # | Prioridad | Problema | Corrección |
|---|---|---|---|
| ✅ 2.1 | Alta | **Entidades externas incompletas.** Solo aparecen GERENCIA, PRODUCCION, CAMIONEROS y OPERARIOS. Faltan Encargados de grupo, Mantenimiento y Logística, que la narrativa, la tabla de procesos (pág. 4) y la "Guía de lectura" (pág. 12) presentan como actores. | Reemplazar PRODUCCION por las entidades reales: ENCARGADOS DE GRUPO, OPERARIOS/MAQUINISTAS, CAMIONEROS, LOGÍSTICA, MANTENIMIENTO, GERENCIA GENERAL. "Producción" es un proceso, no una entidad externa. |
| ✅ 2.2 | Alta | **Flujos que el Nivel 0 no recibe de Mantenimiento.** "Acción de reparación" y "Reporte mantenimiento" van hacia PRODUCCION, cuando la narrativa (pág. 11) dice que Mantenimiento recibe las novedades y coordina la respuesta. | Con la entidad MANTENIMIENTO del punto 2.1, dirigir "Novedad de falla" hacia Mantenimiento y "Acción de reparación" desde Mantenimiento. |
| ✅ 2.3 | Alta | **Balanceo Contexto ↔ Nivel 0.** Flujos del contexto que no aparecen en el Nivel 0: "Consultar datos" (hacia OPERARIOS), "Acción de reparación", "Solicitud de Corrección" hacia PRODUCCION. Nombres distintos entre niveles: "Enviar Informe producción" / "Enviar producción", "Gastos e Insumos" / "Reporte Gastos e Insumos". | Cada flujo que entra o sale del contexto debe aparecer en el Nivel 0 con el mismo nombre (Unidad 5A, §8). |
| ✅ 2.4 | Alta | **Entradas relevadas sin flujo.** La tabla de entradas (págs. 4–5) incluye planillas de combustible y lubricantes, lecturas semanales de horómetros/kilometrajes y reportes mensuales de matafuegos. En el Nivel 0, 3.0 CONTROLAR GASTOS E INSUMOS no recibe ninguna planilla de campo, y no hay flujo de lecturas de horómetros. | Agregar "Planilla de combustible" (Operarios/Encargados → 3.0) y "Lectura semanal de horómetros/kilometrajes" (Encargados/Operarios → 4.0). |
| ✅ 2.5 | Alta | **Nombres de flujo como acciones.** La Unidad 5A nombra los flujos como datos ("Pedido", "Factura"). Hay muchos verbos: "Enviar datos", "Consultar producción", "Consultar mantenimiento", "Guardar Remitos", "Guardar Viajes", "Capturar Registros de Mantenimiento", "Enviar Reporte Consolidado". | Renombrar con el dato que circula: "Parte diario de producción", "Solicitud de informe de producción", "Remito", "Aviso de viaje", "Registro de mantenimiento", "Informe consolidado". Reemplazar los genéricos "Enviar datos"/"Consultar datos" por el dato concreto. |
| ✅ 2.6 | Media | **Elemento del sistema nuevo dentro del sistema actual.** "Solicitud de Corrección" es el artefacto de RF08. En el sistema actual, la narrativa (pág. 10) describe que Administración "consulta al camionero o corrige el dato". La consigna exige que los DFD representen solo el sistema actual. | Renombrar a "Consulta por diferencia de viaje" o similar. |
| ✅ 2.7 | Media | **Salidas del sistema poco visibles.** Las salidas relevadas (reporte quincenal de producción y reporte mensual de gastos a Gerencia, alertas de fallas a Mantenimiento) no se distinguen claramente desde 5.0 CONSOLIDAR REPORTES. El almacén que representa los "cuadernitos" se llama REPORTES CONSOLIDADOS. | Agregar flujos "Informe quincenal de producción" e "Informe mensual de gastos y consumos" desde 5.0 hacia GERENCIA. Considerar nombrar el almacén "Cuadernos (cuadernitos)" para reflejar el soporte real. |
| ✅ 2.8 | Baja | Ortografía: "Correxión" (Nivel 0), "Correción" (Contexto). | "Corrección". |
| ✅ 2.9 | Baja | Fondo negro en las figuras: baja legibilidad e impresión deficiente. | Exportar con fondo blanco. |

## 3. Requerimientos (sección 3, págs. 17–20)

| # | Prioridad | Problema | Corrección |
|---|---|---|---|
| ✅ 3.1 | Alta | **Numeración de procesos distinta.** El DFD y la tabla de procesos usan 3.0 Controlar gastos e insumos, 4.0 Gestionar mantenimiento, 5.0 Consolidar reportes. La sección 3.2 agrupa los RF como "Proceso 3.0: Gestionar mantenimiento" y "Proceso 4.0: Consolidar Reportes". | Alinear los encabezados de 3.2 con la numeración del DFD. |
| ✅ 3.2 | Alta | **Proceso 3.0 sin requerimientos.** El alcance (pág. 3) incluye el registro de litros en máquinas, camionetas y tanques, con control de stock e histórico, pero no hay RF de registro de combustible. RF13 solo importa el consolidado externo. | Decidir (D01): agregar RF de registro de cargas de combustible y stock, o mover esa captura a "Límites" indicando que la gestiona el Sistema de Control de Gastos e Insumos. La cátedra exige coherencia alcance ↔ RF ↔ sistema. |
| ✅ 3.3 | Media | **Novedades de personal y clima.** Los límites (pág. 3) dicen que el sistema se limita "al registro de novedades de personal que afecten la producción", y la narrativa (pág. 11) las usa para explicar bajas de producción. No hay RF ni entidad. | Decidir (D02): agregar RF y entidad, o quitar la frase de los límites. |
| ✅ 3.4 | Media | **Corrientes.** Aparece como frente con control de tanque (págs. 4, 5, 8) pero no es una de las tres unidades. | Aclarar (D14). |
| ✅ 3.5 | Media | **Matriz de trazabilidad incompleta.** RF04 y RF11 no aparecen. | Agregar RF04 (P3, respaldo visual) y RF11 (control preventivo; objetivo específico de matafuegos). |
| ✅ 3.6 | Baja | La matriz llama "Sistema de Combustible" al sistema externo. | "Sistema de Control de Gastos e Insumos", como en el resto del documento. |
| ✅ 3.7 | Media | RNF03 exige autenticación, pero ni el DER ni el diccionario tienen credenciales. | Ver 4.2. |

## 4. Diseño de datos (sección 5, págs. 25–30)

| # | Prioridad | Problema | Corrección |
|---|---|---|---|
| ✅ 4.1 | Alta | **DER = base implementada.** La consigna exige que el DER coincida con la base implementada. La implementación prevista agrega tablas RBAC (`rol`, `permiso`, `usuario_rol`, `rol_permiso`), `integracion_lote`, `consumo_importado` y `auditoria_evento` (`docs/database.md`). | Cuando se aprueben, incorporarlas al DER, al modelo relacional (5.2), a la normalización (5.3) y al diccionario (5.4). Regla permanente: ninguna migración de dominio sin su reflejo en la sección 5. |
| ✅ 4.2 | Alta | `usuario` no tiene `email` ni `password`, y `rol` es un atributo de texto. | Agregar credenciales al DER y al diccionario. Reemplazar `usuario.rol` por la relación con `rol` (N:M mediante `usuario_rol`). |
| ✅ 4.3 | Media | **Argumento de 2FN.** 5.3.2 dice que "todas las relaciones utilizan claves primarias simples". Al agregar `usuario_rol` y `rol_permiso` (PK compuestas) el argumento deja de valer. | Reescribir 5.3.2 justificando que en las tablas de PK compuesta no hay atributos no clave con dependencia parcial. |
| ✅ 4.4 | Media | **Atributos sin decidir.** Modalidad consolidada/individual de producción (Figura 9 la usa, el DER no la tiene), transportista del remito (RF08 lo compara, el remito no lo tiene), unidades de volumen. | Resolver D04, D05 y D06 y reflejarlo en DER, diccionario y Figuras 9–10. |
| ✅ 4.5 | Baja | La Figura 12 es ilegible al tamaño de la página. | Página apaisada completa, o dividir el DER por áreas (personas y frentes, producción y logística, mantenimiento) manteniendo una vista general. |

## 5. Forma

| # | Prioridad | Problema | Corrección |
|---|---|---|---|
| ✅ 5.1 | Baja | La numeración impresa repite "Página 20" (páginas físicas 20 y 21) y queda desplazada hasta el final. | Regenerar la numeración automática. |
| ✅ 5.2 | Baja | Carátula: "TECNICATURA EN ANALISIS DE SISTEMA". | "TECNICATURA EN ANÁLISIS DE SISTEMAS". |
| ✅ 5.3 | Baja | Carátula: el apellido del docente no coincidía con la planificación 2026. | Corregido con la grafía de la planificación. |
| ✅ 5.4 | Baja | La "LEYENDA" de la pág. 12 (Flujo de datos / Terminadores, en colores) no corresponde a la tabla, que no usa esos colores. | Quitarla o aplicarla. |

## 6. Auditoría del 2026-10-27 (rama `mejoras/auditoria`)

Sin cambios de esquema: ninguna migración nueva, así que el DER, el modelo relacional y el diccionario (sección 5) siguen coincidiendo con `docs/database.md`. Cambiaron reglas y flujos que el documento describe.

| # | Prioridad | Problema | Corrección |
|---|---|---|---|
| 6.1 | Alta | **Alcance de la carga de mantenimiento (D28).** El documento no dice sobre qué unidades puede cargar lecturas y controles un encargado u operario. | En 3.1 (actores) y en la Figura 11 agregar el paso "verificar que el usuario esté asignado al frente de la unidad en la fecha de la lectura, o que sea su responsable"; si no, se rechaza con `SIN_ASIGNACION`. |
| 6.2 | Media | **Historial de asignaciones (D29).** La matriz de permisos del documento no distingue entre "mis asignaciones" y "las de todos". | En la tabla de roles y permisos: el personal de campo consulta solo sus asignaciones; el historial completo, Administración y Gerencia. |
| 6.3 | Media | **Máquina de otro frente (D30).** La Figura 9 no contempla una máquina trasladada temporalmente. | Nota en la Figura 9 o en 3.2: se permite, con aviso, y el parte guarda su frente efectivo (`produccion.id_frente`). |
| 6.4 | Media | **Corrección del parte con motivo (D18, D25).** La Figura 9 termina en el alta. | Agregar la alternativa "el autor corrige con motivo → auditoría antes/después". |
| 6.5 | Media | **Cierre de sesión y conectividad (D23).** RNF02 y la sección de seguridad no explican qué pasa al salir sin señal. | Indicar que la sesión solo se cierra con confirmación del servidor; sin red se avisa y se puede reintentar. |
| 6.6 | Alta | **Sección 8 (Validación y Pruebas).** Hay pruebas nuevas y trazabilidad completa. | Tomar la tabla de `docs/trazabilidad.md` (RF → caso de uso → endpoint → pantalla → prueba) y los totales: Pest 181/181, Vitest 79/79, Playwright 45/45 y 2/2 offline. |
| 6.7 | Media | **Alcance declarado.** Conviene que el documento diga explícitamente los límites. | En 1.4 (Límites): intercambio con el sistema de gastos por CSV con simulador (sin conexión real); RNF04 medible recién en producción; consumos sin desglose por frente ni operario (D09). |
