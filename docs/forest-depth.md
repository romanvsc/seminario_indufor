# Forest Depth — lenguaje visual de INDUFOR

> Evolución visual de la interfaz existente (2026-11-03). **No cambia** reglas de negocio, endpoints, permisos, base de datos ni arquitectura.
> Fuente de verdad de color: `docs/design-tokens.md` (tema oscuro "bosque", que se conserva). Este documento agrega la capa de profundidad y los componentes compartidos.
> Estado: fundamentos aplicados a las vistas existentes. La evolución de color y tipografía de UIX-004 (2026-11-04) abarca también el login, que conserva su composición.

## Principios

- La profundidad sale de la luminosidad, los niveles de superficie, los bordes discretos y la tipografía; no de neones, glow permanente ni vidrio.
- Se tiene que ver bien sin animaciones. Las transiciones de superficie duran 150 ms; la entrada escalonada se sincroniza con el contenido inicial y se desactiva con `prefers-reduced-motion` (UIX-003).
- La luz es ambiental: un verde muy tenue en el canvas y detrás de los encabezados. **Nunca** detrás de números, formularios ni tablas.
- El color semántico (éxito, atención, peligro, maderas, validación) conserva su significado y siempre va acompañado de texto.
- En campo manda la claridad: no hay foto en el celular ni detrás de formularios o tablas. `PageHeader` puede mostrarla en el encabezado en pantallas anchas; `fondo={false}` la desactiva.

## Niveles

| Nivel | Qué es | Cómo se logra |
|---|---|---|
| 1 · Canvas | Fondo de la app | `canvas-ambient`: `bg-canvas`, un radial de marca arriba a la derecha (5–9 %), otro más tenue abajo a la izquierda y un leve aclarado vertical |
| 2 · Surface | Tarjetas KPI, tablas | `surface`: `bg-surface` con luz interior verde desde arriba a la izquierda (`--card-glow`), degradado vertical, borde teñido de marca (`--surface-border`), filo de luz superior (`--surface-highlight`), sombra larga y suave y radio de 16 px |
| 2 · Quiet | Bloques de apoyo (filtros) | `surface-quiet`: superficie translúcida sin luz y borde al 60 %; así no todo es una caja con el mismo peso |
| 3 · Elevated | Diálogos, menús, popovers | `surface-elevated`: `bg-elevated`, borde y `--shadow-elevated` (sombra larga y suave, no negra dura) |

## Tokens complementarios

Están en `frontend/src/index.css`. Los efectos se derivan de los tokens semánticos con `color-mix()`. Los porcentajes cambian por tema (`--depth-*` en `:root` y en `[data-theme="light"]`).

| Token | Uso |
|---|---|
| `--surface-gradient` | Relleno de nivel 2 |
| `--canvas-ambient` | Luz radial del canvas |
| `--header-glow` | Luz detrás del encabezado sin foto |
| `--card-glow` | Luz interior de las superficies de nivel 2 |
| `--surface-border` / `--surface-highlight` | Borde levemente verde y filo de luz superior de las superficies |
| `--table-head` | Encabezado de tabla: superficie con 6 % de marca, sobria |
| `--border-highlight` | Borde de superficie destacada, hover de tarjeta o etiqueta de filtro |
| `--icon-surface` | Fondo del recuadro de íconos (utilidad `icon-surface`) |
| `--card-hover` | Superficie al hover de tarjetas interactivas (`surface-interactive`) |
| `--separator-soft` | Separadores de tablas |
| `--shadow-elevated` | Sombra del nivel 3 |
| `--transition-surface` | `150ms ease-out` |

- **Navegadores sin `color-mix()`:** un bloque `@supports not` cae a superficies planas, sin luz. Sin ese bloque, el build dejaría el verde de marca puro.
- **Color de borde base:** Tailwind 4 usa `currentColor` como borde por defecto. Por eso `@layer base` fija `border-default` para todo `border` suelto. Esto corrige las líneas blancas de tablas y diálogos en el tema oscuro.

## Tipografía y color táctico

La guía de valores y contrastes está en [design-tokens.md](design-tokens.md). El bosque profundo organiza las superficies; el esmeralda distingue marca y acciones, mientras el ámbar se reserva para atención. Error e información mantienen colores y texto propios.

Space Grotesk se usa en títulos y navegación, Plus Jakarta Sans en cuerpo y controles y JetBrains Mono en cifras tabulares y códigos operativos. Se cargan localmente con pesos variables, licencias OFL y alternativas de sistema. Los tamaños existentes se conservan; las cifras de producción, consumos y lecturas mantienen `tabular-nums`, alineación a la derecha en tablas y formato es-AR.

La propuesta original en español y `DESIGN (5).md` se contrastaron en UIX-004. Se adoptó el ámbar para atención, no como CTA; se descartaron ideas de telemetría, mapas y navegación no implementadas. Los colores se ajustaron para contrastar en ambos temas y no se incorporaron afirmaciones no verificadas sobre fatiga o desempeño en campo.

