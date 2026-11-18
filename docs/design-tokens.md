# Design tokens — INDUFOR

Identidad UIX-034, aprobada el 2026-11-13: arena `#EAE4D3`, verde `#2E4236` y petróleo `#38646D`. Reemplaza la paleta teal de UIX-017. La implementación está en `frontend/src/index.css`. Oscuro es el tema predeterminado; `data-theme="light"` activa el claro.

## Paleta semántica

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `bg-canvas` | `#EAE4D3` | `#161F1B` | Fondo de la aplicación |
| `bg-surface` | `#F5F2E9` | `#202C25` | Tarjetas, formularios y tablas |
| `bg-elevated` | `#F8F6F0` | `#2E4236` | Diálogos y menús |
| `bg-subtle` | `#DCE7DE` | `#2E4236` | Superficies secundarias |
| `text-primary` | `#2E4236` | `#EAE4D3` | Texto principal |
| `text-secondary`, `text-muted` | `#516458` | `#B8C9BD` | Texto de apoyo |
| `text-inverse` | `#FFFFFF` | `#17201B` | Texto sobre estado destructivo |
| `border-default` | `#D8D0BA` | `#40594A` | Separadores decorativos |
| `border-strong` | `#6C8273` | `#869D8D` | Bordes de controles |
| `brand` | `#2E4236` | `#A9C4AF` | Marca y navegación |
| `action-primary` / `hover` / `text` | `#2E4236` / `#40594A` / `#FFFFFF` | `#A9C4AF` / `#BDD4C1` / `#17201B` | Acción primaria |
| `focus-ring`, `link` | `#38646D` | `#9BC3C6` | Foco y enlaces |
| `state-success` | `#13753A` | `#4ADE80` | Confirmado / validado |
| `state-warning` | `#A34A08` | `#FBBF24` | Atención / pendiente |
| `state-danger` | `#B91C1C` | `#FF9090` | Error, rechazo, acción destructiva |
| `state-info` | `#1D5FA8` | `#7DB4F2` | Información |
| `production-pulpable` / `aserrable` | `#5A7417` / `#8F4F12` | `#AECB5C` / `#E3A15C` | Maderas |
| `chart-pulpable` / `aserrable` | `#2A78D6` / `#D95525` | `#3987E5` / `#D95926` | Series en gráficos |
| `validation-pending` / `approved` / `correction` | warning / success / danger | warning / success / danger | Estados del viaje |

El verde de éxito y el ámbar de atención se oscurecieron en claro, el rojo se aclaró en oscuro y el borde de control se oscureció en claro para mantener contraste sobre los nuevos fondos. Los estados mantienen texto o icono. En gráficos se conserva el par azul/naranja y su leyenda; se oscureció el naranja claro por contraste. En UIX-021 el par verde/marrón de producción se confundía en deutan. Simulación repetida el 2026-11-13 (CDP `setEmulatedVisionDeficiency`, gráfico de Inicio, ambos temas): azul/naranja se distingue en deuteranopía, protanopía y tritanopía; en acromatopsia las dos series quedan grises con igual luminancia y se distinguen por la leyenda, el tooltip y el orden fijo de las barras.

Tintes de estado en claro (fondo / borde): éxito `#DCFCE7` / `#BBF7D0`, alerta `#FEF3C7` / `#FDE68A`, error `#FEE2E2` / `#FECACA`.

Variaciones: arena `#F8F6F0`, `#F5F2E9`, `#EAE4D3`, `#D8D0BA`; verde `#DCE7DE`, `#A9C4AF`, `#40594A`, `#2E4236`, `#202C25`, `#161F1B`; petróleo `#DCEAEC`, `#9BC3C6`, `#38646D`, `#182B2E`.

## Mapeo y tipografía

Tailwind y shadcn consumen los alias semánticos de `@theme inline`; los efectos de profundidad y sus alternativas sin `color-mix()` están descritos en [Forest Depth](forest-depth.md).

Plus Jakarta Sans es la única familia para cuerpo, títulos, navegación, controles, cifras y códigos. Las cifras tabulares conservan `font-variant-numeric: tabular-nums`. Se distribuye como WOFF2 local con `font-display: swap`, alternativas de sistema y licencia OFL en `frontend/public/font-licenses/`. La verificación PWA comprueba que esté en el precache.

Mantener texto normal ≥ 4,5:1 y bordes de controles y foco ≥ 3:1 sobre los fondos correspondientes. `forestDepthTokens.test.ts` verifica pares sólidos; no acredita el contraste sobre transparencias ni píxeles reales.

## Fondo Grainient y sidebar

Grainient conserva la animación en escritorio y queda fijo en celular. Los colores están en `frontend/src/app/FondoGrainient.tsx`: oscuro `#161F1B`, `#19231E`, `#1C2720`; claro `#EAE4D3`, `#EEE9DB`, `#F1EDE2`. En capturas Chromium de Inicio a 1440 px, con movimiento reducido y datos simulados, se midió la zona de fondo libre de contenido: el peor píxel respecto del texto secundario dio 4,71:1 en claro y 8,43:1 en oscuro. Con la animación (2026-11-13, GPU real, sin movimiento reducido, 12 cuadros en 18 s, contenido oculto) el peor píxel dio 4,72:1 para el texto secundario y tenue en claro y 8,24:1 en oscuro.

Los tintes de estado translúcidos sobre el Grainient no son pares sólidos: la tarjeta de alerta del resumen de la quincena apoya su tinte sobre `bg-surface` porque `bg-warning/10` directo sobre el arena dejaba `text-soft` en 4,39:1.

La sidebar usa `#2E4236` en ambos temas: con blanco en claro y con arena en oscuro. Tiene que diferir del canvas, porque la pestaña activa toma `--color-bg-canvas`; con `#161F1B` en oscuro era igual al canvas y el activo desaparecía. `forestDepthTokens.test.ts` lo verifica. Conserva las píldoras translúcidas `--sidebar-pill`, `--sidebar-pill-hover` y `--sidebar-pill-sombra`.
