# 07 — Facilidad de uso diario

Estado: **aprobado el 2026-10-22** con las opciones recomendadas (`docs/discrepancias.md` D21–D27).

## Problema y evidencia

| ID | Tipo | Hallazgo | Evidencia |
|---|---|---|---|
| H-07.1 | Uso | El inicio solo dice "Hola" y lista los roles. No orienta a la tarea del día. | [código] `frontend/src/app/AppLayout.tsx:72-79`. [observado] Recorrido del 2026-10-22. |
| H-07.2 | Uso | Los borradores pendientes no se ven en ningún lugar: solo aparecen al entrar al formulario correspondiente. | [código] `shared/borrador.ts` (no hay listado). |
| H-07.3 | Uso | El operario y el encargado no tienen "mis últimas cargas" de lecturas ni de controles. Producción sí lista las suyas. | [código] Hay endpoint `GET /maintenance/readings`, pero ninguna pantalla lo usa (`features/maintenance/api.ts` no lo consume). |
| H-07.4 | Uso | Se precarga poco: el frente solo si hay uno; la máquina nunca se precarga (ni la última usada ni la de `id_usuario` responsable). | [código] `ParteNuevoPage.tsx:72-82`; `ViajeNuevoPage.tsx` (camión vacío). |
| H-07.5 | Uso | La confirmación es un aviso que desaparece solo. Después de enviar no queda constancia en pantalla de qué se guardó: número, hora y datos. | [código] `toast.success` + `navigate` en los 4 formularios. |
| H-07.6 | Uso | Algunos mensajes no dicen cómo resolver el problema. Por ejemplo, "No se pudo enviar" no aclara si reintentar o corregir, y los errores 409 y de incertidumbre quedan para la spec 04. | [código] `ParteNuevoPage.tsx:121`. |

## Usuarios y tareas

Todos los roles. Prioridad: personal de campo (operario, encargado, camionero) y Administración, que hace el cotejo y las importaciones.

## RF, RNF y decisiones

RNF01 (usabilidad de campo) · skill `indufor-field-mobile-ux` · D11.

## Comportamiento esperado (propuesta G1 = a)

**Inicio orientado a tareas, según los permisos:**

| Rol (permiso) | Acciones principales | Pendientes que ve |
|---|---|---|
| Encargado / operario (`production.create`, `maintenance.reading.create`) | "Cargar parte", "Cargar lectura", "Control de matafuego" | Sus borradores; si la unidad asignada no tiene lectura desde el lunes; sus últimas 5 cargas |
| Camionero (`logistics.trip.create`) | "Declarar viaje" | Sus borradores; sus viajes pendientes o con corrección |
| Administración (`logistics.remito.create`, `integration.import-costs`) | "Cargar remito", "Importar consolidado" | Viajes sin remito; correcciones abiertas; lecturas sin exportar; período vencido sin consumos |
| Mantenimiento (`maintenance.failure.view`) | "Panel técnico" | Fallas abiertas; matafuegos vencidos |
| Gerencia (`dashboard.management`) | "Dashboard", "Reportes" | — (va directo al dashboard) |

**Además:**
- **Confirmación persistente:** después de enviar, la pantalla muestra "✓ Parte #123 guardado a las 10:42 — Papel Misionero · pulpable · 30,50 t", con "Cargar otro" y "Ver mis partes".
- **Precarga revisable:** se ofrece la última máquina y el último frente usados por el usuario, o la máquina de la que es responsable. Siempre se pueden cambiar.

## Alcance y exclusiones

- **Incluye:** inicio por rol, pendientes, últimas cargas, confirmación persistente, precarga y mensajes con la forma de resolver el problema.
- **Excluye:** colores, tipografía, menú desplegable en celular y formato de números. Esos van al rediseño posterior.

## Reglas e invariantes

- **I-07.1:** el inicio solo muestra lo que el usuario puede hacer según sus permisos. El backend sigue autorizando cada consulta.
- **I-07.2:** lo precargado nunca se envía sin que el usuario lo haya visto en el formulario.

## Criterios de aceptación

- **CA-07.1**
  - Dado: un operario con un borrador de lectura.
  - Cuando: entra al sistema.
  - Entonces: el inicio muestra "Tenés 1 borrador sin enviar: Lectura HV-01" con un enlace al formulario.
- **CA-07.2**
  - Dado: un camionero con un viaje en corrección solicitada.
  - Cuando: entra.
  - Entonces: lo ve en el inicio, con su estado y la diferencia detectada.
- **CA-07.3**
  - Dado: Administración con 2 viajes sin remito.
  - Cuando: entra.
  - Entonces: ve "2 viajes esperan remito", con el enlace a Viajes ya filtrado por PENDIENTE.
- **CA-07.4**
  - Dado: un encargado que el último parte lo cargó con HV-01.
  - Cuando: abre "Cargar parte".
  - Entonces: HV-01 viene elegida y la puede cambiar.
- **CA-07.5**
  - Dado: se envió un parte.
  - Entonces: la confirmación con número, hora y datos queda visible hasta que el usuario elige "Cargar otro" o sale.

## Decisiones pendientes

- **G1, contenido del inicio por rol:**
  - (a) la tabla de arriba (**recomendada**);
  - (b) solo accesos directos, sin pendientes. Es más simple, pero no cumple con "acceso a pendientes".
  - Consecuencia de (a): hace falta un endpoint liviano `GET /me/pendientes` que agregue conteos según los permisos. Reusa las consultas existentes.

---

## Plan (Fase 2)

- **Diseño mínimo:**
  - `GET /me/pendientes` en el backend: solo conteos, cada uno condicionado por su permiso;
  - inicio por rol en el frontend, usando `usePermiso`;
  - un listado de borradores, que agrega `listarBorradores(idUsuario)` a `shared/borrador.ts`;
  - un componente `ConfirmacionEnvio`;
  - precarga a partir del último registro del usuario: `GET /production?per_page=1`, y lo mismo para viajes y lecturas.
- **Dependencias:**
  - spec 04, por los estados y los borradores;
  - spec 08, por "mis lecturas".

| Tarea | Criterio | Prueba |
|---|---|---|
| T-07.1 `GET /me/pendientes` con permisos | CA-07.2, CA-07.3 | `PendientesTest` (RBAC por rol) |
| T-07.2 Inicio por rol y listado de borradores | CA-07.1 a CA-07.3 | Vitest por rol |
| T-07.3 Confirmación persistente en los 4 formularios | CA-07.5 | Vitest |
| T-07.4 Precarga revisable | CA-07.4 | Vitest |
| T-07.5 Mensajes con la forma de resolver | — | revisión de textos + `design:ux-copy` |

- **Riesgos y reversión:** cambios de interfaz; se revierte con el commit.