## Componentes compartidos (`frontend/src/shared/components/`)

| Componente | Para qué | Cuándo **no** |
|---|---|---|
| `PageHeader` | Eyebrow, h1, descripción, acción principal y contexto (`children`). `fondo` opcional para la variante forestal | No poner una foto en pantallas de campo ni en formularios |
| `KpiCard` | Ícono opcional, título, número protagonista y detalle. `to` la vuelve enlace con hover y foco; el nombre accesible sale del texto visible (sin `aria-label`). `tono` es `neutro` por defecto. `vertical` para grillas de muchas tarjetas o valores largos | No convertir todo KPI en alerta: el `tono` semántico va solo cuando el dato lo amerita |
| `FilterPanel` + `controlSelect` | Panel de filtros con etiquetas removibles opcionales y "Limpiar filtros" (con `activos` o con `limpiable`). Grilla de 2, 3 y 6 columnas (`columnas` para cambiarla) | Para formularios de carga no: es para consultar |
| `TablaPanel` + `FilaEstado` | Panel con título y contador; filas de carga (`status`), vacío y error (`alert`) del mismo alto | No transformar tablas en tarjetas por defecto |
| `StatusBadge` | Estado con texto obligatorio, tono semántico e ícono decorativo opcional | El color nunca comunica solo |

**Base shadcn ajustada (global):**
- `ui/table`: encabezado `--table-head` con texto `text-soft` medium, separadores `--separator-soft`, hover `--card-hover` (teñido de marca) y encabezados de 44 px.
- `ui/dialog`: `surface-elevated`, con radio de 16 px.
- `ui/button`: variante `destructive-outline` (borde y texto `danger`) para acciones destructivas dentro de filas; la `destructive` llena queda para confirmaciones.
- **Sidebar (UIX-011):** componente `sidebar` de shadcn (`inset`, `icon`) con degradado `--sidebar-gradient`, ítems en píldora y activo unido a la vista con esquinas cóncavas; plegada, el activo es un círculo. Es oscura en ambos temas; el activo toma `--color-bg-canvas`. La copia local en `ui/sidebar.tsx` no usa cookie y `SidebarInset` es `div`, porque `AppLayout` ya tiene su `<main>`.
- **Layout:** `canvas-ambient` e `isolate`. Las capas decorativas del encabezado (foto y resplandor) usan `-z-10` sin contexto propio: se pintan sobre el canvas y **debajo de todo el contenido**, sin depender de que cada tarjeta sea `relative`.

### Foto del encabezado

- Archivo: `frontend/public/header-bosque.webp` (2172 × 724, 404 KB).
- Se extiende hasta el borde superior y derecho del área de contenido. El contenedor recorta lo que sobra con `overflow-x-clip`, sin scroll horizontal.
- Se funde con una **máscara de transparencia** hacia la izquierda y hacia abajo (utilidad `header-photo`), oscurecida con `brightness(.62)`. No se usa un velo de color: un velo del color del canvas dejaba un rectángulo visible sobre la luz ambiental (corrección del 2026-11-03).
- **En todas las vistas** (decisión del usuario del 2026-11-03): es el valor por defecto de `PageHeader`; `fondo={false}` la quita. **Termina con el encabezado**: la capa va de `-top-10` a `bottom-0` del header y nunca queda detrás de KPI, números ni tablas.
- **No se muestra ni se descarga en el celular** (< 640 px): la capa es `hidden sm:block`.
- **Fuera del precache de la PWA:** `globPatterns` no incluye `.webp`. Verificado en `dist/sw.js`.
- Si el archivo falta, el encabezado sigue funcionando.

## Tablas en el celular

`tabla-apilada` (clase en `<Table>`, CSS en `index.css`): por debajo de 640 px cada fila se apila y cada celda muestra su encabezado desde `data-label`. Un solo DOM, sin duplicar la tabla como tarjetas (los tests no ven elementos repetidos). Aplicada en Producción y Viajes, que se consultan desde el campo. Las celdas sin `data-label` (acciones, filas de estado) ocupan todo el ancho.

## Formato de cifras

Toneladas con `numero()` y lecturas con `lectura()` (`features/maintenance/formato.ts`: horas con 2 decimales, km enteros), siempre en es-AR, en las tablas de Producción, Viajes, Panel técnico y Lecturas.

## Vistas migradas

