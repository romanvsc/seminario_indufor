# Cotejo con el PDF y discrepancias

> Extraído de `Context.md` (sección 29). Ninguna discrepancia es una regla aprobada. Último cotejo: 2026-10-12 (se agregaron D14–D16 y la consigna de la cátedra; D01, D02 y D14 resueltas al preparar el Cuarto Adelanto).

## 29. Cotejo con el PDF fuente — 2026-10-06

### 29.1 Referencias y alcance del cotejo

Fuente: `TRABAJO PRACTICO FINAL - TERCER ADELANTO.docx.pdf`, 31 páginas físicas. Las referencias siguientes usan la posición de página en el archivo, comenzando en 1. Desde la página física 21 la numeración impresa queda desplazada: la página física 21 vuelve a mostrar «Página 20», la 22 muestra «Página 21», y así sucesivamente. No confundir ambos sistemas de referencia.

Se cotejaron el texto del documento, los 16 RF, los 5 RNF, las 12 relaciones del modelo fuente, el diccionario y visualmente las Figuras 9–12. Las secciones anteriores incorporan las precisiones confirmadas; esta sección conserva la trazabilidad de los hallazgos y las decisiones no resueltas.

### 29.2 Matriz de correspondencia funcional

| Definición | Referencia PDF (página física) | Resultado del cotejo |
|---|---|---|
| Alcance, impuestos, sueldos y telemetría | 3, sección 1.4 | Incorporados límites explícitos; stock y novedades quedan como discrepancias de alcance. |
| Actores y responsabilidades | 17, sección 3.1 | Precisado acceso de Administración a todos los frentes, consulta gerencial y apoyo de Logística. |
| RF01–RF03 | 18; 22, Figura 9; 29, diccionario | Producción diaria y modalidades confirmadas; falta representación de modalidad y separación informante/operario. |
| RF04 | 18; 22, Figura 9; 29 | Capacidad de adjuntar foto, opcional en secuencia y diccionario. |
| RF05 | 18; narrativa 9 | Orígenes de viajes Papel Misionero o Prusia, diferenciados de los tres frentes de producción. |
| RF06–RF08 | 18; 23, Figura 10 | Cotejo obligatorio por Administración y validación automática exacta; diferencias generan corrección. Falta dato documental del transportista. |
| RF09–RF11 | 18; 24, Figura 11; 30 | Corte semanal los lunes, métricas por clase de unidad, alertas técnicas y control mensual de matafuegos. |
| RF12 | 18; 24, Figura 11 | Exportación automática después de validación lógica y persistencia; no se prescribe aprobación humana adicional. |
| RF13 | 18; 17, actor externo; 20, trazabilidad | Importación del consolidado mensual externo por máquina/vehículo. Contrato y detalle físico pendientes. |
| RF14 | 18; narrativa 11 | Sumatoria al cierre quincenal por frente y producto; límites exactos de quincena no definidos. |
| RF15 | 19; narrativa 10–11 | Reporte del período vencido antes del día 15. La entrega el día 15 corresponde al circuito actual. |
| RF16 | 19 | Consulta histórica de producción y consumos por fecha, máquina, frente y operario; el agregado mensual importado no demuestra esa granularidad. |
| RNF01–RNF05 | 19, sección 3.3 | Conservados: captura sencilla, sincronización automática, restricción financiera/configuración, uptime >99,5% y no regresión de lecturas. |
| Modelo y normalización | 25–27, Figura 12 y secciones 5.2–5.3 | 12 relaciones; remito/viaje 1:1; viaje/correcciones 1:N. `id_solicitud` ya es un ajuste propuesto explícitamente en el PDF. |
| Diccionario de datos | 28–30, sección 5.4 | Campos y tipos base conservados; extensiones técnicas se distinguen del modelo académico. |

### 29.3 Definiciones técnicas adicionales de este proyecto

El PDF no prescribe Laravel, React, Tailwind, Sanctum, PWA/offline, arquitectura hexagonal, skills, CI, ADRs ni una API `/api/v1`. Son requisitos de ingeniería establecidos por este `Context.md`, y siguen vigentes como tales. MySQL/MariaDB sí aparece en el diccionario del PDF; el nombre `indufor_db` es una convención del proyecto.

RBAC normalizado, auditoría e integración local son extensiones de implementación. Su mera documentación no aprueba las migraciones. Como la cátedra exige que el DER coincida con la base implementada (`Context.md` §24), cuando una extensión se apruebe debe incorporarse al DER, modelo relacional y diccionario del PDF, y la diferencia respecto del modelo original se explica en el ADR correspondiente.

### 29.4 Registro de discrepancias y decisiones pendientes

