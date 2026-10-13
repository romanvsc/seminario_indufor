---
name: indufor-traceability-audit
description: Auditoría y trazabilidad transversal de INDUFOR - registrar en `auditoria_evento` quién hizo qué, cuándo, sobre qué entidad, con estado anterior y posterior, origen y correlation_id para operaciones críticas (permisos, asignaciones, correcciones de producción, cotejo de viajes, remitos, solicitudes de corrección, lecturas rechazadas, importaciones y exportaciones). Úsala siempre que un caso de uso modifique datos críticos, cuando se implemente un endpoint de escritura, un job de integración o el visor `/audit`, o cuando alguien pregunte "¿quién cambió esto?".
---

# Auditoría y trazabilidad

Uno de los objetivos del proyecto es que el dato pueda seguirse desde el campo hasta Gerencia. En el sistema actual, cuando un número no cierra nadie sabe quién lo cambió. La auditoría es lo que permite responder eso, y también es evidencia para la sección de validación del TP.

Fuentes: `Context.md` §14 (en `docs/database.md`), §21 · skill `indufor-domain-map`.

## Qué auditar como mínimo

- Altas, bajas lógicas y cambios de permisos o roles.
- Asignaciones a frentes.
- Correcciones de producción.
- Cotejo de viajes (validado o con corrección) y cambios sobre remitos.
- Solicitudes de corrección y cambios de su estado.
- Lecturas de mantenimiento rechazadas o corregidas.
- Lotes de importación y exportación (inicio, fin, resultado).
- Acceso a reportes financieros, si la política de seguridad lo exige.

## Cómo registrar

- Un evento por operación de negocio, generado desde la capa Application (caso de uso), no desde un observer de Eloquent que no conoce la intención.
- **Misma transacción** que el cambio: si el cambio se revierte, el evento también.
- Campos: `id_usuario` (nulo si lo hizo el sistema), `bounded_context`, `accion` (verbo de negocio: `viaje.validado`, no `update`), `entidad`, `entidad_id`, `before_json`, `after_json`, `correlation_id`, `ip`, `user_agent`.
- `correlation_id` une todos los eventos de una misma petición o lote (por ejemplo, el lote de importación y cada consumo creado).
- **Sin secretos ni PII innecesaria** en `before_json`/`after_json`: nunca contraseñas, tokens ni archivos en base64.
- **Solo inserción:** no hay endpoint ni caso de uso que edite o borre eventos.
- Leer la auditoría requiere `audit.view`.

## Tests mínimos

- Cada operación de la lista genera exactamente un evento con la acción esperada.
- Si la operación falla y se revierte, no queda evento.
- `before_json`/`after_json` no contienen campos sensibles.
- Un usuario sin `audit.view` no puede consultar la auditoría.
