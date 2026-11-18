# Auditorías de interfaz

Hallazgos de auditorías UI/UX con las skills `better-*`. Cada tarea nace PROPUESTA y pasa a SOLICITADA cuando el usuario autoriza corregirla.

## Tareas

### [HECHO] UIX-011 — Rediseñar la sidebar con shadcn y pestaña unida

- **Capa:** SOLICITADO
- **Fuente:** pedido del usuario del 2026-11-05 con imagen de referencia; eligió «pestaña unida»
- **Contexto propietario:** Interfaz (frontend compartido)
- **Dependencias:** ninguna
- **Alcance:** sidebar de shadcn (`inset`, `icon`) con degradado verde, ítems en píldora, activo unido a la vista y círculo al plegar; Sheet en el celular
- **Fuera de alcance:** estrellas, marco de vidrio y `backdrop-blur`; cambios de permisos o de enlaces
- **Invariantes:** tokens semánticos sin colores fijos; 44 px táctiles en campo; `<nav aria-label="Principal">`; permisos sin cambios; autorización en backend
- **Contratos y archivos previstos:** ui/sidebar.tsx, app/Sidebar.tsx, app/AppLayout.tsx, index.css, AppLayout.test.tsx, docs/forest-depth.md
- **Criterios de aceptación:** contraste AA medido con axe; sin desborde a 1570, 1280, 390 y 320 px; teclado y foco correctos; preferencia recordada; tests en verde
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-05
- **Última actualización:** 2026-11-05
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** Playwright 45/45, Vitest 136/136, tsc y lint sin advertencias nuevas. Navegador con Administración: sin exceso a 1570, 1280, 390 y 320 px; plegada 72 px; Ctrl+B; Escape devuelve el foco a Menú; enlace cierra el panel y el foco va al h1; enlaces de 44 px en el celular; sin animación con movimiento reducido; sidebar fuera de la transición entre vistas; un solo main. Contraste medido en píxeles de la captura (axe no evalúa degradados): blanco sobre píldora de 6,7:1 a 13,3:1. Sin probar: rol de campo en sesión real, lector de pantalla y dispositivos físicos. En claro, ConnectionBadge queda con poco contraste: se resuelve en UIX-014

### [HECHO] UIX-012 — Adoptar shadcn en formularios y pestañas (tanda 1)

