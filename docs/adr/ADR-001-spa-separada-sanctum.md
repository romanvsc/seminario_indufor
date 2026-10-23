# ADR-001 — SPA React separada con autenticación Sanctum

Status: Propuesto
Date: 2026-10-12

## Context

- El sistema debe ser una PWA desde el inicio (`Context.md` §3): instalable, con Service Worker, cache controlada y tolerancia a la señal inestable del monte (RNF01, RNF02).
- El frontend se hace en React + TypeScript + Vite. El backend es Laravel con API `/api/v1` y arquitectura hexagonal.
- La autorización es siempre del backend (RNF03); el frontend solo adapta la interfaz.
- Hay que elegir entre una SPA separada que consume la API o Inertia (Laravel sirve las páginas React), y cómo autenticarla.

## Decision

1. **SPA separada:** proyecto React + Vite independiente, desplegado como estáticos, que consume la API Laravel `/api/v1`.
2. **Laravel Sanctum en modo SPA:** sesión por cookie `httpOnly` + protección CSRF (`/sanctum/csrf-cookie`). Frontend y API bajo el mismo dominio raíz (por ejemplo `app.` y `api.` de un mismo dominio) para que las cookies funcionen.
3. **PWA con `vite-plugin-pwa`:** el Service Worker pertenece a la SPA y solo precachea el shell estático; las respuestas de la API no se cachean salvo catálogos no sensibles aprobados por ADR.

## Alternatives

| Alternativa | Por qué se descarta |
|---|---|
| Inertia + React (starter kit oficial de Laravel) | Las páginas las sirve el servidor: el Service Worker, la cache y la operación con mala señal quedan acoplados al ciclo de Laravel. Complica la PWA, que es requisito. |
| SPA con tokens Bearer en `localStorage` | Un token en el navegador queda expuesto a cualquier XSS. La cookie `httpOnly` no es accesible desde JavaScript. |
| Aplicación nativa (Android) | Fuera de alcance: duplica desarrollo y la cátedra evalúa un sistema web con base de datos. |

## Consequences

- CORS explícito con `supports_credentials` y dominios permitidos configurados por entorno.
- Dos artefactos de despliegue (estáticos y API); el README documenta ambos.
- Login: primero `GET /sanctum/csrf-cookie`, después `POST /api/v1/auth/login`. El cliente HTTP maneja 401 (volver al login) y 419 (renovar CSRF).
- Al cerrar sesión se limpian las caches de datos y los borradores sensibles del cliente.
- Catálogos aprobados para abrir los formularios de campo sin señal (specs/04, 2026-10-22): última sesión conocida (nombre, roles y permisos, solo para la UI), frentes, tipos de madera, unidades activas y asignaciones del usuario. Se guardan en `localStorage` (`indufor:copia-*`), se usan solo ante un error de conexión, nunca confirman nada (todo envío revalida en el backend) y se borran al cerrar sesión o si la sesión vence. Datos financieros, reportes y consumos nunca se copian.
- Tests E2E (Playwright) contra la SPA y la API levantadas juntas.

## Affected bounded contexts

Identity & Access (autenticación). Indirectamente todos, por el cliente HTTP compartido y la PWA.

## Migration/rollback

No hay sistema previo que migrar. Si en el futuro se prefiriera Inertia, la API y el dominio no cambian: solo se reemplaza la capa de presentación.

## Impacto en el TP

Secciones 6.1 (Arquitectura de la solución) y 6.2 (Tecnologías utilizadas).
