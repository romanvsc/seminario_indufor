# Design tokens — INDUFOR

Fuente de marca: `indufor_logo.jpg`. La evolución Forest Depth Tactical fue aprobada el 2026-11-04. La implementación efectiva está en `frontend/src/index.css`: los componentes consumen tokens semánticos. El tema oscuro es el predeterminado; `data-theme="light"` activa el claro.

## Paleta semántica

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `bg-canvas` | `#F5F7F5` | `#03170F` | Fondo de la aplicación |
| `bg-surface` | `#FFFFFF` | `#0A1F17` | Tarjetas, formularios y tablas |
| `bg-elevated` | `#FFFFFF` | `#132C21` | Diálogos y menús |
| `bg-subtle` | `#E9F2EC` | `#163629` | Filas destacadas y contenedores secundarios |
| `text-primary` | `#262524` | `#F8FAFC` | Texto principal |
| `text-secondary` | `#4A524D` | `#B7C3C8` | Texto de apoyo |
| `text-muted` | `#5F6863` | `#A2B0B8` | Ayudas y metadatos |
| `text-inverse` | `#FFFFFF` | `#07130D` | Texto sobre algunos estados sólidos |
| `border-default` | `#D3DCD6` | `#1B3B2E` | Separadores decorativos |
| `border-strong` | `#7D8A82` | `#587262` | Bordes de controles |
| `brand` | `#087856` | `#10B981` | Marca, navegación y acentos esmeralda |
| `action-primary` | `#047857` | `#047857` | Acción principal verde |
| `action-primary-hover` | `#065F46` | `#065F46` | Hover de acción principal |
| `action-primary-text` | `#FFFFFF` | `#FFFFFF` | Texto de acción principal |
| `focus-ring` | `#047857` | `#34D399` | Foco visible |
| `state-success` | `#13753A` | `#34D399` | Estado correcto o confirmado |
| `state-warning` | `#935600` | `#F59E0B` | Atención o pendiente; ámbar como acento |
| `state-danger` | `#B42318` | `#F87171` | Error o rechazo |
| `state-info` | `#1D5FA8` | `#7DB4F2` | Información |
| `production-pulpable` | `#5A7417` | `#AECB5C` | Madera pulpable |
| `production-aserrable` | `#8F4F12` | `#E3A15C` | Madera aserrable |
| `validation-pending` | `#935600` | `#F59E0B` | Viaje pendiente |
| `validation-approved` | `#13753A` | `#34D399` | Viaje validado |
| `validation-correction` | `#B42318` | `#F87171` | Corrección solicitada |

El ámbar no se usa para acciones principales. Los estados siempre llevan texto o icono. El gris `#64748B` propuesto para metadatos se aclaró a `#A2B0B8` en oscuro: el original no alcanza 4,5:1 sobre la superficie. Los bordes de controles y el foco se distinguen de los separadores decorativos.

## Mapeo y profundidad

Tailwind y shadcn consumen los alias de `@theme inline`: `primary` y `primary-foreground` usan los tokens de acción; `secondary`, `muted`, `accent`, `border`, `input`, `ring` y los tonos de estado se resuelven desde sus roles semánticos. `destructive-foreground` usa `text-inverse`, no el texto de la acción principal.

Los niveles y efectos complementarios se derivan de estos tokens mediante `color-mix()` con una alternativa de superficies planas para navegadores sin soporte. Su aplicación está descrita en [Forest Depth](forest-depth.md).

## Tipografía y distribución

- **Space Grotesk:** títulos y navegación; personalidad técnica sin alterar la composición.
- **Plus Jakarta Sans:** cuerpo, etiquetas y controles; base de 16 px, con tamaños de campo y objetivos táctiles existentes.
- **JetBrains Mono:** valores tabulares y códigos operativos; `tabular-nums` conserva la alineación de cifras.
- Las tres familias se distribuyen como WOFF2 locales, con `font-display: swap` y alternativas de sistema. Se usa el subconjunto latino y pesos variables; el build incluye los archivos en el precache para usos posteriores sin conexión.
- Las licencias SIL Open Font License 1.1 se conservan en `frontend/public/font-licenses/`; las dependencias `@fontsource-variable/*` fijan el origen y versión en el lockfile.

Mantener texto normal ≥ 4,5:1, y bordes de controles y foco ≥ 3:1 en los dos temas. Los tests de `forestDepthTokens.test.ts` miden pares base; los estados translúcidos y los fondos reales requieren además revisión en navegador. Las comprobaciones no sustituyen una revisión en un dispositivo físico.
