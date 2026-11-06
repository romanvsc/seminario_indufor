import { useEffect, type ReactNode } from 'react'

/** Encabezado de página Forest Depth (docs/forest-depth.md). */
export function PageHeader({ eyebrow, titulo, descripcion, accion, children }: {
  eyebrow?: string
  titulo: string
  descripcion?: ReactNode
  accion?: ReactNode
  children?: ReactNode
}) {
  // WCAG 2.4.2: cada vista se nombra en la pestaña y para el lector de pantalla
  useEffect(() => { document.title = `${titulo} — INDUFOR` }, [titulo])
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="grid max-w-2xl gap-1.5">
        {eyebrow && <p className="text-xs font-semibold tracking-[0.16em] text-brand uppercase">{eyebrow}</p>}
        <h1 tabIndex={-1} className="text-3xl outline-none font-bold tracking-tight sm:text-[2rem]">{titulo}</h1>
        {descripcion && <p className="text-soft">{descripcion}</p>}
        {children}
      </div>
      {accion && <div className="flex min-w-0 items-center gap-2">{accion}</div>}
    </header>
  )
}
