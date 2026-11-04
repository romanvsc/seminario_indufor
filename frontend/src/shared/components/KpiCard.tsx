import type { ReactNode } from 'react'
import { Link } from 'react-router'

export type TonoKpi = 'neutro' | 'critico' | 'atencion' | 'ok'

// Neutro por defecto: el color semántico solo cuando el dato lo amerita (no todo KPI es una alerta)
const TONO: Record<TonoKpi, { tarjeta: string; icono: string }> = {
  neutro: { tarjeta: 'surface', icono: 'icon-surface ring-1 ring-(--border-highlight)' },
  critico: { tarjeta: 'rounded-2xl border border-danger/50 bg-danger/10', icono: 'bg-danger/20 text-danger' },
  atencion: { tarjeta: 'rounded-2xl border border-warning/50 bg-warning/10', icono: 'bg-warning/20 text-warning' },
  ok: { tarjeta: 'rounded-2xl border border-brand/40 bg-brand/10', icono: 'bg-brand/20 text-brand' },
}

/** Indicador con número protagonista. Con `to` es un enlace (hover y foco); sin `to`, solo lectura. */
export function KpiCard({ icono, titulo, valor, detalle, to, tono = 'neutro' }: {
  icono: ReactNode
  titulo: string
  valor: string
  detalle?: string
  to?: string
  tono?: TonoKpi
}) {
  const t = TONO[tono]
  const clase = `flex min-w-0 flex-col items-start gap-2 p-3 sm:p-4 lg:flex-row lg:gap-4 ${t.tarjeta}`
  const contenido = (
    <>
      <span aria-hidden="true" className={`grid size-9 shrink-0 place-items-center rounded-xl lg:size-12 ${t.icono}`}>{icono}</span>
      <span className="grid min-w-0 gap-0.5">
        <span className="text-sm font-medium text-soft">{titulo}</span>
        <span className="text-xl leading-tight font-bold tracking-tight whitespace-nowrap tabular-nums sm:text-2xl lg:text-4xl">{valor}</span>
        {detalle && <span className="text-xs text-muted-foreground sm:text-sm">{detalle}</span>}
      </span>
    </>
  )
  return to
    ? <Link to={to} className={`${clase} surface-interactive`} aria-label={`${titulo}: ${valor}${detalle ? `. ${detalle}` : ''}`}>{contenido}</Link>
    : <div className={clase}>{contenido}</div>
}