- **Capa:** SOLICITADO
- **Fuente:** pedido del usuario del 2026-11-05 de dejar de escribir a mano lo que shadcn resuelve; eligió reemplazar por tandas
- **Contexto propietario:** Interfaz (frontend compartido)
- **Dependencias:** UIX-011
- **Alcance:** Tabs, Native Select, Textarea, Checkbox, Radio Group y Alert Dialog; quitar ui/select.tsx sin usos; regla de revisar el catálogo en la skill de frontend
- **Fuera de alcance:** Data Table, Date Picker, Pagination y Card (ver plan de la tarea)
- **Invariantes:** tokens semánticos sin colores fijos; 44 px táctiles en campo; `<nav aria-label="Principal">`; permisos sin cambios; autorización en backend; controles nativos en campo
- **Contratos y archivos previstos:** ui/*.tsx, ReportesPage.tsx, formularios con select, textarea, checkbox y radio, DescartarBorrador.tsx, AppLayout.tsx
- **Criterios de aceptación:** mismos nombres accesibles y comportamiento; tests en verde
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-05
- **Última actualización:** 2026-11-05
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** Vitest 136/136, Playwright 45/45 (incluye axe), tsc. Lint: 8 advertencias, 7 previas y la exportación de useSidebar. Navegador a 390 px con permisos de campo simulados en el frontend: radio de madera marca y sin exceso; confirmación de salida como alertdialog. A 1280 px: pestañas de Reportes con flechas. DescartarBorrador no tenía diálogo: sin cambios. Sin probar: rol de campo en sesión real, lector de pantalla y dispositivos físicos

### [HECHO] UIX-013 — Adoptar shadcn en combobox, campos y avisos (tanda 2)

- **Capa:** SOLICITADO
- **Fuente:** pedido del usuario del 2026-11-05, segunda tanda
- **Contexto propietario:** Interfaz (frontend compartido)
- **Dependencias:** UIX-012
- **Alcance:** Combobox dentro de FiltroAutocompletable, Field dentro de Campo, Alert, Spinner/Skeleton y StatusBadge sobre Badge
- **Fuera de alcance:** cambiar las props de los componentes propios
- **Invariantes:** tokens semánticos sin colores fijos; 44 px táctiles en campo; `<nav aria-label="Principal">`; permisos sin cambios; autorización en backend; filtro que ignora acentos; texto «Cargando…» conservado
- **Contratos y archivos previstos:** FiltroAutocompletable.tsx, Campo.tsx, StatusBadge.tsx, EsperarConsultas.tsx, ui/*.tsx
- **Criterios de aceptación:** mismos nombres accesibles; peso de `cmdk` medido; tests en verde
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-05
- **Última actualización:** 2026-11-05
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** Vitest 136/136, Playwright 45/45 (incluye axe), tsc, build. Lint: 8 advertencias, igual que UIX-012. Bundle JS con gzip: de 290,9 KB a 297,0 KB (+2 %) con cmdk. Navegador a 1280 px: combobox filtra sin tildes, elige con teclado, vuelve el foco y queda en la URL; axe sin violaciones con el panel abierto; aviso de error con consulta fallida. Se usó Popover + Command porque el Combobox del catálogo agrega @base-ui/react. Sin Skeleton: no tenía usos. Sin migrar a Alert: aviso de cierre de sesión, RequireAuth y UpdatePrompt, por su propio diseño. Sin probar: rol de campo en sesión real, lector de pantalla y dispositivos físicos

### [HECHO] UIX-014 — Activar el modo claro con botón y transición animada

- **Capa:** SOLICITADO
- **Fuente:** pedido del usuario del 2026-11-05 con la paleta «Forest Light Tactical», para hacer después de todos los componentes
- **Contexto propietario:** Interfaz (frontend compartido)
- **Dependencias:** UIX-013
- **Alcance:** paleta clara mapeada a los tokens existentes; botón de tema; transición circular con View Transitions; persistencia y aplicación antes de pintar
- **Fuera de alcance:** seguir la preferencia del sistema; oscuro sigue por defecto
- **Invariantes:** tokens semánticos sin colores fijos; 44 px táctiles en campo; `<nav aria-label="Principal">`; permisos sin cambios; autorización en backend; contraste AA en ambos temas; sin animación con movimiento reducido
- **Contratos y archivos previstos:** index.css, app/useTema.ts, Sidebar.tsx, index.html, fase7-accesibilidad.spec.ts, docs/design-tokens.md, docs/forest-depth.md, docs/decisiones/README.md
- **Criterios de aceptación:** axe sin violaciones graves en claro; recarga sin destello; cambio directo sin soporte de la API; tests en verde
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-05
- **Última actualización:** 2026-11-05
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** Vitest 140/140 en 12 corridas seguidas, Playwright 50/50 con axe en ambos temas, tsc, build y verify:pwa. Lint: 8 advertencias, igual que UIX-013. Navegador a 1280 px: botón con teclado, animación tema-circulo en curso a 220 ms, marca temporal quitada al terminar, foco conservado, tema aplicado antes de que aparezca el body al recargar, theme-color actualizado, vuelta a oscuro y transición de vista intacta. Revisadas en claro: Viajes, Lecturas, Dashboard y Login. También resuelve el test intermitente de ParteNuevoPage, cuya causa era una carrera con las opciones recreadas y no la lentitud. Diferencias con la paleta por contraste en docs/design-tokens.md. Sin probar: rol de campo en sesión real, lector de pantalla, dispositivos físicos y navegadores distintos de Chromium

### [HECHO] UIX-015 — Fondo Grainient y botones de la sidebar más glass

- **Capa:** SOLICITADO
- **Fuente:** pedido del usuario del 2026-11-05: botones menos notorios, quitar la foto y usar Grainient; eligió animado solo en PC
- **Contexto propietario:** Interfaz (frontend compartido)
- **Dependencias:** UIX-014
- **Alcance:** píldoras glass en la sidebar; quitar la foto del encabezado; fondo Grainient adaptado a ambos temas; fijo en el celular
- **Fuera de alcance:** pantalla de login y botones primarios
- **Invariantes:** contraste AA en ambos temas; pestaña unida sin costura; sin animación con movimiento reducido; funciona sin WebGL2; 44 px táctiles en campo
- **Contratos y archivos previstos:** ui/Grainient.tsx, app/FondoGrainient.tsx, AppLayout.tsx, Sidebar.tsx, PageHeader.tsx, index.css, docs/ui-react-bits.md, docs/forest-depth.md, docs/design-tokens.md, docs/decisiones/README.md, CLAUDE.md
- **Criterios de aceptación:** contraste medido sobre píxeles; el celular no dibuja de forma continua; cambio de tema con los colores correctos; tests en verde
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-05
- **Última actualización:** 2026-11-05
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** Playwright 50/50 con axe en ambos temas, Vitest 140/140, tsc, build, verify:pwa y 8 advertencias de lint, las mismas de antes. Navegador con GPU real: 28 cuadros por segundo en PC y ningún dibujo continuo en el celular ni con movimiento reducido. Sin WebGL2 y con contexto perdido queda el color de fondo. Contraste medido en píxeles de la captura (axe no evalúa canvas): mínimo 4,55:1. Cambio de tema con los colores correctos y pestaña unida sin costura a 1280 px. Sin probar: batería en un celular real, GPU de gama baja, navegadores que no sean Chromium

### [HECHO] UIX-016 — Bandeja de solicitudes de corrección más clara

- **Capa:** SOLICITADO
- **Fuente:** pedido del usuario del 2026-11-10: convertir /correcciones en una bandeja de trabajo clara, sin rediseño decorativo ni cambios de reglas
- **Contexto propietario:** Logística (frontend)
- **Dependencias:** UIX-015
- **Alcance:** estado vacío con enlace a viajes pendientes de remito; tarjetas con diferencia destacada, antigüedad, remito y responsable; acción principal según estado; reintentar ante error; diálogo con comparación por fila (difiere, coincide, modificado, valor anterior), validación en el cliente, errores del servidor por campo y resultado del recotejo dentro del diálogo; foco al cerrar
- **Fuera de alcance:** backend y reglas de negocio; búsqueda (la API no la tiene) y filtro por estado (la API lo admite, pero con un solo rol, orden por antigüedad y 50 por página no aporta; queda como posible mejora); umbrales de urgencia por antigüedad (no hay un SLA definido)
- **Invariantes:** el viaje solo se valida por el recotejo del backend (RF07); la comparación en pantalla es una vista previa; motivo obligatorio; solo viajan los campos cambiados; «Corregir» disponible en PENDIENTE y EN_REVISION como permite el backend; tokens semánticos; 44 px táctiles en el celular
- **Contratos y archivos previstos:** features/logistics/CorreccionesPage.tsx, features/logistics/cotejo.ts (+ test), Logistica.test.tsx, e2e/fase3.spec.ts
- **Criterios de aceptación:** axe sin violaciones en lista, diálogo y estado vacío en ambos temas; sin desborde a 390 px; foco al título del resultado y de vuelta al botón o al h1; tests en verde
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-10
- **Última actualización:** 2026-11-10
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** Vitest 148/148, tsc, build, 8 advertencias de lint (las mismas de antes). Playwright fase3 en verde con el flujo nuevo (resultado en el diálogo, foco y estado vacío). La suite completa no quedó en verde en esta máquina: dos corridas dieron 33/42 y 39/45, con fallos que cambian entre corridas y siempre en el login o en pantallas que quedan en «Cargando…» (fase1, fase2, fase5, fase6, fase7, sdd-*), ninguno en /correcciones; en fase7, Administración en tema claro pasó /correcciones y se cortó en /produccion. Probable causa: el Vite de desarrollo (5173) y el del E2E (5174) comparten node_modules/.vite. Queda por correr la suite con el servidor de desarrollo detenido. Revisión con Playwright contra el servidor de desarrollo y la API de correcciones simulada: axe sin violaciones en lista y diálogo (oscuro y claro a 1280 px, oscuro a 390 px) y en el estado vacío (oscuro a 1280, claro a 390); sin desborde horizontal; foco al título del resultado y al h1 al cerrar. Nota de entorno: en Windows, Vitest debe correr con la unidad en mayúscula (C:\); con «c:\» carga dos copias de vitest y fallan los matchers de jest-dom. Sin probar: lector de pantalla y dispositivos físicos

### [HECHO] UIX-022 — Recorrido mobile, auditoría y correcciones

- **Capa:** SOLICITADO
- **Fuente:** pedido del usuario del 2026-11-11: recorrer la app en el celular, documentar discrepancias y mejoras, corregir y pulir
- **Contexto propietario:** Interfaz (frontend compartido y pantallas de campo)
- **Dependencias:** UIX-021
- **Alcance:** recorrido reproducible a 360 px (`e2e/fase7-mobile.spec.ts`), hallazgos MOB-01 a MOB-16 en `docs/auditoria-mobile.md` y sus correcciones
- **Fuera de alcance:** reglas de negocio y backend; prueba en un dispositivo físico
- **Invariantes:** objetivos táctiles de 44 px o más en el celular; sin scroll horizontal; el teal no comunica estados; nunca informar un estado que no existe
- **Contratos y archivos previstos:** componentes compartidos de `shared/components/ui`, ReportesPage, InicioPage, ResumenQuincena, EstadoEnvio, formularios de campo, `index.css`
- **Criterios de aceptación:** `fase7-mobile` en verde (sin desbordes, táctiles ni texto chico); hallazgos corregidos o justificados en `docs/auditoria-mobile.md`; suite completa en verde
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-11
- **Última actualización:** 2026-11-13
- **Próximo paso:** ninguno. No se probó en un dispositivo físico (fuera de alcance)
- **Evidencia actual:** primer recorrido: 0 desbordes, 0 textos chicos, 107 objetivos táctiles chicos; 16 hallazgos documentados. Cierre del 2026-11-13: último ajuste de áreas táctiles (selector de archivo cubre su borde, filtro Máquina de Consumos y casilla de reemplazo a 44 px); Playwright completo 57/57 con fase7-mobile en verde; Vitest 179/179. Los 16 hallazgos quedan conciliados con el código en `docs/auditoria-mobile.md` (15 hechos, MOB-16 descartado como artefacto de captura tras verificarlo con GPU real)

### [EN_CURSO] UIX-021 — Dashboard de Inicio con el estilo de Medesk

- **Capa:** SOLICITADO
- **Fuente:** pedido del usuario del 2026-11-11: adaptar la plantilla Medesk Dashboard de ui.watermelon.sh; eligió Recharts y la versión completa (con backend)
- **Contexto propietario:** Reportes (RF14–RF16) e Interfaz
- **Dependencias:** UIX-018
- **Alcance:** `/dashboard` suma el mismo tramo de la quincena anterior; Inicio de los roles con `dashboard.management` queda compacto (pedido del usuario: estaba sobrecargado): 4 KPI con comparación y minigráfico, producción por semana y carga por frente, y después pendientes y acciones. Sin tarjetas de pendientes, actividad, viajes abiertos, operarios, flota ni tabla por frente (sigue en Reportes): cada dato aparece una sola vez
- **Fuera de alcance:** copiar código de la plantilla (se reimplementa con tokens propios), filtros de rango en Inicio
- **Invariantes:** toneladas y m³ nunca se suman; la comparación es neutra (no es bueno ni malo); el teal no comunica estados; gráficos con leyenda y vista en tabla; paleta de gráficos validada para daltonismo
- **Contratos y archivos previstos:** Reporting/Domain/Periodos.php, ReportesController.php, features/inicio/InicioPage.tsx, features/reports/ResumenQuincena.tsx, resumen.ts, api.ts, index.css, recharts
- **Criterios de aceptación:** Pest, Vitest y Playwright en verde; revisión visual en ambos temas
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-11
- **Última actualización:** 2026-11-11
- **Próximo paso:** revisión en celular y commit cuando el usuario lo pida
- **Evidencia actual:** versión compacta: Pest 191/191 (tramo anterior), Vitest 154/154, tsc y oxlint sin errores, Playwright 50/50 con axe sin violaciones graves en ambos temas (se corrigió `aria-hidden-focus`: Recharts 3 vuelve enfocable el SVG; `accessibilityLayer={false}` en los gráficos ocultos). Revisado en el navegador en escritorio

### [EN_CURSO] UIX-018 — Unificar Inicio y Dashboard

- **Capa:** SOLICITADO
- **Fuente:** recomendación del profesor de Seminario, transmitida por el usuario el 2026-11-11; opciones elegidas por el usuario el mismo día
- **Contexto propietario:** Interfaz (inicio y reportes)
- **Dependencias:** ninguna
- **Alcance:** para quien tiene `dashboard.management`, Inicio suma el resumen de la quincena (producción por madera, viajes validados, gastos de combustible y tabla por frente) sin repetir las tarjetas de pendientes; se quita Dashboard del menú y /dashboard redirige a /
- **Fuera de alcance:** endpoint /dashboard, inicio de los demás roles
- **Invariantes:** RF16 sigue demostrable; los datos salen del backend; la alerta no se comunica solo con color
- **Contratos y archivos previstos:** features/inicio/InicioPage.tsx, features/reports/DashboardPage.tsx, main.tsx, app/AppLayout.tsx, e2e/fase6 y fase7
- **Criterios de aceptación:** Gerencia ve en Inicio la producción de la quincena por madera y la tabla por frente; e2e en verde
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-11
- **Última actualización:** 2026-11-11
- **Próximo paso:** revisión visual en el navegador y commit cuando el usuario lo pida
- **Evidencia actual:** Pest 189/189 (casos D32 permitidos y denegados), Vitest 149/149, tsc y oxlint sin errores, Playwright 50/50 (fase5 por la pestaña de Reportes, fase6 con el resumen en Inicio, fase7 con axe)

### [EN_CURSO] UIX-019 — Integración como parte de Reportes

- **Capa:** SOLICITADO
- **Fuente:** recomendación del profesor de Seminario, transmitida por el usuario el 2026-11-11; opciones elegidas por el usuario el mismo día
- **Contexto propietario:** Interfaz (integración y reportes)
- **Dependencias:** ninguna
- **Alcance:** la importación del consolidado y el historial de lotes dejan de ser un ítem del menú y pasan a una pestaña de Reportes; /integracion redirige ahí
- **Fuera de alcance:** endpoints de integración, reglas de RF12 y RF13
- **Invariantes:** RF12 y RF13 siguen demostrables; el backend vuelve a autorizar
- **Contratos y archivos previstos:** features/reports/ReportesPage.tsx, features/integration/IntegracionPage.tsx, inicio/reglas.ts, main.tsx, app/AppLayout.tsx, e2e/fase5 y fase7
- **Criterios de aceptación:** Administración importa el consolidado desde Reportes; e2e de fase 5 en verde
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-11
- **Última actualización:** 2026-11-11
- **Próximo paso:** revisión visual en el navegador y commit cuando el usuario lo pida
- **Evidencia actual:** Pest 189/189 (casos D32 permitidos y denegados), Vitest 149/149, tsc y oxlint sin errores, Playwright 50/50 (fase5 por la pestaña de Reportes, fase6 con el resumen en Inicio, fase7 con axe)

### [EN_CURSO] UIX-020 — Administración carga la operación

- **Capa:** SOLICITADO
- **Fuente:** recomendación del profesor de Seminario, transmitida por el usuario el 2026-11-11; opciones elegidas por el usuario el mismo día
- **Contexto propietario:** Identidad y acceso, Producción, Logística, Mantenimiento
- **Dependencias:** ninguna
- **Alcance:** Administración recibe `production.create`, `maintenance.reading.create`, `maintenance.extinguisher.create` y `logistics.trip.create`; carga en nombre de un frente, operario o camionero, sin la restricción por asignación (D28) para sí misma
- **Fuera de alcance:** edición de partes ajenos, nuevos roles, cambios de esquema
- **Invariantes:** el operario de un parte individual y el camionero de un viaje siguen siendo usuarios con ese rol; la auditoría registra a Administración como actora; RNF05 y RF07 sin cambios
- **Contratos y archivos previstos:** Domain/MatrizRbac.php, ParteProduccion.php, GestionProduccion.php, GestionMantenimiento.php, controllers de las tres cargas, formularios de parte y viaje, docs/rbac.md, docs/discrepancias.md (D32), tests
- **Criterios de aceptación:** tests de backend con casos permitidos y denegados; Administración carga un parte, una lectura, un matafuego y un viaje desde la UI
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-11
- **Última actualización:** 2026-11-11
- **Próximo paso:** revisión visual en el navegador y commit cuando el usuario lo pida
- **Evidencia actual:** Pest 189/189 (casos D32 permitidos y denegados), Vitest 149/149, tsc y oxlint sin errores, Playwright 50/50 (fase5 por la pestaña de Reportes, fase6 con el resumen en Inicio, fase7 con axe)

### [HECHO] UIX-017 — Paleta teal y tokens semánticos

- **Capa:** SOLICITADO
- **Fuente:** pedido del usuario del 2026-11-11: adoptar la paleta Primary `#0B3D3B`, Accent `#14B8A6`, Secondary `#99F6E4`, Surface `#E6FFFB`, Background `#F8FFFE`; validar y derivar tokens semánticos para ambos temas. Eligió oscuro por defecto y botón principal `#0B3D3B` en claro; pidió que alertas y errores usen rojo y amarillo, no teal
- **Contexto propietario:** Interfaz (frontend compartido)
- **Dependencias:** UIX-015
- **Alcance:** valores de tokens en index.css (ambos temas, sidebar, tintes), colores del Grainient, theme-color de la PWA y del navegador, test de contraste, docs/design-tokens.md
- **Fuera de alcance:** estructura de tokens, componentes, tipografía, login
- **Invariantes:** contraste AA en ambos temas; el teal nunca comunica un estado; error rojo, alerta ámbar, éxito verde, info azul; tokens semánticos
- **Contratos y archivos previstos:** frontend/src/index.css, app/FondoGrainient.tsx, app/useTema.ts, index.html, vite.config.ts, forestDepthTokens.test.ts, docs/design-tokens.md, CLAUDE.md (origen de ui-ux-pro-max)
- **Criterios de aceptación:** tests de contraste en verde (incluye hover y botón destructivo); axe sin violaciones graves en ambos temas; contraste del tenue sobre el Grainient re-medido
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-11
- **Última actualización:** 2026-11-13
- **Próximo paso:** ninguno. La paleta teal fue reemplazada por UIX-034 (arena, verde y petróleo); la revisión visual de ambos temas y la medición sobre el Grainient animado quedaron acreditadas allí el 2026-11-13
- **Evidencia actual:** Vitest 148/148 y 16/16 de contraste, tsc, build. Playwright 49/50 con axe sin violaciones graves en ambos temas; el fallo fue fase5 (importación de consolidado, sin relación con color) y pasó 4/4 al repetirla sola. Contraste calculado del texto contra los colores extremos del Grainient: mínimo 4,87:1 (tenue en claro)

### [PARCIAL] UIX-010 — Hacer evidentes las acciones del panel de Mantenimiento

- **Capa:** SOLICITADO
- **Fuente:** pedido del usuario del 2026-11-04: las acciones de la pestaña no invitan a interactuar al pasar el mouse
- **Contexto propietario:** Mantenimiento (interfaz)
- **Dependencias:** ninguna
- **Alcance:** reforzar indicaciones de acción y estados de interacción de los resúmenes y enlaces al historial del panel
- **Fuera de alcance:** nuevas funciones, cambios de API, permisos o reglas de negocio
- **Invariantes:** acciones reales existentes; foco visible y uso táctil; respetar movimiento reducido y tokens semánticos
- **Contratos y archivos previstos:** `frontend/src/features/maintenance/PanelPage.tsx`, estilos existentes y pruebas del panel
- **Criterios de aceptación:** las acciones indican su destino, responden visiblemente a hover y foco y conservan su comportamiento y permisos; pruebas pertinentes en verde
- **Responsable:** Codex
- **Fecha de inicio:** 2026-11-04
- **Última actualización:** 2026-11-04
- **Próximo paso:** comprobar visualmente hover y foco en ambos temas y teclado cuando esté disponible el navegador.
- **Evidencia actual:** se agregaron textos de acción a los resúmenes y al enlace de historial; hover y foco del resumen reemplazan el fondo con degradados por el color interactivo y resaltan el borde. Pruebas del panel 5/5, typecheck y build correctos; `git diff --check` y validación del plan sin errores. El navegador devolvió `The browser access host is unavailable`: hover, foco visual y ambos temas no se comprobaron en una sesión real.

### [PARCIAL] UIX-009 — Renovar el panel operativo de Mantenimiento

- **Capa:** SOLICITADO
- **Fuente:** plan aprobado por el usuario el 2026-11-04 y captura de `/mantenimiento` aportada en la conversación
- **Contexto propietario:** Mantenimiento (interfaz de consulta y atención de fallas)
- **Dependencias:** ninguna
- **Alcance:** resumen accionable, fallas abiertas, filtros combinables y estado de unidades con navegación y acciones existentes
- **Fuera de alcance:** órdenes de trabajo, planificación de reparaciones, nuevos permisos y cambios de contratos de backend
- **Invariantes:** reglas vigentes de lecturas, controles y permisos; autorización en backend; advertir posible truncamiento de 200 unidades; conservar cambios locales existentes
- **Contratos y archivos previstos:** `frontend/src/features/maintenance/PanelPage.tsx`, pruebas del panel y [seguimiento ODD](../../odd/tasks/panel-mantenimiento.md)
- **Criterios de aceptación:** contadores reales y accionables; búsqueda y filtros combinados; detalles y acciones autorizadas; estados de carga, error y vacío; comprobaciones de interfaz, permisos, escritorio, móvil y teclado
- **Responsable:** Codex
- **Fecha de inicio:** 2026-11-04
- **Última actualización:** 2026-11-04
- **Próximo paso:** verificar visualmente y con interacción real escritorio, móvil, ambos temas y teclado; revisar los roles con sesiones reales y cerrar solo cuando los criterios estén acreditados.
- **Evidencia actual:** captura original aportada por el usuario; implementados resumen accionable con conteos, filtros de unidad/frente/situación, aviso del límite de 200, bloques de fallas y flota, reintentos y acciones sujetas a permisos. Vitest 136/136, incluidas 5 pruebas del panel con datos simulados; pruebas afectan conteos, filtros, vacío/error, permisos, atención, navegación y estados de matafuego. Typecheck y build correctos; lint sin errores, con 7 advertencias previas; detector Impeccable sin hallazgos; `git diff --check` sin errores. Build anterior al ajuste final de foco; la suite posterior comprueba el foco. Revisión visual y táctil no realizada: `The browser access host is unavailable`; sin pruebas en dispositivo físico ni sesiones reales de los roles. No se modificaron API ni reglas de negocio.

### [PARCIAL] UIX-008 — Incorporar autocompletado a los filtros del sistema

- **Capa:** SOLICITADO
- **Fuente:** pedido del usuario del 2026-11-04: «todos los filtros que haya por el sistema, sean de autocompletado»; confirmación posterior: mantener fechas y texto libre, autocompletar opciones seleccionables y aplicar antislop durante el trabajo; registrar los pedidos como tareas en el plan maestro a partir de ahora
- **Contexto propietario:** interfaz transversal de la SPA y contextos de negocio que exponen filtros
- **Dependencias:** ninguna
- **Alcance:** relevar todos los filtros disponibles en el sistema y adaptar su interacción para ofrecer autocompletado, conservando su efecto y sus combinaciones; incluir las pantallas y roles alcanzados por el relevamiento
- **Fuera de alcance:** cambios de reglas de negocio o permisos ajenos al funcionamiento de los filtros
- **Invariantes:** autorización y alcance de datos decididos por el backend; conservar los parámetros compartibles en URL y la navegación existente donde correspondan; mantener accesibilidad, uso táctil y funcionamiento de filtros combinados y limpieza
- **Contratos y archivos previstos:** inventario pendiente; revisar `frontend/src/shared/components/FilterPanel.tsx`, `frontend/src/shared/hooks/useFiltrosUrl.ts`, pantallas con filtros y contratos de consulta relacionados
- **Criterios de aceptación:** inventario completo por pantalla, rol y tipo de filtro; autocompletado funcional con opciones pertinentes en los filtros relevados según el comportamiento acordado para cada tipo; selección, modificación y limpieza correctas; estados sin resultados, carga y error cuando correspondan; teclado y móvil utilizables; filtros combinados, URL y permisos conservados; pruebas pertinentes de interfaz e integración aprobadas
- **Responsable:** Codex
- **Fecha de inicio:** 2026-11-04
- **Última actualización:** 2026-11-04
- **Próximo paso:** verificar en navegador las siete áreas, escritorio y móvil, teclado y permisos por rol; comprobar navegación atrás/adelante y carga/error de catálogos en las pantallas reales, y cerrar solo con los criterios acreditados.
- **Evidencia actual:** relevamiento estático e implementación de 19 filtros seleccionables en Producción, Viajes, Lecturas, Usuarios, Maquinaria, Frentes y Reportes; fechas y búsquedas libres conservadas según confirmación del usuario. Componente compartido con búsqueda insensible a tildes, selección por teclado, restauración al cancelar y estados de carga/error. Vitest: suite completa 130/130 antes del último ajuste de estados; luego 23/23 pruebas afectadas y 3/3 del componente tras el ajuste de desplazamiento. `npm run typecheck`, `npm run build`, `npm run lint` y `git diff --check` en verde; lint conserva 7 advertencias previas y build advierte tamaño de bundle. No verificado: interacción visual/táctil en navegador o dispositivo, lector de pantalla real, roles reales ni E2E contra backend. Los selectores de formularios de carga no son filtros de listados.

### [HECHO] UIX-001 — Corregir hallazgos de la auditoría de /viajes

- **Capa:** SOLICITADO
- **Fuente:** corrección autorizada por el usuario el 2026-11-04; auditoría `better-interface` del 2026-11-04 sobre /viajes (ViajesPage.tsx, RemitoDialog.tsx), sesión con Administración
- **Contexto propietario:** Logística (interfaz)
- **Dependencias:** REQ-005, REQ-006
- **Alcance:** 9 hallazgos MEDIUM y LOW: foco que no vuelve al cerrar el diálogo de remito, título de página genérico, borde de controles a 2,89:1, etiquetas y formato de fecha inconsistentes, capitalización perdida en el celular, botón de 32 px, etiquetas y anuncios de la tabla. Fuera de los dominios de UI: el filtro Camión lista máquinas que no son camiones y la búsqueda por remito consulta en cada tecla
- **Fuera de alcance:** rediseño visual (EXC-001); cambiar reglas de cotejo (RF07)
- **Invariantes:** tokens semánticos de docs/design-tokens.md; autorización en backend; un viaje solo se valida por cotejo exacto
- **Contratos y archivos previstos:** frontend/src/features/logistics/ViajesPage.tsx, RemitoDialog.tsx; tokens de borde en frontend/src/index.css; título por ruta en el shell
- **Criterios de aceptación:** cada hallazgo corregido o descartado con motivo; borde de controles ≥ 3:1 medido; foco vuelve al disparador; tests Vitest del filtro de camiones y de la búsqueda diferida en verde
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-04
- **Última actualización:** 2026-11-04
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** Corregidos los 10 hallazgos y los 2 funcionales. Remedido en el navegador: borde de controles 3,43:1 (token `--color-border-strong` oscuro `#4E6658` → `#587262`), foco vuelve a «Cargar remito», título «Viajes — INDUFOR», 1 consulta por búsqueda, botón de 44 px en el celular, filtro Camión solo con CM-01 (D31: `GET /api/v1/logistics/trucks`). Tests: Pest 186/186, Vitest 96/96, tsc y oxlint sin advertencias nuevas. No verificado: vista del camionero, lector de pantalla real, zoom al 200 %, E2E Playwright.

### [HECHO] UIX-002 — Transición suave entre vistas

- **Capa:** SOLICITADO
- **Fuente:** pedido del usuario el 2026-11-04 («el cambio entre vistas es cortado»); skill `vercel-react-view-transitions`
- **Contexto propietario:** interfaz (shell de la SPA)
- **Dependencias:** ninguna
- **Alcance:** fundido del área de contenido al navegar con el menú, los enlaces internos y el ingreso
- **Fuera de alcance:** deslizamientos direccionales (la navegación del menú es lateral); `<ViewTransition>` de React, que exige React 19.3 (el proyecto usa 19.2)
- **Invariantes:** respetar prefers-reduced-motion; el menú no se congela ni bloquea clics; sin dependencias nuevas
- **Contratos y archivos previstos:** prop `viewTransition` de React Router en 16 enlaces y en el `navigate()` del login; `.vista` en el `<main>` de AppLayout; reglas `::view-transition-*` en frontend/src/index.css
- **Criterios de aceptación:** al navegar, el contenido saliente se funde en 150 ms y el entrante usa la animación escalonada vigente; el menú queda vivo; sin soporte para View Transitions la navegación sigue funcionando
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-04
- **Última actualización:** 2026-11-04
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** Comprobación histórica en Chrome: un clic en el menú llama a startViewTransition una vez, con old(vista) a 150 ms y la entrada anterior a 210 ms más 150 ms de demora; captura sin cambios visuales en el encabezado. Vitest 96/96, tsc sin errores, oxlint sin advertencias nuevas. La entrada fue reemplazada por el escalonado registrado en UIX-003. Corrección 2026-11-04: el invariante «el menú no bloquea clics» no se cumple; en Chrome con sesión real el menú no recibe clics durante unos 335 ms de la transición (ver UIX-006). No verificado: movimiento reducido activado en el sistema operativo, Safari y Firefox, celulares de gama baja. Atrás y Adelante del navegador no animan (limitación de React Router)

### [HECHO] UIX-003 — Sincronizar la entrada escalonada con el contenido inicial

- **Capa:** SOLICITADO
- **Fuente:** plan aprobado por el usuario el 2026-11-04 para corregir la animación de vistas con carga demorada
- **Contexto propietario:** interfaz (shell de la SPA y formularios de campo)
- **Dependencias:** UIX-002
- **Alcance:** iniciar una sola vez la entrada de los bloques presentes al mostrarse el contenido inicial, sin depender del tiempo de carga ni cortar la animación; permitir que un error inicial recuperable preceda al contenido
- **Fuera de alcance:** rediseño visual, cambios en reglas de negocio y cambios en datos o contratos de la API
- **Invariantes:** contenido visible si no corre la animación; respetar movimiento reducido; evitar repetir la entrada por bloques añadidos después; conservar duración y escalonado existentes
- **Contratos y archivos previstos:** frontend/src/app/useEntradaVista.ts, AppLayout.tsx y frontend/src/index.css; pruebas en useEntradaVista.test.tsx
- **Criterios de aceptación:** contenido inicial animado con cargas inmediatas o demoradas; animación completada sin corte; bloques agregados posteriormente sin nueva entrada; preparación renovada al navegar; movimiento reducido sin animación
- **Responsable:** Codex
- **Fecha de inicio:** 2026-11-04
- **Última actualización:** 2026-11-04
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** Vitest de entrada: 6 pruebas, con esperas simuladas de 0, 300, 600 y 850 ms, inserción posterior, navegación y recuperación de error. Suite frontend previa al último caso: 101/101; test específico posterior: 6/6. Chromium en viewport de 390 × 844 con API simulada y respuesta de maquinaria demorada 850 ms: formulario de lectura animado, bloques visibles al terminar y sin animaciones activas; con `reducedMotion: reduce`, animación desactivada y bloques visibles. `npm run typecheck`, `npm run build`, `npm run lint` y `git diff --check` completados; lint informó advertencias en otros archivos y build avisó por tamaño de chunk. No se verificaron un refetch real en navegador, otros navegadores ni un dispositivo físico.

### [HECHO] UIX-004 — Evolucionar la paleta y tipografía Forest Depth

- **Capa:** SOLICITADO
- **Fuente:** plan aprobado por el usuario el 2026-11-04; propuestas `DESIGN (5).md` y `design.md_forest_depth_tactical_indufor.md`, con la guía en español como base y ámbar reservado para atención
- **Contexto propietario:** interfaz transversal de la SPA, login y formularios de campo
- **Dependencias:** UIX-003
- **Alcance:** tokens semánticos en ambos temas; Space Grotesk, Plus Jakarta Sans y JetBrains Mono locales; aplicación en vistas, documentación y retiro de propuestas una vez consolidadas
- **Fuera de alcance:** funciones nuevas de telemetría, mapas o navegación; cambios de API, datos, permisos o reglas de negocio; la exclusión EXC-001 continúa describiendo el alcance histórico del SDD
- **Invariantes:** acciones principales verdes, ámbar para atención, estados con texto o icono, accesibilidad de contraste y foco, tamaño táctil y movimiento reducido; conservar funcionamiento sin conexión y cambios locales existentes
- **Contratos y archivos previstos:** frontend/src/index.css, componentes y vistas de la SPA, configuración PWA, docs/design-tokens.md y docs/forest-depth.md
- **Criterios de aceptación:** aplicación coherente en ambos temas y login; fuentes locales con licencias y precache; contrastes verificados; pruebas y build; revisión representativa en escritorio y móvil, teclado, movimiento reducido y desconexión; fuentes consolidadas antes de borrar los documentos de propuesta
- **Responsable:** Codex
- **Fecha de inicio:** 2026-11-04
- **Última actualización:** 2026-11-04
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** paleta y roles tipográficos consolidados en `docs/design-tokens.md` y `docs/forest-depth.md`; propuestas `DESIGN (5).md` y `design.md_forest_depth_tactical_indufor.md` incorporadas selectivamente y retiradas por pedido del usuario. Fuentes variables locales con licencias OFL-1.1 y precache. Vitest 118/118, pruebas de contraste de pares base de ambos temas, build y `verify:pwa` en verde; lint sin errores, con advertencias existentes. Chromium con API simulada: login, Producción, Viajes y lectura en 1440 × 900 y 390 × 844; tema claro revisado por separado; axe sin infracciones WCAG automáticas en login, Producción y lectura en ambos temas; foco y validación de login con teclado, estado de carga y envío deshabilitado sin conexión. En build de producción, las tres fuentes respondieron desde el service worker sin conexión. No se verificaron otros navegadores, dispositivo físico ni el flujo E2E completo contra el backend. `npm audit` informó 9 vulnerabilidades en el árbol de dependencias (1 alta, 5 moderadas y 3 bajas), ajenas a las tres fuentes y pendientes de revisión separada. Las decisiones históricas del SDD se conservan.

### [HECHO] UIX-005 — Quitar el desborde de la tabla de /viajes en escritorio

- **Capa:** SOLICITADO
- **Fuente:** pedido del usuario el 2026-11-04 al detectar que «Cargar remito» quedaba cortado después de UIX-004
- **Contexto propietario:** Logística (interfaz)
- **Dependencias:** UIX-004
- **Alcance:** que la tabla de /viajes entre sin scroll horizontal a 1570 y 1280 px
- **Fuera de alcance:** anchos de 640 a ~1267 px y 320 px, registrados en UIX-006; cambiar fuentes, paleta o tokens
- **Invariantes:** correcciones de UIX-001: botón de 44 px en el celular, data-label y cifras tabulares
- **Contratos y archivos previstos:** frontend/src/features/logistics/ViajesPage.tsx y Logistica.test.tsx
- **Criterios de aceptación:** exceso 0 a 1570 y 1280 px con «Acciones» y «Cargar remito» visibles; tests en verde
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-04
- **Última actualización:** 2026-11-04
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** medido en iframes con sesión real, 2 filas: antes +39 a 1570 y +151 a 1280; después 0 en ambos. Causa: columnas sin poder achicarse más 65 px de JetBrains Mono. Vitest 118/118, tsc sin errores y 7 advertencias de lint preexistentes. Con barra de scroll vertical y API simulada, ui-reviewer midió +2 a 1280. No verificado: datos reales con nombres largos, Playwright

### [HECHO] UIX-006 — Corregir hallazgos de la auditoría de animación y tipografía

- **Capa:** SOLICITADO
- **Fuente:** corrección autorizada por el usuario el 2026-11-04; auditoría de ui-reviewer del 2026-11-04 con método better-interface, veredicto Block, sobre las 12 vistas, las pantallas de campo y el historial de unidad
- **Contexto propietario:** interfaz transversal de la SPA
- **Dependencias:** UIX-004, UIX-005
- **Alcance:** HIGH: (1) input de archivo sin ancho que recorta contenido inalcanzable en ParteNuevoPage e IntegracionPage; (2) tabla apilada atada a 639 px, con acciones fuera de vista en Viajes y Producción entre 640 y ~1267 px; (3) StatusBadge sin corte, desborda 30 a 45 px a 320 px; (4) tablas sin apilar en Usuarios, Frentes, Maquinaria, Mantenimiento, Lecturas, Integración, Reportes y Dashboard. MEDIUM: (5) el menú no recibe clics durante la transición; (6) escalonado repetido en cada navegación del menú; (7) foco y scroll sin reiniciar al cambiar de ruta; (8) `.tabular-nums` aplica la mono a palabras; (9) contraste sobre la foto en tema claro, hoy inaccesible. LOW: (10) textos de 14 px en campo; (11) «En línea» parte en dos líneas a 320 px
- **Fuera de alcance:** hallazgo 6, que el usuario decidió dejar como está (se conserva el escalonado de UIX-003); funciones nuevas; reglas de negocio, API o datos
- **Invariantes:** contenido visible si la animación no corre; movimiento reducido; tokens semánticos; autorización en backend
- **Contratos y archivos previstos:** ver las ubicaciones del reporte: frontend/src/index.css, AppLayout.tsx, useEntradaVista.ts, StatusBadge.tsx, ParteNuevoPage.tsx, IntegracionPage.tsx y tablas de cada vista
- **Criterios de aceptación:** los 4 HIGH corregidos y medidos; hallazgos 5 y 7 a 11 corregidos; tests en verde. La nueva auditoría previa al cierre se canceló por pedido del usuario
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-04
- **Última actualización:** 2026-11-04
- **Próximo paso:** ninguno; tarea cerrada por decisión del usuario sin la segunda auditoría
- **Evidencia actual:** Vitest 126/126, tsc sin errores, 7 advertencias de lint preexistentes, Playwright 45/45 (la prueba de axe ahora espera el fin de las animaciones: medir durante la entrada daba 3,25:1 falso en /dashboard). Según el reporte de react-engineer, sin revisión independiente: exceso 0 en Viajes, Producción y tablas de la lista en los anchos medidos; bloqueo del menú reducido de ~300 ms a 10-58 ms (el hallazgo 5 queda parcial). Hallazgo 6 sin cambios por decisión del usuario. No verificado: regresiones de foco y tablas en una segunda auditoría, roles reales de campo, lector de pantalla, dispositivos. Pendiente sin tarea: corte de 62rem que apila tablas a 1280 con el menú desplegado; matafuegos en HistorialUnidadPage a 320 px; un texto de 14 px en Parte; tablas en diálogos; foco tras el login

### [HECHO] UIX-007 — Rediseñar /lecturas como registro con filtros

- **Capa:** SOLICITADO
- **Fuente:** pedido del usuario el 2026-11-04, con la dirección «registro con filtros» elegida entre tres opciones; alcance puntual de esta pantalla, EXC-001 sigue vigente para el resto
- **Contexto propietario:** Mantenimiento (interfaz y consulta)
- **Dependencias:** UIX-006
- **Alcance:** filtros por fechas, unidad, frente de la unidad y estado de falla en la URL; frente y enlace al historial en cada fila; estado con etiqueta y detalle compacto; lista vacía según los filtros
- **Fuera de alcance:** indicadores de resumen; tarjetas por unidad; cambios en la carga de lecturas o en sus reglas
- **Invariantes:** el backend decide el alcance visible (D20, D28); el frente es el actual de la unidad porque no hay historial de ubicación (D12); estados con texto e ícono
- **Contratos y archivos previstos:** `GET /api/v1/maintenance/readings` con `frente` y `falla`; MisLecturasPage.tsx, TablaLecturas.tsx y api.ts de maintenance; docs/trazabilidad.md
- **Criterios de aceptación:** filtros que llegan al backend y combinan; enlace al historial solo con `maintenance.failure.view`; sin desborde a 1280, 390 y 320 px; tests en verde
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-04
- **Última actualización:** 2026-11-04
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** Chrome con sesión de Administración: filtro «Falla atendida» devuelve la lectura de SK-BP1 y queda en la URL; tabla sin exceso a 1570, 1280, 390 y 320 px en iframes. Tests nuevos en `MantenimientoTest` «UIX-007» y `MisLecturasPage.test.tsx`; Pest 187/187, Vitest 128/128 (8 corridas seguidas; el envío de ParteNuevoPage.test ahora espera hasta 5 s porque fallaba de forma intermitente con 1 s), tsc sin errores, 7 advertencias de lint preexistentes, Playwright 45/45 con la máquina sin otra carga (una corrida simultánea con Vitest repetido dio 9 fallos por lentitud probable). No verificado: roles de campo con sesión real, lector de pantalla, dispositivos

### [HECHO] UIX-023 — Inicio ordenado por urgencia

- **Capa:** SOLICITADO
- **Fuente:** revisión del usuario del 2026-11-12: Inicio debe responder primero si hay algo urgente, después qué hacer y al final cómo viene la operación
- **Contexto propietario:** Interfaz (Inicio y Panel técnico)
- **Dependencias:** ninguna
- **Alcance:** resumen de la quincena después de pendientes y accesos; contador «N tipos de alerta»; «Accesos rápidos» ordenados por uso en el equipo; estado vacío «No hay alertas en las categorías consultadas»; fallas y matafuegos llevan a la sección o a la flota filtrada del Panel (`situacion` en la URL)
- **Fuera de alcance:** personalizar accesos (fijar u ocultar); enlace a una falla individual
- **Invariantes:** la autorización la hace el backend; nunca informar un estado que no existe; los datos viejos siguen marcados con su hora
- **Contratos y archivos previstos:** features/inicio/InicioPage.tsx, features/inicio/reglas.ts, features/maintenance/PanelPage.tsx y sus tests
- **Criterios de aceptación:** con tablero, las alertas preceden al resumen; las alertas de fallas y matafuegos abren el Panel en su sección o filtro; tests en verde
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-12
- **Última actualización:** 2026-11-12
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** Vitest 156/156 (corrido desde `C:\`), tsc sin errores. Tests nuevos: orden alertas → resumen con tablero (InicioPage), rutas de fallas y matafuegos (reglas), Panel abierto filtrado y enfocado desde `?situacion=matafuegos#estado-flota`. Sin probar: recorrido manual en el navegador, Playwright, lector de pantalla

### [HECHO] UIX-024 — Inicio: gravedad visible en el celular, accesos más cerca y alertas sin recorte

- **Capa:** SOLICITADO
- **Fuente:** revisión del usuario del 2026-11-12 del Centro de operaciones (Administración, oscuro, 1440 × 900 y 390 × 844); prioridades elegidas: gravedad en móvil, accesos más cerca, sin recorte en escritorio
- **Contexto propietario:** Interfaz (Inicio)
- **Dependencias:** UIX-023
- **Alcance:** etiqueta de gravedad visible en el celular; en una columna (menos de lg) se muestran las tres primeras alertas, con «Ver N alertas más», y lo crítico siempre queda visible porque va primero; título y detalle de cada alerta hasta dos líneas en escritorio; en el celular (menos de sm) se ocultan las tarjetas de resumen de «Mi jornada» y del inicio sin tablero, porque repiten las alertas (revisión con las cuentas demo del 2026-11-12); se quita el minigráfico diario de «Producción de la quincena» (casi vacío, sin ejes, y la tendencia ya está en «Producción por semana»)
- **Fuera de alcance:** tamaño y contraste de los textos secundarios del resumen y del gráfico; tarjetas del resumen en dos columnas («Sin importar» partido); indicador de más contenido en el menú móvil
- **Invariantes:** la gravedad no depende solo del color; 44 px táctiles; el nombre accesible incluye la gravedad una sola vez
- **Contratos y archivos previstos:** features/inicio/InicioPage.tsx y su test
- **Criterios de aceptación:** en el celular cada alerta muestra «Crítico», «Atención» o «Seguimiento» en texto; con más de tres alertas, los accesos rápidos quedan después de tres filas y un botón; en escritorio no hay puntos suspensivos en alertas de hasta dos líneas; tests en verde
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-12
- **Última actualización:** 2026-11-12
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** Vitest 157/157 (corrido desde `C:\`), tsc sin errores; test nuevo del pliegue y del despliegue con `aria-expanded`. Sin probar: revisión visual a 390 y 1440 px, Playwright, lector de pantalla

### [HECHO] UIX-025 — Producción: registros compactos en el celular y detalle reconocible

- **Capa:** SOLICITADO
- **Fuente:** revisión del usuario del 2026-11-12 de Producción (Administración, 1440 × 900 y 390 × 844)
- **Contexto propietario:** Interfaz (Producción y componentes compartidos)
- **Dependencias:** ninguna
- **Alcance:** en la tabla apilada no se muestran Registró, la foto sin acción ni la cantidad vacía (`data-apilada="oculta"` en `.tabla-apilada`; el dato sigue en el detalle); botón «Ver detalle» con texto en vez de la flecha sola; Desde y Hasta a todo el ancho en los filtros del celular; el detalle de `KpiCard` se oculta en el celular salvo que aporte un dato (`detalleMovil`, usado para los m³); la cruz de `Dialog` y `Sheet` se anuncia «Cerrar»; sin partes y sin filtros activos, el estado vacío dice «Todavía no hay partes para mostrar.» (revisión con las cuentas demo)
- **Fuera de alcance:** el envío de un parte nuevo; los teléfonos de menos de 360 px
- **Invariantes:** toneladas y m³ no se suman ni convierten; las acciones (Corregir, Adjuntar o Ver foto, Ver detalle) siguen disponibles en el celular; el nombre accesible del detalle incluye fecha y frente
- **Contratos y archivos previstos:** features/production/ProduccionPage.tsx (+ test), shared/components/KpiCard.tsx, shared/components/ui/dialog.tsx y sheet.tsx, index.css, Logistica.test.tsx
- **Criterios de aceptación:** cada parte apilado muestra fecha, frente, máquina, madera y cantidad, y sus acciones; el detalle se reconoce por su texto; tests en verde
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-12
- **Última actualización:** 2026-11-12
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** Vitest 157/157 (corrido desde `C:\`), tsc sin errores; tests de las celdas ocultas al apilar y del estado vacío con y sin filtros; el test de Correcciones elige el «Cerrar» del pie porque la cruz ahora también se llama así. Sin probar: revisión visual a 390 y 1440 px, Playwright (fase7-mobile)

### [HECHO] UIX-026 — Viajes: camión por tipo, fecha legible y tarjetas con el estado primero

- **Capa:** SOLICITADO
- **Fuente:** revisión del usuario del 2026-11-12 de Viajes con las ocho cuentas demo (escritorio y 390 px)
- **Contexto propietario:** Interfaz (Logística y tablas apiladas compartidas)
- **Dependencias:** ninguna
- **Alcance:** selector «Camión» agrupado por tipo de maquinaria (`porTipo`, solo presentación: D31 sigue sin definir qué es un camión); «Fecha y hora» del viaje en su propia fila en el celular; en la tabla apilada el estado encabeza cada viaje (`data-apilada="primero"`, filas en columna flex) y el remito vacío no se muestra; el diálogo de remito avisa que la fecha viene con el día de hoy y hay que revisarla contra el papel
- **Fuera de alcance:** restringir la declaración a camiones (exige definir el tipo en el dominio, DER y PDF, según D31); cambiar la fecha predeterminada del remito
- **Invariantes:** el viaje solo se valida por cotejo exacto (RF07); se ofrecen todas las unidades activas; las acciones por rol no cambian
- **Contratos y archivos previstos:** features/logistics/ViajeNuevoPage.tsx, RemitoDialog.tsx, ViajesPage.tsx, features/machinery/api.ts, index.css, Logistica.test.tsx
- **Criterios de aceptación:** las unidades aparecen agrupadas por tipo; la fecha y hora se lee entera a 390 px; cada viaje apilado empieza por su estado; tests en verde
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-12
- **Última actualización:** 2026-11-12
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** Vitest 158/158 (corrido desde `C:\`), tsc sin errores; test de `porTipo`. Sin probar: revisión visual a 390 px y Playwright `fase7-mobile`; el cambio de `.tabla-apilada tr` a columna flex alcanza a todas las tablas apiladas

### [HECHO] UIX-027 — Correcciones pasa a ser una pestaña de Viajes

- **Capa:** SOLICITADO
- **Fuente:** observación del usuario del 2026-11-12: el módulo Correcciones no tiene sentido aparte, porque al entrar lleva de nuevo a Viajes
- **Contexto propietario:** Interfaz (Logística)
- **Dependencias:** ninguna
- **Alcance:** la bandeja de solicitudes (`BandejaCorrecciones`) se muestra como pestaña «Correcciones» de Viajes (`?pestana=correcciones`) para quien tiene `logistics.correction.manage`; se quita la entrada del menú; `/correcciones` redirige a la pestaña; el aviso y la tarjeta de Inicio apuntan a la pestaña
- **Fuera de alcance:** acción «Corregir» por fila de viaje (el viaje no trae el id de su solicitud; exige cambiar el backend)
- **Invariantes:** tomar, corregir y recotejar no cambian (RF08, D19); el backend sigue autorizando; sin el permiso, Viajes no muestra pestañas
- **Contratos y archivos previstos:** features/logistics/ViajesPage.tsx, CorreccionesPage.tsx, main.tsx, app/AppLayout.tsx, features/inicio/reglas.ts, Logistica.test.tsx, e2e/fase3.spec.ts
- **Criterios de aceptación:** el menú no muestra Correcciones; Viajes → Correcciones permite tomar y corregir; `/correcciones` y el aviso de Inicio abren la pestaña; tests en verde
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-12
- **Última actualización:** 2026-11-12
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** Vitest 159/159 (desde `C:\`), tsc sin errores; test nuevo de pestañas por permiso; `fase3.spec.ts` actualizado (pestaña y botón «Cerrar» del pie) pero sin correr

### [HECHO] UIX-028 — Lecturas: unidades sin parpadeo, falla rotulada y un solo formato numérico

- **Capa:** SOLICITADO
- **Fuente:** revisión del usuario del 2026-11-12 de Lecturas con las ocho cuentas demo
- **Contexto propietario:** Interfaz (Mantenimiento)
- **Dependencias:** ninguna
- **Alcance:** el selector «Unidad» de lectura y de matafuego queda deshabilitado con «Cargando unidades…» mientras se consultan los frentes del usuario (antes mostraba un instante toda la flota); en la tabla, la falla se rotula «Falla reportada» y «Atención», con más aire entre ambas (la atención con borde a la izquierda) y la columna Estado separada de Lectura; la lectura anterior/posterior, los avisos de RNF05 y el resumen al guardar usan el formato es-AR del listado (`lectura()`); el subtítulo de Lecturas dice «de todas las unidades» para quien tiene `maintenance.failure.view` (mismo permiso con el que el backend amplía el alcance, D20)
- **Fuera de alcance:** cambiar el alcance de la consulta o de la carga
- **Invariantes:** el backend sigue rechazando unidades ajenas (`SIN_ASIGNACION`); Administración carga sobre cualquier unidad (D32); si falla la consulta de frentes se ofrecen todas y decide el backend
- **Contratos y archivos previstos:** features/maintenance/api.ts, LecturaNuevaPage.tsx, MatafuegoNuevoPage.tsx, TablaLecturas.tsx, MisLecturasPage.tsx, avisoLectura.ts y sus tests
- **Criterios de aceptación:** ninguna unidad ajena aparece mientras carga; los dos momentos de la falla se distinguen; 840,00 h se ve igual en el listado y en la ayuda; tests en verde
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-12
- **Última actualización:** 2026-11-12
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** Vitest 159/159 (desde `C:\`), tsc y oxlint sin errores; el test D28 verifica selector deshabilitado y sin unidades ajenas durante la carga. Sin probar a 390 px ni con Playwright

### [HECHO] UIX-029 — Mantenimiento: lo urgente primero y matafuegos desglosados

- **Capa:** SOLICITADO
- **Fuente:** revisión del usuario del 2026-11-12 del panel técnico con las ocho cuentas demo (escritorio y móvil)
- **Contexto propietario:** Interfaz (Mantenimiento)
- **Dependencias:** ninguna
- **Alcance:** la flota se ordena por urgencia (fallas abiertas o matafuego con carga vencida o faltante; después cualquier pendiente; el resto en el orden del backend); la tarjeta «Matafuegos con pendientes» desglosa el número en categorías sin superposición (carga vencida o faltante · sin control del mes · otras observaciones); las tres tarjetas del resumen son más bajas en el celular (número y título en una línea); en el historial, la columna pasa a «Estado al revisar» y un control con la carga ya vencida se marca «⚠ Ya vencida»
- **Fuera de alcance:** cambiar el cálculo del panel en el backend; un orden configurable
- **Invariantes:** los conteos y filtros no cambian; D24: una carga vencida nunca se muestra como vigente
- **Contratos y archivos previstos:** features/maintenance/PanelPage.tsx, HistorialUnidadPage.tsx y sus tests
- **Criterios de aceptación:** la unidad con carga vencida aparece antes que las que están al día; el resumen dice cuántas tienen carga vencida; el historial no se lee como situación vigente; tests en verde
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-12
- **Última actualización:** 2026-11-12
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** Vitest 160/160 (desde `C:\`), tsc y oxlint sin errores; tests de orden por urgencia, desglose y «Ya vencida». Sin probar a 390 px ni con Playwright

### [HECHO] UIX-030 — Reportes no abría: efecto que devolvía la promesa de scrollIntoView

- **Capa:** SOLICITADO
- **Fuente:** aviso del usuario del 2026-11-12: `/reportes` no carga; consola de Vite: «TypeError: destroy is not a function» en `ReportesPage`
- **Contexto propietario:** Interfaz (Reportes y componentes compartidos)
- **Dependencias:** ninguna
- **Alcance:** los `useEffect` con cuerpo de expresión que devolvían el resultado de `scrollIntoView` (ReportesPage) y de `focus` (ConfirmacionEnvio) pasan a cuerpo con llaves; Chrome ya devuelve una promesa desde `scrollIntoView` y React la tomaba como función de limpieza
- **Fuera de alcance:** una regla de lint que lo impida
- **Invariantes:** la pestaña activa sigue quedando a la vista en el celular
- **Contratos y archivos previstos:** features/reports/ReportesPage.tsx, shared/components/ConfirmacionEnvio.tsx
- **Criterios de aceptación:** `/reportes` abre sin error; tests en verde
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-12
- **Última actualización:** 2026-11-12
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** Vitest 160/160, tsc sin errores; jsdom no reproduce el error (su `scrollIntoView` no devuelve promesa); confirmar en el navegador

### [HECHO] UIX-031 — Reportes en el celular: sin recorte, sin barras internas y sin totales en cero

- **Capa:** SOLICITADO
- **Fuente:** revisión del usuario del 2026-11-12 de Reportes con las ocho cuentas demo (390 px)
- **Contexto propietario:** Interfaz (Reportes y tablas apiladas compartidas)
- **Dependencias:** ninguna
- **Alcance:** `Tabs` con `min-w-0` en Reportes y Viajes (la tira de seis pestañas de Administración ensanchaba la grilla a ~752 px, las tablas no se apilaban y el `overflow-x-clip` del layout las recortaba); la etiqueta de las tablas apiladas flota en el margen y la celda es `flow-root`, así una etiqueta de dos líneas agranda la fila en vez de abrir una barra vertical interna; sin lote importado, el consolidado mensual y Consumos dicen «Sin datos importados» en lugar de un total en cero; los indicadores se agrupan en «En el período» y «Situación actual»
- **Fuera de alcance:** cambiar los cálculos del backend
- **Invariantes:** D21: el estado del lote se muestra tal cual; los permisos por pestaña no cambian
- **Contratos y archivos previstos:** features/reports/ReportesPage.tsx, ReportesPage.test.tsx, features/logistics/ViajesPage.tsx, index.css
- **Criterios de aceptación:** a 390 px ninguna pestaña desborda ni tiene scroll interno; sin datos importados no se ve «Total: 0,00»; tests en verde
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-12
- **Última actualización:** 2026-11-12
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** Vitest 161/161, tsc y oxlint sin errores; medición con Playwright a 390 px como Administración: las seis pestañas sin desborde ni scroll interno (antes, sección de 752 px); Viajes y Producción revisadas con el cambio de etiquetas

### [HECHO] UIX-032 — Reportes con jerarquía propia

- **Capa:** SOLICITADO
- **Fuente:** segunda revisión visual del usuario del 2026-11-12 de Reportes (escritorio, 390 px y modo claro)
- **Contexto propietario:** Interfaz (Reportes)
- **Dependencias:** ninguna
- **Alcance:** título `h2` del reporte activo y período destacado; en el celular un selector «Reporte» reemplaza la tira de pestañas (se ven todas las secciones); con un solo reporte (Mantenimiento) no hay pestañas; filtros `w-fit`; divisor antes de los totales; la madera lleva el color en un punto y el texto en color normal (el ámbar de aserrable se leía como advertencia); en `TablaProduccion` apilada el frente titula la tarjeta y el m³ sin medición no ocupa una línea (`data-apilada="oculta"`, ahora también en `.tabla-apilada-angosta`)
- **Fuera de alcance:** cambiar los tokens de madera; transiciones y movimiento (revisión con apple-design o emil-design-eng); el `PageHeader` compartido
- **Invariantes:** toneladas y m³ siguen en columnas separadas; permisos por pestaña sin cambios; en escritorio no se oculta ningún dato
- **Contratos y archivos previstos:** features/reports/ReportesPage.tsx, Tablas.tsx, ReportesPage.test.tsx, index.css
- **Criterios de aceptación:** el reporte activo se nombra antes de los datos; en el celular se ven todos los reportes disponibles; Marta no ve pestañas; tests en verde
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-12
- **Última actualización:** 2026-11-12
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** Vitest 163/163, tsc y oxlint sin errores; Playwright a 390 px (Ana, Marta) y 1440 px (Ana): sin desborde, selector en el celular, tira en escritorio, Marta sin pestañas. No revisado en modo claro

### [HECHO] UIX-033 — Usuarios: roles explicados, contraseña clara y baja menos estridente

- **Capa:** SOLICITADO
- **Fuente:** revisión del usuario del 2026-11-12 de Usuarios con las ocho cuentas demo (escritorio, 390 px y modo claro)
- **Contexto propietario:** Interfaz (Identidad y acceso)
- **Dependencias:** ninguna
- **Alcance:** cada rol del formulario lleva una descripción breve de su alcance (resumida de `docs/rbac.md`, como descripción accesible de la casilla) y toda la fila es área táctil (≥ 44 px); la regla de contraseña se muestra como ayuda desde el inicio; «Cargando…» y error con reintento mientras llega el catálogo de roles; en el celular el diálogo usa casi todo el alto y el pie con Guardar queda fijo; «Deshabilitar» pasa a botón fantasma con texto rojo (sigue identificado, sin dominar la lista)
- **Fuera de alcance:** enlace a una matriz de permisos dentro de la app; cambios de permisos o del backend; la confirmación de baja
- **Invariantes:** la autorización sigue en el backend; las descripciones no otorgan nada; nunca se informa «guardado» sin respuesta del backend
- **Contratos y archivos previstos:** features/users/UsuarioDialog.tsx, UsuariosPage.tsx, UsuariosPage.test.tsx
- **Criterios de aceptación:** cada rol explica qué habilita; la regla de contraseña se lee antes de escribir; Guardar visible sin desplazarse en 390 px; tests en verde
- **Responsable:** RomanVC
- **Fecha de inicio:** 2026-11-12
- **Última actualización:** 2026-11-12
- **Próximo paso:** ninguno; tarea cerrada
- **Evidencia actual:** Vitest 164/164, tsc sin errores; Playwright a 390 px: Guardar visible con el pie fijo, filas de rol de 58–98 px. El estado «Cargando…» no tiene test (el mock responde al instante). Riesgo: las descripciones de rol se mantienen a mano junto a `docs/rbac.md`

### [HECHO] UIX-034 — Rebranding arena, verde y petróleo

- **Capa:** SOLICITADO
- **Fuente:** solicitud y plan aprobado por el usuario el 2026-11-13
- **Contexto propietario:** Interfaz y PWA
- **Dependencias:** ninguna
- **Alcance:** renovar tokens de ambos temas, sidebar, Grainient y tipografía local Plus Jakarta Sans; actualizar documentación y comprobar contraste, build y funcionamiento sin conexión
- **Fuera de alcance:** cambios de composición, logo, backend, permisos y reglas de negocio
- **Invariantes:** tema oscuro predeterminado; estados semánticos y significado de gráficos conservados; preservar cambios locales previos
- **Contratos y archivos previstos:** frontend/src/index.css, FondoGrainient.tsx, configuración PWA, dependencias y documentación de diseño
- **Criterios de aceptación:** nueva identidad aplicada en ambos temas; texto, controles, estados y foco contrastados; fuente local disponible sin conexión; pruebas pertinentes y plan validados
- **Responsable:** Codex; verificación y cierre: Claude
- **Fecha de inicio:** 2026-11-13
- **Última actualización:** 2026-11-13
- **Próximo paso:** ninguno para el rebranding. Fuera de esta tarea siguen en rojo las áreas táctiles de `fase7-mobile` (UIX-022) y cinco E2E de flujo (fase1, fase4, fase5, cierre-sesion, sdd-bloque1) que fallan por login o estado de datos, sin relación con el color
- **Evidencia actual:** paleta y tipografía aplicadas; Vitest completo 164/164 antes del último ajuste de contraste y pruebas de tokens finales 28/28; build, lint y verificación PWA correctos. Chromium: login y shell offline, e Inicio con sesión simulada a 1440 y 390 px en ambos temas, sin desbordamiento; contraste del fondo en capturas estáticas documentado en design-tokens.md. No se ejecutó E2E con backend real, ni revisión completa de pantallas, dispositivos físicos o toda la animación. Se preservaron cambios locales previos. Revisión del 2026-11-13 (Claude), con back y front reales y datos de demo: capturas de 14 rutas en ambos temas a 1440 y 390 px. Correcciones: la sidebar oscura era igual al canvas y ocultaba la pestaña activa (pasa a `#2E4236`, con prueba de tokens); la tarjeta de alerta del resumen de la quincena daba `text-soft` 4,39:1 sobre el Grainient claro (tinte sobre `bg-surface`); `tema.js` usaba el theme-color viejo; se quitaron las licencias de fuentes retiradas. Daltonismo (CDP): azul/naranja se distingue en deuteranopía, protanopía y tritanopía. Grainient animado con GPU real: mínimo 4,72:1 en claro y 8,24:1 en oscuro. Vitest 178/178, tsc, build, verify:pwa; Playwright 40 pasan, con axe sin violaciones graves en todos los roles y temas.

### [HECHO] UIX-035 — E2E en verde fuera del recorrido mobile

- **Capa:** SOLICITADO
- **Fuente:** pedido del usuario del 2026-11-13, después de cerrar UIX-034
- **Contexto propietario:** Interfaz (frontend compartido) y pruebas E2E
- **Dependencias:** UIX-028, UIX-019
- **Alcance:** fase4 y sdd-bloque1 esperaban lecturas `1000.00 h` (UIX-028 las pasó a es-AR, `1.000,00 h`); fase5 esperaba «1 unidades» (la pantalla ya concuerda: «1 unidad») y la importación pasaba los 5 s con `artisan serve` de un hilo (espera de 15 s en ese paso); cierre-sesion era intermitente porque las consultas reintentaban sus 401 y dejaban el logout en cola: `reintentarConsulta` (shared/api/client.ts) ya no reintenta errores 4xx y sigue reintentando sin red o con 5xx
- **Fuera de alcance:** áreas táctiles de fase7-mobile (UIX-022)
- **Invariantes:** las pruebas siguen los textos y formatos de la app, no al revés; sin cambios de backend
- **Contratos y archivos previstos:** e2e/fase4.spec.ts, e2e/fase5.spec.ts, e2e/sdd-bloque1.spec.ts, src/shared/api/client.ts, src/main.tsx, client.test.ts
- **Criterios de aceptación:** Playwright completo sin fallos ajenos a UIX-022; Vitest en verde
- **Responsable:** Claude
- **Fecha de inicio:** 2026-11-13
- **Última actualización:** 2026-11-13
- **Próximo paso:** ninguno
- **Evidencia actual:** Vitest 179/179 y tsc sin errores. Playwright completo: 53 pasan; fallan solo los 4 de fase7-mobile (áreas táctiles de UIX-022). Diagnóstico de cierre-sesion con el trace de red: dos rondas de 401 de Inicio delante del logout reintentado tras 419.

### [HECHO] UIX-036 — Verificación mobile-first en anchos extremos, horizontal y diálogos

- **Capa:** SOLICITADO
- **Fuente:** pedido del usuario del 2026-11-13: confirmar que la app se usa sin problemas en el celular (la mayor parte del tráfico es mobile), sin descuidar escritorio
- **Contexto propietario:** Interfaz (frontend compartido)
- **Dependencias:** UIX-022
- **Alcance:** auditoría con los 7 usuarios de demo y las rutas del menú de cada rol, a 320×640, 360×740, 390×844, 412×915 y 740×360 (horizontal), con diálogos de gestión y menú abiertos y GPU real: scroll horizontal, recortes, áreas táctiles < 44 px, texto < 12 px y campos < 16 px (zoom de iOS). Correcciones en componentes compartidos: botón Cerrar de `ui/dialog` de 44 px en el celular; `NativeSelect` con `text-base md:text-sm`; acciones de fila `h-11 md:h-8` (antes `sm:h-8`, quedaban de 32 px en horizontal); acciones de `PageHeader` con `flex-wrap` (Mantenimiento de Administración desbordaba 16 px a 320 px)
- **Fuera de alcance:** dispositivo físico; rediseño de pantallas
- **Invariantes:** escritorio sin cambios visuales desde `md`; tokens semánticos
- **Contratos y archivos previstos:** ui/dialog.tsx, ui/native-select.tsx, PageHeader.tsx, Usuarios, Frentes, Maquinaria, Viajes, Correcciones; e2e/fase7-mobile.spec.ts (regla de zoom en iOS, diálogos y anchos 320 y 740×360)
- **Criterios de aceptación:** auditoría sin hallazgos; fase7-mobile ampliado y suite completa en verde
- **Responsable:** Claude
- **Fecha de inicio:** 2026-11-13
- **Última actualización:** 2026-11-13
- **Próximo paso:** ninguno; queda pendiente una prueba en un celular físico
- **Evidencia actual:** primera pasada: 70 pantallas con hallazgos en 131 capturas, de 4 causas compartidas. Tras corregir: 0 hallazgos con Administración en los 5 tamaños, diálogos incluidos; Vitest 179/179; Playwright 57/57 antes de ampliar el spec y las 2 pruebas nuevas en verde. Teclados verificados en el código: `inputMode` decimal/numeric en toneladas, m³, volumen y lecturas; `email` en el login. Suite completa con el spec ampliado: Playwright 59/59.

### [HECHO] UIX-037 — Login homologado con la app y entrada con pausas

- **Capa:** SOLICITADO
- **Fuente:** pedido del usuario del 2026-11-18: la app se siente poco homologada entre secciones y el login brusco y sin pausas; diagnóstico acordado en sesión y pedido de arrancar por el login
- **Contexto propietario:** Interfaz (frontend compartido)
- **Dependencias:** UIX-034
- **Alcance:** el login usa el mismo lenguaje que la app (radios de superficie y control, título a escala de PageHeader, botón y campos estándar, marca una sola vez, alineación única, agrupación con ritmo), entrada escalonada con el keyframe `vista-entrada` y salida con fundido al ingresar en lugar del corte seco
- **Fuera de alcance:** resto de las pantallas (homologación de radios, avisos, bloques con título y tokens de movimiento queda para tareas siguientes); backend y flujo de autenticación
- **Invariantes:** validación, mensajes, autocompletado, `inputMode`, áreas táctiles ≥ 44 px y campos de 16 px en el celular; `prefers-reduced-motion`; tokens semánticos; funcionamiento sin conexión
- **Contratos y archivos previstos:** features/auth/LoginPage.tsx, index.css, LoginPage.test.tsx
- **Criterios de aceptación:** login coherente con la app en ambos temas a 1440 y 390 px; entrada y paso a la app sin cortes; Vitest y tsc en verde; plan validado
- **Responsable:** Claude
- **Fecha de inicio:** 2026-11-18
- **Última actualización:** 2026-11-18
- **Próximo paso:** ninguno; la homologación del resto sigue en UIX-038
- **Evidencia actual:** diagnóstico: el login no participa de la View Transition (solo `.vista` tiene nombre), por eso pasa a la app con corte seco; usa radios 2rem/1.5rem/xl/full y título 5xl, ajenos al resto. Implementado: tarjeta con `surface` y foto a sangre (sin clip-path), marca igual a la sidebar una sola vez, `PageHeader` como encabezado, campos y botón estándar (`h-12 text-base`), columna única con un borde izquierdo; entrada escalonada `.login-entrada` (0/100/200 ms, sin animación con movimiento reducido); al ingresar, View Transition de la raíz con `data-ingreso` (salida 250 ms, entrada 350 ms con 100 ms de respiro) y precarga del chunk de Grainient. Medido con backend real y Ana (Administración): transición lista a 30 ms, animaciones de 250 y 450 ms, sin errores de página. Capturas a 1440 y 390 px en ambos temas. tsc sin errores; Vitest auth + app 30/30. Se reinstalaron dependencias del lock (faltaba `recharts` en node_modules y el front en marcha no compilaba). El `check` del plan ya fallaba antes por UIX-022 y UIX-035 (dependencias UIX-021 y UIX-019 abiertas), no por esta tarea. Aprobado por el usuario el 2026-11-18 al pedir seguir con el resto

### [HECHO] UIX-038 — Homologación visual: radios, avisos, bloques con título, encabezados y movimiento

- **Capa:** SOLICITADO
- **Fuente:** pedido del usuario del 2026-11-18, después de UIX-037 («seguí con la homologación del resto»), sobre el diagnóstico de la misma sesión
- **Contexto propietario:** Interfaz (frontend compartido)
- **Dependencias:** UIX-037
- **Alcance:** escala de radios en dos niveles (superficie 1rem; controles y cajas internas 0.5rem; píldora solo para etiquetas, chips y navegación); un único componente de aviso (`ui/alert` con tonos success, warning, destructive e info y tintes del tema claro) en lugar de cajas armadas a mano; tablas con título de Integración en `TablaPanel`; eyebrow = sección del menú (subpáginas: sección / página padre); tokens de duración y curva para el movimiento
- **Fuera de alcance:** el ⚠/✓ dentro de celdas y etiquetas (convención de redundancia color + símbolo); composición de cada pantalla; backend
- **Invariantes:** textos y roles accesibles de los avisos (los estáticos no anuncian como `alert`); contraste en ambos temas; tokens semánticos; áreas táctiles
- **Contratos y archivos previstos:** ui/alert.tsx, index.css, docs/design-tokens.md, pantallas con cajas de aviso o radios fuera de escala, PageHeader de las páginas, e2e que citan textos cambiados
- **Criterios de aceptación:** sin `rounded-lg/xl` ni cajas de tono ad hoc fuera de `ui/`; capturas de las rutas principales a 1440 y 390 px en ambos temas; Vitest y tsc en verde
- **Responsable:** Claude
- **Fecha de inicio:** 2026-11-18
- **Última actualización:** 2026-11-18
- **Próximo paso:** ninguno; Reportes sigue en UIX-039
- **Evidencia actual:** relevamiento: 4 radios en uso (md, lg, xl, 2xl) más arbitrarios; 12 cajas de aviso armadas a mano con opacidades /5, /10 y sin fondo; `Alert` con solo 3 variantes y fondo de tarjeta. Implementado: `ui/alert` con 5 tonos y `data-tono`; 14 cajas migradas (Correcciones, Panel, Matafuego, Lectura, Parte, Reportes, Inicio, SinUnidades, ConfirmacionEnvio, DescartarBorrador); radios internos a `rounded-md` (Inicio, KpiCard, diálogos de Frentes y Maquinaria, tooltip, UpdatePrompt); Integración con `TablaPanel`; eyebrows por sección; tokens `--dur-*`, `--paso-escalonado` y `--curva-*` en index.css; reglas en docs/design-tokens.md. Tests ajustados: Logistica (el `role=alert` pasa al contenedor del aviso) y e2e fase6 (el ✓ de la caja lo reemplaza el ícono). Verificación: tsc sin errores; Vitest 179/179; 60 capturas (Ana en 11 rutas y Omar en 4, 1440 y 390 px, ambos temas) sin desborde horizontal ni errores de consola; avisos neutro y de advertencia revisados con datos reales en ambos temas. No se corrió Playwright completo. Aprobado por el usuario el 2026-11-18 al pedir seguir con Reportes

### [EN_CURSO] UIX-039 — Reportes con los mismos patrones que el resto de la app

- **Capa:** SOLICITADO
- **Fuente:** pedido del usuario del 2026-11-18 («seguí con Reportes»), pendiente señalado al cerrar la pasada de UIX-038
- **Contexto propietario:** Interfaz (reportes gerenciales)
- **Dependencias:** UIX-038
- **Alcance:** filtros de Producción histórica y Consumos en `FilterPanel` (con etiquetas de filtros activos y limpiar); selección de período de Quincenal, Consolidado mensual y Operativo en una barra compartida que no se pliega; todas las tablas de reportes en `TablaPanel`, con el estado vacío dentro del panel y el total de consumos como contador; el título de la pestaña activa queda solo para lectores cuando hay pestañas
- **Fuera de alcance:** datos, endpoints y cálculos de los reportes; el resumen de la quincena de Inicio; Integración (ya en UIX-038)
- **Invariantes:** sin total en cero cuando no hay lote importado (UIX-031); toneladas y m³ nunca se suman; filas apiladas en el celular (UIX-032); un solo reporte muestra su título visible
- **Contratos y archivos previstos:** features/reports/ReportesPage.tsx, features/reports/Tablas.tsx, shared/components/TablaPanel.tsx, IntegracionPage.tsx, ReportesPage.test.tsx
- **Criterios de aceptación:** ninguna barra de filtros ni tabla armada a mano en Reportes; capturas de las 6 pestañas a 1440 y 390 px en ambos temas sin desborde; Vitest y tsc en verde
- **Responsable:** Claude
- **Fecha de inicio:** 2026-11-18
- **Última actualización:** 2026-11-18
- **Próximo paso:** revisión visual del usuario
- **Evidencia actual:** relevamiento: 4 barras `surface-quiet` armadas a mano y un input suelto (Mensual); 4 tablas en `div.surface` sin título interno; títulos h2 sueltos en Mensual; el nombre de la pestaña activa repetido como título debajo de la tira. Implementado: `FilterPanel` en Producción histórica (frente, máquina y madera como filtros activos; limpiar vuelve al mes en curso) y Consumos; `BarraPeriodo` compartida en Quincenal, Consolidado mensual y Operativo; `TablaProduccion`, `TablaViajes` y `TablaConsumos` dentro de `TablaPanel` con título propio y estado vacío interno (`TablaVacia`, también usado en Integración); total de consumos como contador del panel, ausente sin lote importado (UIX-031); h2 de la pestaña en `sr-only` cuando hay pestañas. Verificación: tsc y oxlint sin errores; Vitest 179/179 sin cambios en los tests; capturas de las 6 pestañas a 1440 y 390 px en ambos temas con datos reales, sin desborde. La franja blanca al pie de las capturas del celular es un artefacto del WebGL por software de Chromium headless: con Chrome y GPU real no aparece

### [HECHO] UIX-040 — Tema claro predeterminado y capas del oscuro separadas

- **Capa:** SOLICITADO
- **Fuente:** pedido del usuario del 2026-11-18 («aplicá los dos»), tras la revisión de uso diario donde el oscuro se veía «verde oscuro sobre verde oscuro»
- **Contexto propietario:** Interfaz (tokens y tema)
- **Dependencias:** UIX-034, UIX-014
- **Alcance:** el claro (arena) es el tema inicial; el oscuro queda solo si el usuario lo elige. En oscuro: canvas `#111814`, surface `#1F2B24`, border-default `#577263`, text-primary `#EFEADC`, text-secondary/muted `#C2D1C6`, Grainient y barra del navegador acordes. En claro, state-warning/validation-pending `#944206` (axe marcó la píldora «Atención» de Inicio en 4,29:1)
- **Fuera de alcance:** paleta nueva; colores de marca, estados oscuros y gráficos
- **Invariantes:** contrastes de `forestDepthTokens.test.ts`; la preferencia guardada en `indufor:tema` se respeta
- **Contratos y archivos previstos:** frontend/public/tema.js, frontend/index.html, frontend/vite.config.ts, frontend/src/index.css, frontend/src/app/useTema.ts, frontend/src/app/FondoGrainient.tsx, docs/design-tokens.md
- **Criterios de aceptación:** un usuario sin preferencia ve el claro aunque el sistema esté en oscuro; tarjeta/canvas ≥1,2:1 y borde de tarjeta ≥2,5:1 en oscuro; axe WCAG AA sin violaciones en ambos temas; Vitest y tsc en verde
- **Responsable:** Claude
- **Fecha de inicio:** 2026-11-18
- **Última actualización:** 2026-11-18
- **Próximo paso:** probar a pleno sol en un celular real; correr `e2e/fase7-*` cuando el PHP del PATH sea ≥ 8.4.1
- **Evidencia actual:** Vitest 179/179, tsc sin errores; tarjeta/canvas 1,16→1,23:1 y borde de tarjeta 1,9→2,8:1; axe (wcag2a/aa, 21aa) en 7 pantallas de 5 roles a 1440 px: 0 violaciones en oscuro y claro; Playwright con `colorScheme: dark` y sin preferencia arranca en `data-theme="light"`. La suite e2e no corrió: su webServer usa PHP 8.2.12 del PATH y composer exige ≥ 8.4.1

### [HECHO] UIX-042 — Impresión del resumen quincenal

- **Capa:** SOLICITADO
- **Fuente:** pedido del usuario del 2026-11-18 para corregir Imprimir en Inicio, con salida en color y legibilidad en blanco y negro
- **Contexto propietario:** Reportes e Interfaz
- **Dependencias:** ninguna
- **Alcance:** hoja A4 del resumen quincenal con estilos de impresión, tabla semanal y paginación por fila
- **Fuera de alcance:** exportación PDF propia y cambios de impresión en otras pantallas
- **Invariantes:** mismos datos, formatos y permisos que en Inicio, con toneladas y m³ separados
- **Contratos y archivos previstos:** `ResumenQuincena.tsx`, estilos de impresión y prueba Playwright
- **Criterios de aceptación:** salida A4 aislada, legible en ambos temas y en escala de grises, con filas intactas y casos vacío y multipágina verificados en Chromium
- **Responsable:** Codex
- **Fecha de inicio:** 2026-11-18
- **Última actualización:** 2026-11-18
- **Próximo paso:** ninguno
- **Evidencia actual:** Vitest 179/179, build de producción y TypeScript correctos. Playwright Chromium 3/3 con respuestas de API simuladas. Se revisaron PDFs A4 en color y escala de grises, con los mismos datos y paginación desde ambos temas. Los 37 frentes ocuparon dos hojas sin cortar renglones. El caso sin datos quedó en una hoja. El validador del plan conserva los errores previos de UIX-022 y UIX-035.

### [HECHO] UIX-041 — Rectángulos negros sobre el fondo: artefacto de SwiftShader, sin cambio de código

- **Capa:** SOLICITADO
- **Fuente:** pedido del usuario del 2026-11-18 («seguí con el punto 2») sobre los bloques negros vistos en capturas de Playwright
- **Contexto propietario:** Interfaz (fondo Grainient)
- **Dependencias:** UIX-015
- **Alcance:** diagnosticar los rectángulos negros detrás del título de las pantallas de campo y en los bordes del Inicio móvil
- **Fuera de alcance:** cambios en Grainient mientras no se reproduzca con GPU
- **Invariantes:** fondo fijo en celular y con renderizador por software (UIX-015)
- **Contratos y archivos previstos:** ninguno
- **Criterios de aceptación:** causa identificada y verificada con GPU real
- **Responsable:** Claude
- **Fecha de inicio:** 2026-11-18
- **Última actualización:** 2026-11-18
- **Próximo paso:** si se quieren capturas e2e limpias, no montar Grainient cuando el renderizador es por software
- **Evidencia actual:** el negro sale del lienzo (ocultar el canvas lo quita; ocultar el título o quitar la animación, no). Con SwiftShader (Chromium headless por defecto) aparece una franja negra en y 62–132 px de `/viajes/nuevo` a 412 px. Con la GPU (ANGLE D3D11, AMD Radeon), headless y con ventana, la franja no aparece y las capturas de `/viajes/nuevo`, `/produccion/nuevo` e Inicio móvil quedan limpias. `preserveDrawingBuffer: true` no cambió nada y se revirtió

### [HECHO] UIX-049 — Formularios de campo en PC: la barra de acción deja de tapar campos

- **Capa:** SOLICITADO
- **Fuente:** pedido del usuario del 2026-11-18 («seguí con el punto 3»): en «Parte de producción» a 1440 px la barra fija tapaba a medias «Sacar o elegir foto»
- **Contexto propietario:** Interfaz (pantallas de campo)
- **Dependencias:** UIX-041
- **Alcance:** desde `md` (768 px, el mismo corte que `useIsMobile`) la barra de Enviar/Volver queda al final del formulario, sin fondo, borde ni margen; en celular sigue fija abajo (indufor-field-mobile-ux, regla 1). Parte de producción, Declarar viaje, Lectura semanal y Control de matafuego
- **Fuera de alcance:** el espacio que reservan las regiones `aria-live` vacías antes del botón (necesarias para anunciar errores)
- **Invariantes:** acción principal al alcance del pulgar en celular; textos y comportamiento de los botones
- **Contratos y archivos previstos:** features/production/ParteNuevoPage.tsx, features/logistics/ViajeNuevoPage.tsx, features/maintenance/LecturaNuevaPage.tsx, features/maintenance/MatafuegoNuevoPage.tsx
- **Criterios de aceptación:** a 1440 px ningún campo queda debajo de la barra; a 412 px la barra sigue fija; Vitest y tsc en verde
- **Responsable:** Claude
- **Fecha de inicio:** 2026-11-18
- **Última actualización:** 2026-11-18
- **Próximo paso:** —
- **Evidencia actual:** Vitest 179/179, tsc sin errores; capturas con GPU de `/produccion/nuevo` (1440 px, claro y oscuro, inicio y fin del scroll), `/lecturas/nueva` (1440 px) y `/viajes/nuevo` (Pixel 7, barra fija)

### [HECHO] UIX-043 — Inicio de Gerencia: accesos de consulta y textos como los dice una persona

- **Capa:** SOLICITADO
- **Fuente:** pedido del usuario del 2026-11-18 («seguí con el punto 4»): Gerencia solo tenía «Panel técnico» y «Ver lecturas» como accesos; textos «tramo anterior», «Ordenados por tu uso en este equipo», «2026-11», «Combustible 2026-10»
- **Contexto propietario:** Interfaz (Inicio y resumen quincenal)
- **Dependencias:** UIX-023, UIX-024
- **Alcance:** accesos «Ver reportes» (`dashboard.management`), «Ver producción» (`production.view-all`) y «Ver viajes» (`logistics.trip.view-all`) antes de los técnicos; `mesAnio()` en `features/reports/formato.ts` para «2.ª quincena de noviembre 2026», «Combustible de octubre 2026» y la alerta «Falta importar el consolidado de consumos de octubre 2026»; «Producción de esta quincena»; comparación «Sin quincena anterior para comparar» / «vs. los mismos días de la quincena anterior»; «Los que más usás aparecen primero.»
- **Fuera de alcance:** datos y cálculos del resumen; el Inicio de Logística sigue titulado «Mi jornada / Tus cargas» aunque ese rol no carga (pendiente de decidir)
- **Invariantes:** la autorización la hace el backend; los accesos solo adaptan la vista; orden por uso en el equipo
- **Contratos y archivos previstos:** features/inicio/InicioPage.tsx, features/inicio/reglas.ts, features/reports/ResumenQuincena.tsx, features/reports/formato.ts y sus tests, e2e/fase6.spec.ts
- **Criterios de aceptación:** Gerencia ve accesos de consulta primero; ningún período en formato AAAA-MM en Inicio; Vitest y tsc en verde
- **Responsable:** Claude
- **Fecha de inicio:** 2026-11-18
- **Última actualización:** 2026-11-18
- **Próximo paso:** correr `e2e/fase6.spec.ts` (regex del encabezado actualizada) cuando el PHP del PATH sea ≥ 8.4.1
- **Evidencia actual:** Vitest 180/180 (nuevo: `mesAnio`; `reglas.test.ts` verifica el título de consumos), tsc sin errores; capturas con GPU a 1440 px del Inicio de Gerencia, Logística y Administración en tema claro

### [HECHO] UIX-044 — Inicio de roles que no cargan: sin «Tus cargas»

- **Capa:** SOLICITADO
- **Fuente:** pedido del usuario del 2026-11-18 («Logística si el rol no carga nada, cambia las palabras»), pendiente de UIX-043
- **Contexto propietario:** Interfaz (Inicio)
- **Dependencias:** UIX-043
- **Alcance:** sin `production.create`, `logistics.trip.create`, `maintenance.reading.create` ni `maintenance.extinguisher.create` (hoy Logística y Mantenimiento): «Lo que tenés pendiente y los accesos a tu trabajo.» y, en Actividad reciente, «Lo último que registraste.»
- **Fuera de alcance:** permisos (docs/rbac.md); el título «Mi jornada» se mantiene
- **Invariantes:** los roles de campo conservan «Tus cargas»; los de gestión, «Centro de operaciones»
- **Contratos y archivos previstos:** features/inicio/InicioPage.tsx, features/inicio/InicioPage.test.tsx
- **Criterios de aceptación:** ningún texto de «cargas» para un rol solo de consulta; Vitest y tsc en verde
- **Responsable:** Claude
- **Fecha de inicio:** 2026-11-18
- **Última actualización:** 2026-11-18
- **Próximo paso:** —
- **Evidencia actual:** test nuevo «Logística (solo consulta)»; captura del Inicio de Logística a 1440 px

### [HECHO] UIX-045 — Matafuego vencido: sin «estado: OK» al lado de «Carga vencida»

- **Capa:** SOLICITADO
- **Fuente:** pedido del usuario del 2026-11-18 («continua con el punto 5»): en el Panel técnico, HV-PR1 decía «Carga vencida» y «estado del matafuego: OK» en la misma fila
- **Contexto propietario:** Interfaz (mantenimiento)
- **Dependencias:** UIX-029
- **Alcance:** con la carga vencida, el detalle dice «Venció el dd/mm/aaaa · el equipo está en buen estado, falta recargarlo» si el control lo encontró OK, o «… · además está descargado/dañado»
- **Fuera de alcance:** reglas de vencimiento (D24) y criticidad
- **Invariantes:** la etiqueta «Carga vencida» en rojo; faltante y etiqueta ilegible sin cambios
- **Contratos y archivos previstos:** features/maintenance/PanelPage.tsx, features/maintenance/PanelPage.test.tsx
- **Criterios de aceptación:** ninguna fila combina «Carga vencida» con «OK»; Vitest y tsc en verde
- **Responsable:** Claude
- **Fecha de inicio:** 2026-11-18
- **Última actualización:** 2026-11-18
- **Próximo paso:** —
- **Evidencia actual:** PanelPage.test cubre OK y DESCARGADO vencidos; captura del Panel técnico a 1440 px

### [HECHO] UIX-046 — Permisos de Logística sobre remitos: consulta registrada como D33

- **Capa:** SOLICITADO
- **Fuente:** pedido del usuario del 2026-11-18 («seguí con los puntos 6 y 7»): Logística solo ve la lista de viajes, sin acciones
- **Contexto propietario:** Dominio (RBAC, logística)
- **Dependencias:** —
- **Alcance:** registrar la definición pendiente en `docs/discrepancias.md` (D33); sin cambio de permisos
- **Fuera de alcance:** modificar `docs/rbac.md`, seeders o policies sin decisión de Indufor
- **Invariantes:** matriz RBAC aprobada; autorización en backend
- **Contratos y archivos previstos:** docs/discrepancias.md
- **Criterios de aceptación:** D33 con opciones y archivos a tocar si se aprueba
- **Responsable:** Claude
- **Fecha de inicio:** 2026-11-18
- **Última actualización:** 2026-11-18
- **Próximo paso:** que el usuario confirme con Indufor si Logística carga remitos
- **Evidencia actual:** D33 en docs/discrepancias.md

### [HECHO] UIX-047 — Menú lateral sin píldoras en reposo

- **Capa:** SOLICITADO
- **Fuente:** pedido del usuario del 2026-11-18 («seguí con los puntos 6 y 7»): cada opción del menú tenía fondo y filete propios y el menú se veía recargado
- **Contexto propietario:** Interfaz (navegación)
- **Dependencias:** UIX-034
- **Alcance:** las opciones de navegación (`PILDORA` en `app/Sidebar.tsx`) sin `--sidebar-pill` ni `--sidebar-pill-sombra` en reposo; el hover y la activa sin cambios. Los botones del pie y el avatar conservan la píldora
- **Fuera de alcance:** estructura y textos del menú
- **Invariantes:** la activa toma el canvas; área táctil de 44 px
- **Contratos y archivos previstos:** frontend/src/app/Sidebar.tsx, docs/design-tokens.md
- **Criterios de aceptación:** solo la opción activa y la del mouse tienen fondo; Vitest y tsc en verde
- **Responsable:** Claude
- **Fecha de inicio:** 2026-11-18
- **Última actualización:** 2026-11-18
- **Próximo paso:** —
- **Evidencia actual:** Vitest 181/181, tsc sin errores; capturas del menú con hover en claro y oscuro a 1440 px

### [HECHO] UIX-048 — Panel técnico como bandeja de trabajo por rol

- **Capa:** SOLICITADO
- **Fuente:** pedido del usuario del 2026-11-18 («lo siento raro, difícil de atender»; «dale, implementalo así»): el panel mezclaba en una tabla el trabajo de Mantenimiento (atender fallas) y el de Administración (cargar lecturas y matafuegos), y mostraba las fallas dos veces
- **Contexto propietario:** Interfaz (mantenimiento)
- **Dependencias:** UIX-023, UIX-029, UIX-045
- **Alcance:** pestañas Fallas · Lecturas faltantes · Matafuegos · Toda la flota con su cantidad, en `?situacion=`; se abre en Fallas para quien atiende fallas, en Lecturas faltantes para quien carga lecturas y en Toda la flota para el resto. Cada fila de Lecturas y Matafuegos lleva al formulario con la unidad elegida (`?unidad=<id>` en `/lecturas/nueva` y `/matafuegos/nuevo`). Se quitan las tarjetas de resumen y el filtro «Situación». Las alertas de Inicio abren la pestaña que corresponde
- **Fuera de alcance:** endpoints, permisos (`docs/rbac.md`) y reglas de vencimiento (D24)
- **Invariantes:** autorización en backend; un borrador guardado tiene prioridad sobre la unidad de la URL; textos de matafuego de UIX-045; filas apiladas en el celular
- **Contratos y archivos previstos:** features/maintenance/PanelPage.tsx y su test, LecturaNuevaPage.tsx, MatafuegoNuevoPage.tsx y sus tests, features/inicio/reglas.ts y sus tests, e2e/fase4.spec.ts, e2e/sdd-bloque3.spec.ts
- **Criterios de aceptación:** cada rol abre en su pestaña; las fallas aparecen en un solo lugar; la acción de cada fila preselecciona la unidad; Vitest y tsc en verde
- **Responsable:** Claude
- **Fecha de inicio:** 2026-11-18
- **Última actualización:** 2026-11-18
- **Próximo paso:** —
- **Evidencia actual:** capturas reales con DemoSeeder a 1440 y 390 px (Marta y Ana). A 390 px la pestaña desbordaba la página; se corrigió con `min-w-0` (scrollWidth 390). La base local no tenía los permisos de D32 en los roles; tras `RbacSeeder`, Ana abre en Lecturas faltantes y «Cargar lectura de CM-01» lleva a `/lecturas/nueva?unidad=5` con la unidad elegida. Vitest 184/184 y tsc sin errores. PanelPage.test cubre la pestaña inicial de cada rol, las acciones con `?unidad=`, el ingreso desde Inicio y los textos de UIX-029/045; LecturaNuevaPage.test y Conectividad.test cubren la preselección. Playwright `fase4` + `sdd-bloque3` 9/9 (con `PHP_BIN` en PHP 8.4). `fase4` tenía una carrera previa: navegaba a `/login` sin esperar el logout y `artisan serve` (una petición a la vez en Windows) lo procesaba después del login siguiente, dejando 401; ahora `salir()` espera la redirección al login
