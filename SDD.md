> **Antecedente histórico:** este encargo SDD y sus instrucciones por fases documentan el trabajo iniciado el 2026-10-22. No son el flujo vigente para pedidos nuevos; usar [ODD.md](ODD.md). Se conservan hallazgos, decisiones y referencias para trazabilidad.

Trabajá sobre el proyecto seminario_indufor utilizando SDD (Spec Driven Development).

OBJETIVO

Que el sistema sea confiable y sencillo para las personas que lo utilizan diariamente: operarios, encargados, camioneros, Administración, Logística, Mantenimiento y Gerencia.

La prioridad es completar correctamente las tareas reales, prevenir pérdida o duplicación de datos y facilitar la recuperación ante errores. El rediseño visual queda para después.

No consideres que una funcionalidad está completa solamente porque existe un endpoint o pasan sus tests: debe poder utilizarse desde la interfaz con los permisos correspondientes.

REGLAS DE TRABAJO

1. Leé las instrucciones del repositorio: AGENTS.md aplicables, CLAUDE.md, Context.md, skills locales, docs/rbac.md, docs/discrepancias.md y ADRs relevantes.
2. Revisá git status y preservá los cambios locales existentes.
3. Utilizá las herramientas de exploración que exijan las instrucciones del proyecto. Si existe .codegraph/, consultá CodeGraph antes de buscar código; respetá también las reglas locales de Graphify.
4. Verificá cada hallazgo contra la implementación actual. Los puntos siguientes son hipótesis de auditoría que debés confirmar, precisar o descartar con evidencia.
5. No inventes reglas de negocio ni cambies silenciosamente RF/RNF o decisiones vigentes.
6. No incorpores frameworks, dependencias o capas arquitectónicas sin una necesidad concreta.
7. No hagas commits, push, deploy ni operaciones destructivas sobre bases existentes.
8. Diferenciá siempre evidencia de código, tests ejecutados, pruebas con mocks y comportamiento observado en la aplicación real.

HALLAZGOS QUE DEBÉS INVESTIGAR, EN ORDEN

A. INTEGRIDAD DE CONSUMOS Y REPORTES

Posible problema:
Al reemplazar un consolidado mensual con filas inválidas, se eliminan los consumos anteriores y se insertan solamente las filas válidas. El reporte puede mostrar “Consolidado completo” simplemente porque existe consumo de alguna unidad.

Investigar:
- Importaciones completas, parciales y fallidas.
- Reemplazo de información previamente válida.
- Reimportación del mismo archivo.
- Trazabilidad del lote vigente.
- Qué evidencia permite afirmar que un período está completo.

No deduzcas completitud comparando contra toda la flota activa sin una regla aprobada: puede haber unidades sin consumo.

La especificación debe resolver explícitamente la política de reemplazo y el significado de cada estado antes de implementarlos.

B. CARGAS ATRASADAS

Posibles problemas:
- Producción ofrece asignaciones vigentes hoy, aunque el backend valida la asignación en la fecha del parte.
- El formulario de lecturas compara contra la última lectura actual y puede bloquear una lectura histórica válida.

La fecha ingresada debe determinar las referencias correspondientes, respetando las reglas vigentes.

Caso obligatorio:
Si existen 100 h el lunes y 120 h el miércoles, una lectura de 110 h del martes debe aceptarse; una de 130 h debe rechazarse.

C. CORRECCIÓN DE PRODUCCIÓN

Posible problema:
El backend permite corregir partes propios y audita los cambios, pero la interfaz no ofrece editar sus datos.

Especificar el circuito completo:
localizar parte → abrir detalle → corregir campos permitidos → validar → confirmar → consultar resultado.

Preservar autoría, permisos y auditoría. No ampliar las facultades de Administración ni otros roles sin respaldo funcional.

D. CONECTIVIDAD, BORRADORES Y SESIÓN

Investigar:
- Recuperación de borradores al cerrar y reabrir la aplicación sin señal.
- Dependencia de sesión y catálogos para acceder al formulario.
- Fallos de almacenamiento local ignorados.
- Formularios detenidos en “Cargando…” cuando falla una consulta.
- Vencimiento de sesión durante una carga.
- Falta de borrador persistente en controles de matafuegos.
- Salida o actualización de la aplicación con datos pendientes.

Preservar la decisión vigente: confirmar registros exige conexión. No implementar sincronización automática de operaciones offline sin una decisión explícita.

La aplicación debe comunicar con precisión:
borrador conservado, conservación fallida, envío en curso, resultado incierto, registro confirmado y error recuperable.

