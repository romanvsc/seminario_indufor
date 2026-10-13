# ADR-002 — Formato uniforme de errores de la API

Status: Aceptado
Date: 2026-10-13

## Context

`Context.md` §17 exige errores con formato uniforme y sin detalles internos hacia el cliente. El frontend necesita un código estable para decidir qué mostrar (por ejemplo, diferenciar "lectura regresiva" de "sin permiso") sin interpretar mensajes de texto.

## Decision

Toda respuesta de error de `/api/*` tiene esta forma:

```json
{ "error": { "code": "CODIGO_ESTABLE", "message": "Mensaje para el usuario, en español.", "details": { } } }
```

| Situación | HTTP | `code` |
|---|---|---|
| Validación de entrada (FormRequest) | 422 | `VALIDACION`, con `details` = errores por campo |
| Regla de negocio (`ReglaDeNegocioException`) | 422 | Código propio del caso, p. ej. `USUARIO_AUTODESHABILITACION`, `CREDENCIALES_INVALIDAS` |
| Sin sesión | 401 | `NO_AUTENTICADO` |
| Sin permiso | 403 | `SIN_PERMISO` |
| Recurso inexistente | 404 | `NO_ENCONTRADO` |
| CSRF / sesión vencida | 419 | `SESION_EXPIRADA` |
| Límite de intentos | 429 | `DEMASIADOS_INTENTOS` |
| Cualquier otro error (con `APP_DEBUG=false`) | 500 | `ERROR_INTERNO`, sin trazas ni SQL |

`details` se omite cuando no aporta. Implementación: `backend/bootstrap/app.php`.

## Alternatives

- **RFC 9457 (Problem Details):** estándar, pero agrega campos (`type`, `instance`) que nadie consume en este proyecto y obliga a URIs de tipo. Se puede migrar más adelante sin cambiar los códigos.
- **Formato por defecto de Laravel:** distinto para validación y para el resto, y expone trazas con `APP_DEBUG=true`.

## Consequences

- Los códigos son contrato: no se renombran sin actualizar el frontend y este ADR.
- Cada regla de negocio nueva define su código en la skill de su contexto.
- Los tests verifican `error.code`, no el texto del mensaje.

## Affected bounded contexts

Todos (capa HTTP compartida).

## Migration/rollback

No aplica.

## Impacto en el TP

Sección 6.1 (arquitectura) y 8 (casos de prueba que verifican errores).
