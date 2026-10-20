# ADR-003 — Aviso de fallas a Mantenimiento dentro de la aplicación

Status: Aceptado
Date: 2026-10-19

## Context

RF10 exige notificar las fallas instrumentales al área de Mantenimiento, y la skill de mantenimiento pide un ADR para el mecanismo. Hoy el aviso llega por WhatsApp y se pierde entre mensajes. El proyecto no tiene cola de trabajos, servidor de correo ni proveedor de WhatsApp configurados, y el hosting definitivo todavía no está elegido.

## Decision

En v1 el aviso es **dentro de la aplicación**:

- Al registrar una lectura con `tiene_falla = true`, la falla queda **abierta** en la misma transacción (y se audita `falla.reportada`).
- Mantenimiento la ve en el panel técnico (`/mantenimiento`), con la lista de fallas abiertas y un contador en el menú que se actualiza solo cada 60 segundos mientras la aplicación está abierta.
- Mantenimiento la cierra con "Marcar atendida" y una nota (D20, `falla.atendida`).

## Alternatives

- **Correo electrónico:** requiere servidor SMTP y cola; el personal de Mantenimiento no usa el correo en el campo.
- **WhatsApp Business API:** es el canal que realmente miran, pero exige proveedor, plantillas aprobadas y costo por mensaje. Queda como evolución.
- **Web Push (PWA):** funciona con la app cerrada, pero iOS lo soporta solo con la app instalada y exige claves VAPID y un servicio de envío. Queda como evolución.

## Consequences

- Si nadie de Mantenimiento abre la aplicación, la falla no "llega". El contador y el panel mitigan esto, pero no lo eliminan.
- Agregar correo, WhatsApp o Web Push más adelante es un adaptador nuevo que reacciona a `falla.reportada`; el dominio no cambia.
- Impacto en el TP: sección 6 (construcción) y DFD/diagrama de secuencia de la Figura 11, donde la notificación es un aviso en el sistema.