E. REINTENTOS SIN DUPLICADOS

Posible problema:
La idempotencia de producción, viajes y lecturas utiliza caché temporal y no evita solicitudes simultáneas con la misma clave.

Especificar:
- Persistencia y alcance de las claves.
- Solicitudes concurrentes.
- Pérdida de respuesta después de guardar.
- Reintento al día siguiente.
- Misma clave con datos diferentes.
- Comportamiento cuando falla la transacción.

El resultado esperado debe ser verificable: una misma operación no produce dos registros.

F. MATAFUEGO FALTANTE

Posible problema:
Se permite seleccionar FALTANTE, pero se exige una fecha de vencimiento de una etiqueta que el usuario podría no tener.

Definir con respaldo funcional los datos obligatorios por estado. No inventar fechas ni asignar valores ficticios para satisfacer el esquema.

G. FACILIDAD DE USO DIARIO

Investigar y especificar:
- Inicio orientado a tareas según rol.
- Acceso a pendientes y borradores.
- Consulta de las últimas cargas propias.
- Precarga de datos conocidos, siempre con posibilidad de revisión.
- Confirmaciones persistentes y comprensibles.
- Mensajes que indiquen cómo resolver el problema.

No confundir facilidad de uso con decoración o una nueva identidad visual.

H. CONSULTAS E HISTORIAL

Investigar:
- Filtros disponibles en backend que faltan en frontend.
- Búsqueda por remito, unidad y persona.
- Límites de 50/100 elementos sin acceso a páginas siguientes.
- Historial de lecturas, controles y fallas atendidas.
- Conservación de filtros al navegar.
- Necesidad posterior de exportación e impresión.

FLUJO SDD OBLIGATORIO

FASE 1 — AUDITORÍA Y ESPECIFICACIÓN

No modifiques código de aplicación en esta fase.

Usá la convención de especificaciones existente en el repositorio. Si no existe, proponé una estructura sencilla en specs/, organizada por capacidad funcional.

Cada especificación debe incluir:

- Problema y evidencia con archivo y línea.
- Usuarios y tareas afectados.
- RF/RNF, bounded contexts y decisiones relacionadas.
- Comportamiento actual y comportamiento esperado.
- Alcance y exclusiones.
- Reglas e invariantes.
- Flujo principal y alternativas.
- Errores, permisos, conectividad y recuperación.
- Impacto previsto en API, datos e interfaz.
- Criterios de aceptación verificables en formato Dado/Cuando/Entonces.
- Decisiones pendientes y supuestos explícitos.

Separá defectos confirmados, mejoras de uso y cambios que requieren una definición de negocio.

Cuando una decisión sea necesaria, presentá alternativas concretas, recomendación y consecuencias. Avanzá con las especificaciones independientes mientras tanto.

FASE 2 — PLAN Y TAREAS

Para cada especificación, prepará:

- Diseño técnico mínimo.
- Dependencias y orden de implementación.
- Migraciones necesarias y compatibilidad con datos existentes.
- Estrategia de pruebas por riesgo.
- Tareas pequeñas con referencias a sus criterios de aceptación.
- Riesgos y forma de revertir los cambios.

Mantené trazabilidad:
hallazgo → requisito → criterio de aceptación → tarea → prueba.

No mezcles correcciones críticas con rediseño visual.

PRIMERA ENTREGA

Entregá:
1. Diagnóstico actualizado y priorizado.
2. Especificaciones y plan de implementación.
3. Decisiones de negocio que requieren mi respuesta.
4. Primer bloque recomendado y motivo de su prioridad.

Detenete antes de implementar y esperá mi aprobación de las especificaciones.

FASE 3 — IMPLEMENTACIÓN, SOLO TRAS APROBACIÓN

Implementá por bloques pequeños siguiendo las especificaciones aprobadas.

- Agregá pruebas de regresión para los defectos confirmados.
- Verificá permisos en backend y experiencia completa en frontend.
- Probá los escenarios de concurrencia y pérdida de respuesta cuando correspondan.
- Usá bases de prueba aisladas; nunca reinicies una base existente sin autorización explícita.
- Actualizá documentación, ADRs y referencias al DER cuando corresponda.
- Si aparece una divergencia funcional, actualizá primero la especificación.
- No declares un bloque terminado con criterios de aceptación sin verificar.

Al cerrar cada bloque, informá qué cambió, qué criterios cumplió, qué pruebas ejecutaste y qué limitaciones quedan.
