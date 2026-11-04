# Forest Depth — lenguaje visual de INDUFOR

> Evolución visual de la interfaz existente (2026-11-03). **No cambia** reglas de negocio, endpoints, permisos, base de datos ni arquitectura.
> Fuente de verdad de color: `docs/design-tokens.md` (tema oscuro "bosque", que se conserva). Este documento agrega la capa de profundidad y los componentes compartidos.
> Estado: **Fase 1 (fundamentos) y piloto Producción hechos.** El resto de los módulos se migra por fases (ver al final).

## Principios

- La profundidad sale de la luminosidad, los niveles de superficie, los bordes discretos y la tipografía; no de neones, glow permanente ni vidrio.
- Se tiene que ver bien sin animaciones. Las transiciones son de 150 ms, solo de color, borde y fondo, y se anulan con `prefers-reduced-motion`.
- La luz es ambiental: un verde muy tenue en el canvas y detrás de los encabezados. **Nunca** detrás de números, formularios ni tablas.
- El color semántico (éxito, atención, peligro, maderas, validación) conserva su significado y siempre va acompañado de texto.
- En el campo manda la claridad: las pantallas de carga no llevan foto ni efectos, solo superficies y tablas.

## Niveles

| Nivel | Qué es | Cómo se logra |
|---|---|---|
| 1 · Canvas | Fondo de la app | `canvas-ambient`: `bg-canvas` y un radial de marca de 4–7 % arriba a la izquierda |
| 2 · Surface | Tarjetas, paneles, filtros, tablas | `surface`: `bg-surface`, degradado vertical de +2,5 % de luz, borde `border-default` y radio de 16 px |
| 3 · Elevated | Diálogos, menús, popovers | `surface-elevated`: `bg-elevated`, borde y `--shadow-elevated` (sombra larga y suave, no negra dura) |

## Tokens complementarios

Están en `frontend/src/index.css`. Todos se derivan de los tokens existentes con `color-mix()`: no hay hex nuevos. Los porcentajes cambian por tema (`--depth-*` en `:root` y en `[data-theme="light"]`).

| Token | Uso |
|---|---|
| `--surface-gradient` | Relleno de nivel 2 |
| `--canvas-ambient` | Luz radial del canvas |
| `--header-glow` | Luz detrás del encabezado sin foto |
| `--header-photo-veil` | Velo de la foto del encabezado: el texto queda sobre canvas casi sólido |
| `--border-highlight` | Borde de superficie destacada, hover de tarjeta o etiqueta de filtro |
| `--icon-surface` | Fondo del recuadro de íconos (utilidad `icon-surface`) |
| `--card-hover` | Superficie al hover de tarjetas interactivas (`surface-interactive`) |
| `--separator-soft` | Separadores de tablas |
| `--shadow-elevated` | Sombra del nivel 3 |
| `--transition-surface` | `150ms ease-out` |

- **Navegadores sin `color-mix()`:** un bloque `@supports not` cae a superficies planas, sin luz, y el velo tapa la foto por completo. Sin ese bloque, el build dejaría el verde de marca puro.
- **Color de borde base:** Tailwind 4 usa `currentColor` como borde por defecto. Por eso `@layer base` fija `border-default` para todo `border` suelto. Esto corrige las líneas blancas de tablas y diálogos en el tema oscuro.

## Tipografía (Inter)

| Uso | Tamaño | Peso |
|---|---|---|
| Título de página (h1) | 30 → 32 px (`text-3xl sm:text-[2rem]`) | bold, `tracking-tight` |
| Eyebrow / breadcrumb | 12 px, `tracking-[0.18em]`, mayúsculas cortas | semibold, `text-brand` |
| Título de sección (h2) | 18 px (`text-lg`) | semibold |
| Título de tarjeta | 14 px | medium |
| Texto de interfaz | 14–16 px | regular |
| Metadatos | 12–14 px, `text-soft` (≥ 4,5:1) | regular |
| Número de KPI | 20 → 24 → 30 px según el ancho | bold, `tabular-nums`, sin corte de línea |

Las cifras de producción, consumos y lecturas van siempre con `tabular-nums`, alineadas a la derecha en las tablas y en formato es-AR (`numero()` de `features/reports/formato.ts`).

## Componentes compartidos (`frontend/src/shared/components/`)

