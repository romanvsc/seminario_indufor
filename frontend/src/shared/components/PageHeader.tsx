import type { ReactNode } from 'react'

/**
 * Encabezado de página Forest Depth (docs/forest-depth.md). `fondo` es opcional: la foto va detrás de un velo
 * que deja el texto sobre canvas casi sólido, y no se muestra (ni se descarga) en el celular.
 */
export function PageHeader({ eyebrow, titulo, descripcion, accion, children, fondo }: {
  eyebrow?: string
  titulo: string
  descripcion?: ReactNode
  accion?: ReactNode
  children?: ReactNode
  fondo?: string
}) {
  return (
    <header className={`relative isolate flex flex-wrap items-start justify-between gap-4 ${fondo ? 'sm:-mx-2 sm:min-h-40 sm:overflow-hidden sm:rounded-2xl sm:px-6 sm:py-6' : ''}`}>
      {fondo && (
        <div aria-hidden="true" data-testid="fondo-encabezado" className="absolute inset-0 -z-10 hidden sm:block">
          <div className="absolute inset-0 bg-cover bg-right" style={{ backgroundImage: `url(${fondo})` }} />
          <div className="absolute inset-0 [background:var(--header-photo-veil)]" />
        </div>
      )}
      {!fondo && <div aria-hidden="true" className="pointer-events-none absolute -inset-x-6 -top-6 -z-10 h-40 [background:var(--header-glow)]" />}
      <div className="grid max-w-2xl gap-1">
        {eyebrow && <p className="text-xs font-semibold tracking-[0.18em] text-brand uppercase">{eyebrow}</p>}
        <h1 className="text-3xl font-bold tracking-tight sm:text-[2rem]">{titulo}</h1>
        {descripcion && <p className="text-soft">{descripcion}</p>}
        {children}
      </div>
      {accion && <div className="flex shrink-0 items-center gap-2">{accion}</div>}
    </header>
  )
}
