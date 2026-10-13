---
name: indufor-react-frontend
description: Arquitectura del frontend React de INDUFOR - SPA en React + TypeScript + Vite organizada por features, React Router, TanStack Query, React Hook Form + Zod, cliente HTTP con Sanctum, Tailwind con design tokens semánticos, shadcn/ui como base, React Bits solo como acento visual, y PWA con vite-plugin-pwa (manifest, Service Worker, cache, actualización, online/offline). Úsala siempre que se cree o modifique código TSX/TS, componentes, rutas, hooks, estilos, configuración de Vite/Tailwind o del Service Worker, o cuando se quiera agregar un componente de reactbits.dev o una librería de UI.
---

# Frontend React de INDUFOR

El frontend tiene dos públicos opuestos: el operario en el monte con un celular y mala señal, y Gerencia frente a un dashboard. La arquitectura separa por features para que cada contexto evolucione solo, y trata la red como poco confiable por defecto.

Fuentes: `Context.md` §3 (Frontend, PWA, UI, React Bits), §18 · skills `indufor-field-mobile-ux` y `ui-ux-pro-max`.

## Estructura

```text
src/
├── app/            # providers (QueryClient, Router), layout, arranque de la PWA
├── router/         # rutas y guards (solo cosméticos; la seguridad está en el backend)
├── shared/
│   ├── api/        # cliente HTTP único (credenciales, CSRF, errores normalizados)
│   ├── components/ # wrappers de shadcn/ui y componentes propios
│   ├── design-system/ # tokens CSS y configuración de Tailwind
│   ├── hooks/
│   ├── utils/
│   └── types/
└── features/<feature>/   # auth, production, logistics, maintenance, reports, ...
    ├── pages/ components/ api/ hooks/ schemas/ types/ __tests__/
```

Una feature no importa archivos internos de otra; lo compartido va a `shared/`.

## Convenciones

- **TypeScript `strict`**, sin `any` implícito. Los tipos de respuesta de la API viven en `features/<x>/types`.
- **Datos del servidor con TanStack Query**: una query key por recurso y filtro, invalidación después de cada mutación. No copiar datos del servidor a Zustand.
- **Zustand** solo para estado de cliente: cola de envíos pendientes, preferencias, estado online.
- **Formularios con React Hook Form + Zod.** El esquema Zod refleja las reglas del backend para dar aviso temprano, pero el backend decide.
- **Cliente HTTP:** `credentials: 'include'`, primero `GET /sanctum/csrf-cookie`, manejo central de 401 (redirige al login) y 419 (renueva el CSRF), y mapeo del formato de error `{ error: { code, message, details } }`.
- **Permisos en UI:** ocultar acciones sin permiso mejora la experiencia, pero nunca reemplaza la Policy del backend.

## Estilos

- Tailwind consume **tokens semánticos** (`--color-state-danger`, `--color-production-pulpable`, ...) mapeados en `tailwind.config`. Sin `bg-red-500` para comunicar significado.
- **shadcn/ui** es la base: inputs, select, combobox, tabla, diálogo, toast, date picker.
- **React Bits** solo en login, dashboard y estados vacíos. Al copiar un componente: reemplazar sus colores por tokens, respetar `prefers-reduced-motion` y revisar su peso. Prohibido en pantallas de campo y cualquier dependencia de WebGL (`three`, `ogl`) sin justificación.

## PWA (`vite-plugin-pwa`)

- `manifest.webmanifest` completo (nombre, íconos 192/512 y maskable, `theme_color` desde los tokens).
- Service Worker versionado con aviso de "Nueva versión disponible" y actualización a pedido del usuario; nunca recargar en medio de un formulario.
- **Precache solo del shell estático.** Las respuestas de `/api` no se cachean en el Service Worker salvo catálogos no sensibles aprobados por ADR.
- Al cerrar sesión: limpiar caches de datos, borradores sensibles y el estado de TanStack Query.
- Indicador online/offline global; la captura diferida queda sujeta al ADR de offline (ver `indufor-field-mobile-ux`).

## Antes de cerrar un cambio de frontend

- [ ] Tests con Vitest + Testing Library de los componentes o hooks nuevos, incluido el estado de error.
- [ ] Sin colores arbitrarios; tokens usados.
- [ ] Si toca la PWA: test del manifest, del registro y la actualización del SW, y Playwright offline.
- [ ] Design QA (`impeccable`, `design:accessibility-review`) si hubo UI nueva.
