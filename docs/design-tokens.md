# Design tokens — INDUFOR

> Fuente de marca: `indufor_logo.jpg`. Verde del árbol `#0B8645`; gris del texto "servicios forestales" `#262524`.
> Regla (`Context.md` §3): los componentes consumen estos tokens; no se usan colores Tailwind sueltos para comunicar significado.
> Contraste verificado (WCAG 2.1 AA) con script: texto ≥ 4.5:1 sobre todos los fondos, bordes fuertes y foco ≥ 3:1, en claro y oscuro.

## Paleta semántica

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `bg-canvas` | `#F5F7F5` | `#0F1411` | Fondo de la app |
| `bg-surface` | `#FFFFFF` | `#161D18` | Tarjetas, formularios, tablas |
| `bg-elevated` | `#FFFFFF` | `#1E2721` | Diálogos, menús |
| `bg-subtle` | `#E9F2EC` | `#1A2A20` | Filas destacadas, chips |
| `text-primary` | `#262524` | `#E8EEEA` | Texto principal |
| `text-secondary` | `#4A524D` | `#B7C2BB` | Texto de apoyo |
| `text-muted` | `#5F6863` | `#94A19A` | Ayudas, metadatos |
| `text-inverse` | `#FFFFFF` | `#0F1411` | Texto sobre colores llenos |
| `border-default` | `#D3DCD6` | `#2C3830` | Separadores |
| `border-strong` | `#7D8A82` | `#66756C` | Bordes de inputs |
| `brand` | `#0B8645` | `#3DAF6B` | Logo, acentos de marca |
| `action-primary` | `#0A7A3E` | `#3DAF6B` | Botón principal |
| `action-primary-hover` | `#086132` | `#55C182` | Hover/pressed |
| `action-primary-text` | `#FFFFFF` | `#0F1411` | Texto del botón principal |
| `focus-ring` | `#0A7A3E` | `#55C182` | Anillo de foco visible |
| `state-success` | `#13753A` | `#5CC985` | Guardado / sincronizado |
| `state-warning` | `#9A5B00` | `#F0B54A` | Pendiente / atención |
| `state-danger` | `#B42318` | `#F2877C` | Error / rechazo |
| `state-info` | `#1D5FA8` | `#7DB4F2` | Información |
| `production-pulpable` | `#5A7417` | `#AECB5C` | Madera pulpable (oliva) |
| `production-aserrable` | `#8F4F12` | `#E3A15C` | Madera aserrable (madera) |
| `validation-pending` | `#9A5B00` | `#F0B54A` | Viaje `PENDIENTE` |
| `validation-approved` | `#13753A` | `#5CC985` | Viaje `VALIDADO` |
| `validation-correction` | `#B42318` | `#F2877C` | `CORRECCION_SOLICITADA` |

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
| `--destructive` | `--color-state-danger` |

Clases de dominio: `bg-production-pulpable`, `text-validation-pending`, etc., generadas desde los tokens.

## Tipografía y forma

- Fuente: **Inter** (variable, con buen soporte de tildes y números tabulares para toneladas y lecturas). Alternativa del sistema: `system-ui`.
- Base 16 px (evita el zoom de iOS en inputs); en pantallas de campo, inputs de 18 px y objetivos táctiles ≥ 44 px.
- Cifras con `font-variant-numeric: tabular-nums` en tablas y KPIs.
- Radio 8 px en tarjetas y 6 px en inputs; sombras mínimas (la jerarquía la dan fondo y borde).
