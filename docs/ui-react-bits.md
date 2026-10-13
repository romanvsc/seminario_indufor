# React Bits en INDUFOR

> Estilo: **sobrio con acentos**. La app es una herramienta de trabajo; React Bits aporta detalles en login, dashboard y estados vacíos.
> Reglas de uso: `Context.md` §3 (Componentes base y React Bits) y skill `indufor-react-frontend`.
> Dependencias verificadas en el registro de React Bits (`https://reactbits.dev/r/<Componente>-TS-TW.json`) el 2026-10-12.

## Componentes elegidos

| Componente | Dónde | Dependencias | Por qué |
|---|---|---|---|
| **DotGrid** (fondo) | Login | ninguna (canvas 2D) | Textura sutil con el verde de marca; sin WebGL. |
| **ShinyText** | Título del login ("INDUFOR · Gestión forestal") | ninguna | Brillo leve sobre el nombre; único acento de texto. |
| **CountUp** | KPIs del dashboard gerencial (toneladas quincenales, viajes validados, consumos) | `motion` | Hace visible el cambio de los totales. El valor final queda accesible al lector de pantalla. |
| **SpotlightCard** | Tarjetas de KPI y accesos del dashboard | ninguna | Reacción al cursor; en táctil queda como tarjeta normal. |
| **BlurText** | Encabezado del dashboard y estados vacíos | `motion` | Entrada suave del texto; reusa `motion`, no suma otra librería. |

Dependencias nuevas en total: **solo `motion`**. Se descartan FadeContent y AnimatedContent porque requieren `gsap`. Para aparecer contenido se usa `motion` o una transición CSS.

## Instalación (Fase 1)

```bash
npx shadcn@latest add @react-bits/DotGrid-TS-TW
npx shadcn@latest add @react-bits/ShinyText-TS-TW
npx shadcn@latest add @react-bits/CountUp-TS-TW
npx shadcn@latest add @react-bits/SpotlightCard-TS-TW
npx shadcn@latest add @react-bits/BlurText-TS-TW
```

Variante **TS-TW** (TypeScript + Tailwind), coherente con el stack.

## Al incorporar cada componente

1. Reemplazar los colores fijos por tokens (`docs/design-tokens.md`); por ejemplo, el color de puntos de DotGrid pasa a `--color-brand` con baja opacidad.
2. Verificar `prefers-reduced-motion`: los cinco lo respetan; cubrirlo con un test.
3. Cargar DotGrid de forma diferida (lazy) para no sumar peso al precache de la PWA.
4. Nada de esto entra en pantallas de campo: producción, viajes, lecturas y matafuegos.

## Descartados para v1

- Fondos WebGL (Silk, Aurora, Galaxy, Liquid Ether, etc.): dependen de `ogl` o `three`, pesan y consumen batería.
- Cursores y efectos de puntero (Splash Cursor, Ghost Cursor, etc.): no aportan a una herramienta de trabajo y no funcionan en táctil.
- Menús animados (Staggered Menu, Gooey Nav, etc.): la navegación se resuelve con shadcn/ui, accesible por teclado.