| Componente | Para qué | Cuándo **no** |
|---|---|---|
| `PageHeader` | Eyebrow, h1, descripción, acción principal y contexto (`children`). `fondo` opcional para la variante forestal | No poner una foto en pantallas de campo ni en formularios |
| `KpiCard` | Ícono, título, número protagonista y detalle. `to` la vuelve enlace con hover y foco. `tono` es `neutro` por defecto | No convertir todo KPI en alerta: el `tono` semántico va solo cuando el dato lo amerita |
| `FilterPanel` + `controlSelect` | Panel de filtros con etiquetas removibles y "Limpiar filtros". Grilla de 2, 3 y 6 columnas | Para formularios de carga no: es para consultar |
| `TablaPanel` + `FilaEstado` | Panel con título y contador; filas de carga (`status`), vacío y error (`alert`) del mismo alto | No transformar tablas en tarjetas por defecto |
| `StatusBadge` | Estado con texto obligatorio, tono semántico e ícono decorativo opcional | El color nunca comunica solo |

**Base shadcn ajustada (global):**
- `ui/table`: encabezado `bg-secondary`, separadores `--separator-soft`, hover `bg-secondary/60` y encabezados semibold de 44 px.
- `ui/dialog`: `surface-elevated`, con radio de 16 px.
- **Sidebar:** el activo lleva `bg-brand/12` y una barra de marca de 3 px. La sesión muestra la inicial en un círculo. La navegación, los permisos, el plegado y el menú móvil no cambiaron.
- **Layout:** `canvas-ambient`.

### Foto del encabezado

- Archivo: `frontend/public/header-bosque.webp` (2172 × 724, 404 KB).
- Va a la derecha, con el velo hacia el canvas a la izquierda y abajo.
- **No se muestra ni se descarga en el celular** (< 640 px): la capa es `hidden sm:block`.
- **Fuera del precache de la PWA:** `globPatterns` no incluye `.webp`. Verificado en `dist/sw.js`.
- Si el archivo falta, el encabezado sigue funcionando.

## Piloto: Producción

`features/production/ProduccionPage.tsx` usa todos los componentes:
- `PageHeader` con la foto;
- tres `KpiCard` (partes = `meta.total`, toneladas y frentes = `resumen` del backend, siempre sobre todo el filtro y con m³ aparte);
- `FilterPanel` con los seis filtros sincronizados con la URL;
- `TablaPanel` con `StatusBadge` pulpable y aserrable.

La funcionalidad y los nombres accesibles son los mismos que antes.

## Capturas

Son del sistema real (dev server, usuario de demo Ana) a 1440, 1024, 768 y 390 px: `docs/forest-depth/capturas/antes/` y `docs/forest-depth/capturas/despues/`.

Se regeneran con `node scripts/capturas-forest-depth.mjs <carpeta>` desde `frontend/`, con el front y el back levantados.

## Verificación de esta fase

- Vitest 93/93, typecheck, lint y build.
- Playwright 45/45, con axe sin violaciones graves en todas las rutas, y offline 2/2.
- Precache: de 1284 a 1308 KiB (+24 KiB de CSS y componentes). La foto queda afuera.

## Pendientes y orden de migración

1. **Inicio:** pasar `Tarjeta` a `KpiCard` y el encabezado a `PageHeader` (foto opcional). Corregir las flechas de "Acciones frecuentes", que se salen de su tarjeta.
2. **Viajes y Correcciones:** `ESTADOS` y `ESTADO_SOLICITUD` a `StatusBadge` (pendiente, validado, corrección); filtros a `FilterPanel` y tablas a `TablaPanel`.
3. **Lecturas y Mantenimiento:** fallas, matafuegos (vencido o atendido) e historial con `StatusBadge` y `TablaPanel`. Los formularios de campo solo reciben superficies.
4. **Dashboard y Reportes:** `KpiCard` y `PageHeader` con foto opcional; `ESTADOS_LOTE` a `StatusBadge`.
5. **Integración, Maquinaria, Frentes y Usuarios:** encabezados (15 h1 todavía con `text-2xl font-semibold`), paneles, selects con `controlSelect` (10 todavía con `h-9`) y errores (13 con `<p role="alert">` sueltos).
6. **Botón destructivo:** en tablas con muchas filas (Usuarios) el bloque salmón lleno se ve pesado. Evaluar una variante de contorno para las acciones destructivas en filas, conservando el contraste.
7. **Optimizar `header-bosque.webp`:** por ejemplo a 1600 px de ancho con calidad 70 (≈ 120–150 KB). No se tocó porque es un asset del usuario.
8. **React Bits** (CountUp, SpotlightCard, etc.): sigue sin instalar. Evaluarlo solo para el Dashboard, si aporta.
