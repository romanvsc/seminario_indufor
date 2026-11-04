import type { ReactNode } from 'react'

/**
 * Encabezado de página Forest Depth (docs/forest-depth.md). Las capas decorativas usan -z-10 sin `isolate` propio:
 * se pintan en el contexto del layout (AppLayout es `isolate`), sobre el canvas y debajo de todo el contenido. `fondo` es opcional: la foto se extiende hasta el borde
 * superior y derecho del área de contenido y se funde con el canvas por máscara (izquierda y abajo, por detrás de lo
 * que sigue). No se muestra ni se descarga en el celular.
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
    <header className={`relative flex flex-wrap items-start justify-between gap-4 ${fondo ? 'sm:pt-4 sm:pb-6' : ''}`}>
      {fondo && (
        <div aria-hidden="true" data-testid="fondo-encabezado"
          className="header-photo pointer-events-none absolute -top-10 -left-6 -z-10 hidden h-[24rem] w-screen sm:block"
          style={{ backgroundImage: `url(${fondo})` }} />
      )}
      {!fondo && <div aria-hidden="true" className="pointer-events-none absolute -top-48 -left-56 -z-10 h-[26rem] w-[48rem] [background:var(--header-glow)]" />}
      <div className="grid max-w-2xl gap-1.5">
        {eyebrow && <p className="text-xs font-semibold tracking-[0.16em] text-brand uppercase">{eyebrow}</p>}
        <h1 className="text-3xl font-bold tracking-tight sm:text-[2rem]">{titulo}</h1>
        {descripcion && <p className="text-soft">{descripcion}</p>}
        {children}
      </div>
      {accion && <div className="flex shrink-0 items-center gap-2">{accion}</div>}
    </header>
  )
}