| Vista | Encabezado | Componentes |
|---|---|---|
| Inicio | `PageHeader` con foto; fecha y estado de actualización como acción | `KpiCard` por gravedad (crítico, atención, seguimiento, neutro), paneles `surface`, accesos `surface-interactive` |
| Producción | `PageHeader` con foto | `KpiCard`, `FilterPanel` con etiquetas, `TablaPanel`, `StatusBadge` de madera |
| Dashboard | `PageHeader` con foto | `KpiCard vertical` con ícono; alerta con ⚠ y tono atención |
| Viajes | `PageHeader` | `FilterPanel` (limpiable), tabla `surface` apilada en el celular (`tabla-apilada`), `StatusBadge` de validación |
| Correcciones | `PageHeader` | Tarjetas `surface`, `StatusBadge` de la solicitud |
| Lecturas, Panel técnico, Historial | `PageHeader` | Tablas `surface`, `StatusBadge` de matafuego (`TONO_MATAFUEGO`) |
| Reportes | `PageHeader` | Pestañas con la marca, filtros `surface-quiet`, `StatusBadge` en viajes |
| Integración | `PageHeader` | Paneles `surface`, `StatusBadge` de lote |
| Usuarios, Frentes, Maquinaria | `PageHeader` con acciones | `FilterPanel` (limpiable), tabla `surface`, `StatusBadge` activo/deshabilitado, `destructive-outline` |
| Formularios de campo (parte, viaje, lectura, matafuego) | `PageHeader` "Campo" sin foto, con el estado de conexión | Sin cambios en el formulario ni en la barra de envío: prioridad a la claridad |

Los textos de los h1, labels, botones y estados no cambiaron (los tests y E2E los usan). Cada mapa de estados (`ESTADOS`, `ESTADOS_LOTE`, solicitudes, matafuegos) suma su `tono`, sin perder el texto ni el símbolo.

## Piloto: Producción

`features/production/ProduccionPage.tsx` usa todos los componentes:
- `PageHeader` con la foto;
- tres `KpiCard` (partes = `meta.total`, toneladas y frentes = `resumen` del backend, siempre sobre todo el filtro y con m³ aparte);
- `FilterPanel` con los seis filtros sincronizados con la URL;
- `TablaPanel` con `StatusBadge` pulpable y aserrable.

La funcionalidad y los nombres accesibles son los mismos que antes.

## Capturas

Son del sistema real (dev server, usuario de demo Ana): Login, Inicio, Producción y Viajes a 1440, 1024, 768 y 390 px, y el resto de las vistas a 1440 px (solo en `despues/`). Carpetas: `docs/forest-depth/capturas/antes/` y `docs/forest-depth/capturas/despues/`.

Se regeneran con `node scripts/capturas-forest-depth.mjs <carpeta>` desde `frontend/`, con el front y el back levantados.

## Verificación

- Vitest 93/93, typecheck, lint y build.
- Playwright 45/45, con axe sin violaciones graves en todas las rutas, y offline 2/2.
- Precache: de 1284 a 1309 KiB (+25 KiB de CSS y componentes). La foto queda afuera.
- Sin scroll horizontal de página en las vistas revisadas (1440 y 390 px).

## Componentes de shadcn (UIX-011 a UIX-013)

Antes de crear un componente de UI se revisa el [catálogo](https://ui.shadcn.com/docs/components), versión Radix.

| Se usa | Dónde |
|---|---|
| Sidebar, Sheet, Tooltip | `app/Sidebar.tsx`, `app/AppLayout.tsx` |
| Native Select | formularios; es nativo para que rinda mejor en el celular |
| Textarea, Checkbox, Tabs | formularios y Reportes |
| Radio Group | `OpcionesRadio` |
| Alert Dialog | confirmación destructiva al salir |
| Popover + Command | `FiltroAutocompletable`, que sigue recibiendo `<option>` |
| Field | `Campo` y errores de campo (`FieldError`) |
| Alert | avisos de error y advertencia |
| Spinner | `Cargando` |
| Badge | `StatusBadge` |

**Decidido no usar:**
- **Combobox del catálogo:** agrega `@base-ui/react`, una segunda librería de primitivas.
- **Data Table:** la paginación es del backend y `tabla-apilada` ya resuelve el celular.
- **Date Picker:** en campo es mejor el nativo.
- **Pagination:** orientado a enlaces numerados; `Paginacion` es Anterior/Siguiente.
- **Card:** `surface` ya es el sistema de capas.
- **Skeleton:** se quitó porque no tenía usos.

**Al instalar:** la CLI quiere sobrescribir `button.tsx`, `dialog.tsx` y otros archivos personalizados, y agrega tokens a `index.css`. Hay que revertir eso después de instalar.

## Pendientes

1. **Optimizar `header-bosque.webp`:** por ejemplo a 1600 px de ancho con calidad 70 (≈ 120–150 KB). No se tocó porque es un asset del usuario.
2. **Tema claro:** activo desde UIX-014, con botón en la sidebar. Sigue sin foto de encabezado (ver `.header-photo` en `index.css`).
3. **Diálogos y formularios internos** (alta de usuario, unidad, remito, corrección): heredan el nivel elevado y los bordes, pero sus selects siguen con `h-9`. Unificar con `controlSelect` si se quiere el mismo alto.
4. **Tablas anchas** (Viajes con la columna Acciones): se desplazan dentro de su panel en pantallas angostas. Evaluar una vista compacta en celular si el uso en campo lo pide.
5. **React Bits** (CountUp, SpotlightCard, etc.): sigue sin instalar. Evaluarlo solo para el Dashboard, si aporta.