| ID | Evidencia y problema | Resolución requerida antes de implementar |
|---|---|---|
| D01 | Página 3 incluye stock y cargas de combustible en tanques; RF12–RF13 y modelo 26 se limitan al intercambio con sistema externo. | **Resuelta (2026-10-12):** el registro de cargas de combustible, lubricantes y stock de tanques queda a cargo del Sistema de Control de Gastos e Insumos. El TP (Cuarto Adelanto, 1.4 Límites y 3.2 Proceso 3.0) lo declara fuera del nuevo sistema, que solo importa el consolidado mensual (RF13). No hay captura local de combustible. |
| D02 | Páginas 3 y 11 incluyen novedades de personal, clima y detenciones; no existe RF ni entidad específica. | **Resuelta (2026-10-12):** no hay registro estructurado de novedades de personal. Las circunstancias que afectan la producción (clima, ausencias, detenciones) se consignan en `produccion.observaciones`. El TP (1.4 Límites) fue ajustado. |
| D03 | Página 3 habla de toneladas o unidades de carga; diccionario 29 representa toneladas y m³. | Precisar magnitudes admitidas por proceso y frente, sin conversiones supuestas. |
| D04 | RF02 requiere operario e ID de máquina; Figura 9 distingue modalidad; diccionario 29 identifica `id_usuario` como informante. | Definir autor, operario, modalidad, granularidad del consolidado y prevención de duplicados entre cargas individuales y consolidadas. |
| D05 | RF08 exige ID de transportista, ausente en `remito` (29–30). | Definir dato documental independiente y su correspondencia con camionero/transportista; documentar la extensión del esquema. |
| D06 | Diccionario 29–30 describe magnitud logística como volumen/cantidad o volumen/peso; RF07 exige coincidencia exacta. | Definir unidades y precisión del cotejo. Mantener comparación exacta; cualquier tolerancia exige cambio funcional aprobado. |
| D07 | Figura 12 muestra viaje/remito 1:1; el modelo usa número comercial como PK. | Mantener unicidad por viaje en la propuesta. Confirmar unicidad del número por emisor/serie antes de migraciones; cambios requieren ADR. |
| D08 | Figura 11 valida contra última lectura; no desarrolla primera lectura, atrasos, concurrencia ni reemplazo de sensor. | Definir comparación temporal, control de concurrencia, métrica por unidad y evidencia de validación/exportación, preservando RNF05. |
| D09 | RF13 importa totales mensuales por unidad; RF16 solicita filtros de consumos por fecha y operario. | Definir granularidad del contrato externo y atribución histórica a frentes/operarios. No fabricar detalle diario ni atribuir consumo histórico al operario actual. |
| D10 | RF14–RF15 no definen límites de quincena, reaperturas ni cambios posteriores al cierre. | Aprobar períodos, zona horaria, hora límite, datos tardíos y versión de reportes. Mantener mes vencido y plazo anterior al día 15. |
| D11 | RNF02 requiere inmediatez; RNF04 no cuantifica ventana operativa. PWA admite captura diferida por ADR del proyecto. | Definir medición de latencia y uptime, conectividad y sincronización. Offline pendiente no satisface disponibilidad central hasta confirmación del backend. |
| D12 | Asignación de usuarios es histórica (28); máquina conserva solo frente/usuario actual (28–29). | Definir validación de registros atrasados e historial necesario de maquinaria sin reescribir hechos pasados a partir de su asignación actual. |
| D13 | Sistema externo entrega archivo mensual (17); formato, identificadores y correcciones no especificados. | Definir contrato versionado, idempotencia semántica, lotes corregidos, confirmaciones y fallas parciales; checksum no basta para todos los casos. Como RF12–RF13 deben demostrarse en la entrega, si no hay acceso al sistema real se implementa el adaptador sobre archivos con un simulador documentado. |
| D14 | Páginas 4, 5 y 8 mencionan un frente de **Corrientes** con control de egresos de tanque; no figura entre las tres unidades operativas (págs. 2, 3, 8) ni en RF02. | **Resuelta (2026-10-12):** se eliminaron del TP todas las menciones a Corrientes. El sistema opera solo con Papel Misionero, Bosques del Plata y Prusia. |
| D15 | RF11 (pág. 18) exige el control de matafuegos por cada **unidad móvil de la flota**; `control_matafuego` referencia cualquier `maquinaria`. | Definir qué tipos de maquinaria son unidades móviles y si el control aplica también a maquinaria forestal. |
| D16 | La sección 3.1 (pág. 17) dice que Administración "valida" datos de campo, pero ni los RF ni el DER definen estado o flujo de validación de producción. | No implementar aprobación de producción ni el permiso `production.validate` sin requerimiento aprobado. Si se necesita, agregar RF, atributo de estado en `produccion` y actualizar Figura 9 y DER. |

Estas discrepancias no son reglas nuevas aprobadas. Se resolverán en Fase 0 o antes de la fase afectada conforme al gate de diseño inicial, mediante requerimiento aprobado cuando cambie el negocio y ADR cuando se concrete una decisión técnica. El cotejo no habilita comenzar Fase 1 sin los restantes entregables de Fase 0.
