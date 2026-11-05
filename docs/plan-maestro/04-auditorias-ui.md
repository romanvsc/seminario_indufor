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

### [PENDIENTE] UIX-013 — Adoptar shadcn en combobox, campos y avisos (tanda 2)

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
- **Próximo paso:** esperar UIX-012
- **Evidencia actual:** ninguna todavía

### [PENDIENTE] UIX-014 — Activar el modo claro con botón y transición animada

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
- **Próximo paso:** esperar UIX-013
- **Evidencia actual:** ninguna todavía

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
