# Design tokens — INDUFOR

> Fuente de marca: `indufor_logo.jpg`. Verde del árbol `#0B8645`; gris del texto "servicios forestales" `#262524`.
> Regla (`Context.md` §3): los componentes consumen estos tokens; no se usan colores Tailwind sueltos para comunicar significado.
> **Tema por defecto: oscuro "bosque"** (decisión del usuario, 2026-11-03), en `:root`; el claro queda con `data-theme="light"`.
> Contraste verificado (WCAG 2.1 AA) con script: texto ≥ 4.5:1 sobre todos los fondos, bordes fuertes y foco ≥ 3:1, en claro y oscuro.

## Paleta semántica

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `bg-canvas` | `#F5F7F5` | `#07130D` | Fondo de la app |
| `bg-surface` | `#FFFFFF` | `#0D1C14` | Tarjetas, formularios, tablas |
| `bg-elevated` | `#FFFFFF` | `#12251A` | Diálogos, menús |
| `bg-subtle` | `#E9F2EC` | `#163021` | Filas destacadas, chips |
| `text-primary` | `#262524` | `#ECF3EE` | Texto principal |
| `text-secondary` | `#4A524D` | `#B5C4BA` | Texto de apoyo |
| `text-muted` | `#5F6863` | `#94A69B` | Ayudas, metadatos |
| `text-inverse` | `#FFFFFF` | `#07130D` | Texto sobre colores llenos |
| `border-default` | `#D3DCD6` | `#1F3529` | Separadores |
| `border-strong` | `#7D8A82` | `#4E6658` | Bordes de inputs |
| `brand` | `#0B8645` | `#34C46E` | Logo, acentos de marca |
| `action-primary` | `#0A7A3E` | `#15803D` | Botón principal |
| `action-primary-hover` | `#086132` | `#166534` | Hover/pressed |
| `action-primary-text` | `#FFFFFF` | `#FFFFFF` | Texto del botón principal |
| `focus-ring` | `#0A7A3E` | `#4ADE80` | Anillo de foco visible |
| `state-success` | `#13753A` | `#4ADE80` | Guardado / sincronizado |
| `state-warning` | `#9A5B00` | `#F5B544` | Pendiente / atención |
| `state-danger` | `#B42318` | `#F87171` | Error / rechazo |
| `state-info` | `#1D5FA8` | `#7DB4F2` | Información |
| `production-pulpable` | `#5A7417` | `#AECB5C` | Madera pulpable (oliva) |
| `production-aserrable` | `#8F4F12` | `#E3A15C` | Madera aserrable (madera) |
| `validation-pending` | `#9A5B00` | `#F5B544` | Viaje `PENDIENTE` |
| `validation-approved` | `#13753A` | `#4ADE80` | Viaje `VALIDADO` |
| `validation-correction` | `#B42318` | `#F87171` | `CORRECCION_SOLICITADA` |

El botón principal usa `#0A7A3E` y no el verde exacto del logo (`#0B8645`, 4.66:1 con blanco), para tener margen en pantallas al sol.

Los estados nunca se comunican solo con color: siempre llevan texto o ícono (`indufor-field-mobile-ux`).

## CSS

```css
:root {
  --color-bg-canvas: #F5F7F5;   --color-bg-surface: #FFFFFF;   --color-bg-elevated: #FFFFFF;   --color-bg-subtle: #E9F2EC;
  --color-text-primary: #262524; --color-text-secondary: #4A524D; --color-text-muted: #5F6863; --color-text-inverse: #FFFFFF;
  --color-border-default: #D3DCD6; --color-border-strong: #7D8A82;
  --color-brand: #0B8645;
  --color-action-primary: #0A7A3E; --color-action-primary-hover: #086132; --color-action-primary-text: #FFFFFF;
  --color-focus-ring: #0A7A3E;
  --color-state-success: #13753A; --color-state-warning: #9A5B00; --color-state-danger: #B42318; --color-state-info: #1D5FA8;
  --color-production-pulpable: #5A7417; --color-production-aserrable: #8F4F12;
  --color-validation-pending: #9A5B00; --color-validation-approved: #13753A; --color-validation-correction: #B42318;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* mismos valores que [data-theme="dark"] */ }
}

:root[data-theme="dark"] {
  --color-bg-canvas: #0F1411;   --color-bg-surface: #161D18;   --color-bg-elevated: #1E2721;   --color-bg-subtle: #1A2A20;
  --color-text-primary: #E8EEEA; --color-text-secondary: #B7C2BB; --color-text-muted: #94A19A; --color-text-inverse: #0F1411;
  --color-border-default: #2C3830; --color-border-strong: #66756C;
  --color-brand: #3DAF6B;
  --color-action-primary: #3DAF6B; --color-action-primary-hover: #55C182; --color-action-primary-text: #0F1411;
  --color-focus-ring: #55C182;
  --color-state-success: #5CC985; --color-state-warning: #F0B54A; --color-state-danger: #F2877C; --color-state-info: #7DB4F2;
  --color-production-pulpable: #AECB5C; --color-production-aserrable: #E3A15C;
  --color-validation-pending: #F0B54A; --color-validation-approved: #5CC985; --color-validation-correction: #F2877C;
}
```

En Fase 1 el bloque oscuro se escribe una sola vez y se aplica a los dos selectores.

## Mapeo a Tailwind (v4, `@theme inline`) y shadcn/ui

| shadcn / Tailwind | Token |
|---|---|
| `--background` | `--color-bg-canvas` |
| `--foreground` | `--color-text-primary` |
| `--card`, `--popover` | `--color-bg-surface`, `--color-bg-elevated` |
| `--primary` / `--primary-foreground` | `--color-action-primary` / `--color-action-primary-text` |
| `--muted` / `--muted-foreground` | `--color-bg-subtle` / `--color-text-muted` |
| `--border`, `--input` | `--color-border-default`, `--color-border-strong` |
| `--ring` | `--color-focus-ring` |
| `--destructive` / `--destructive-foreground` | `--color-state-danger` / `--color-text-inverse` (nunca `text-white`: en oscuro el rojo es claro y el texto va oscuro, 6,85:1) |

Clases de dominio: `bg-production-pulpable`, `text-validation-pending`, etc., generadas desde los tokens.

## Tokens de profundidad (Forest Depth)

Capa complementaria derivada de los tokens de arriba con `color-mix()`, en los dos temas: superficies (`--surface-gradient`), luz ambiental (`--canvas-ambient`, `--header-glow`), velo de la foto del encabezado, borde destacado, fondo de íconos, hover de tarjeta, separadores suaves y sombra del nivel elevado. No agrega hex nuevos. Detalle, utilidades (`surface`, `surface-elevated`, `canvas-ambient`, `icon-surface`) y reglas de uso en [`forest-depth.md`](forest-depth.md).

## Tipografía y forma

- Fuente: **Inter** (variable, con buen soporte de tildes y números tabulares para toneladas y lecturas). Alternativa del sistema: `system-ui`.
- Base 16 px (evita el zoom de iOS en inputs); en pantallas de campo, inputs de 18 px y objetivos táctiles ≥ 44 px.
- Cifras con `font-variant-numeric: tabular-nums` en tablas y KPIs.
- Radio 8 px en tarjetas y 6 px en inputs; sombras mínimas (la jerarquía la dan fondo y borde).
