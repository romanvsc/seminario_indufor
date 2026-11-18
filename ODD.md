# Flujo obligatorio: Organic Driven Development

Este contrato rige para Claude y Codex en INDUFOR. Las instrucciones de mayor prioridad y los pedidos explícitos del usuario prevalecen. La implementación solo comienza cuando el pedido la autoriza; una investigación o auditoría de solo lectura no autoriza cambios.

1. **Explorar:** revisar el pedido, el estado Git, los requisitos, decisiones, código y pruebas pertinentes; consultar CodeGraph y Graphify cuando las reglas del proyecto lo requieran. Declarar una decisión de negocio no resuelta sin inventarla.
2. **Registrar:** toda tarea de trabajo se registra en el plan maestro con alcance, estado, criterios, siguiente paso y evidencia según su esquema. Una solicitud expresamente de solo lectura no escribe archivos; si luego se autoriza trabajo, registrar esa tarea antes de ejecutarla.
3. **Dimensionar:** un cambio pequeño, comprendido y retomable a partir del pedido y el diff usa el registro del plan y un flujo ligero. Si necesita conservar contexto para retomarlo, crear antes de cambiar el código `odd/tasks/<nombre>.md` y enlazarlo desde la tarea del plan; incluir objetivo, criterios, tareas con estado, decisiones, verificaciones, evidencia y próximo paso. No crear un segundo tablero: el plan maestro es la fuente de estados y dependencias; el documento ODD amplía el contexto de esa tarea.
4. **Implementar:** avanzar dentro del alcance autorizado, preservar los cambios locales ajenos y respetar la arquitectura hexagonal, permisos, requisitos y reglas de negocio. Una decisión o propuesta no amplía por sí misma la autorización. Sin commits, push ni despliegue salvo pedido del usuario.
5. **Verificar y cerrar:** elegir pruebas y controles proporcionales al riesgo y a los cambios; ejecutar los aplicables, corregir fallos y registrar resultados reales. No marcar HECHO si falta un criterio o verificación necesaria. Informar las comprobaciones no ejecutadas y sus límites, y actualizar la tarea y el documento ODD.

## Engram

- Usar la memoria local compartida de Engram para el proyecto: identificar el proyecto y buscar contexto pertinente al iniciar o retomar; recuperar el registro completo antes de depender de él.
- Para una tarea con documento ODD, mantener una copia actualizada del documento y su ruta en el tema `odd/<nombre>/tasks`. Al retomar, comparar memoria y archivo; ante divergencias revisar fecha y evidencia, preservar ambos hasta reconciliar y actualizar la copia. El archivo y el plan maestro conservan la evidencia y el estado oficial.
- Guardar decisiones, correcciones, hallazgos y restricciones duraderas, con identificadores estables; no registrar secretos, datos sensibles innecesarios ni transcripciones. Resumir los avances y el siguiente paso al terminar o antes de perder contexto.
- Si Engram no está disponible, informar la limitación, continuar el trabajo autorizado con plan y documento local, y sincronizar cuando vuelva a estar disponible. No afirmar que una memoria se guardó o que ambos agentes acceden a ella sin comprobarlo.

Las especificaciones y decisiones existentes en `SDD.md` y `specs/` son antecedentes históricos, no un flujo obligatorio para solicitudes nuevas. Se conserva su validez funcional y trazabilidad salvo decisión posterior explícita.
