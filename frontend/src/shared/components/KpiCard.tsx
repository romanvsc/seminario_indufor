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

/**
 * Indicador con número protagonista. Con `to` es un enlace (hover y foco); sin `to`, solo lectura.
 * `vertical` deja el ícono arriba en todos los anchos: para grillas de muchas tarjetas o valores largos (montos).
 */
export function KpiCard({ icono, titulo, valor, detalle, to, tono = 'neutro', vertical = false }: {
  icono?: ReactNode
  titulo: string
  valor: string
  detalle?: string
  to?: string
  tono?: TonoKpi
  vertical?: boolean
}) {
  const t = TONO[tono]
  const clase = `flex min-w-0 flex-col items-start gap-2 p-3 sm:p-4 ${vertical ? 'sm:gap-3' : 'lg:flex-row lg:gap-4'} ${t.tarjeta}`
  const contenido = (
    <>
      {icono && <span aria-hidden="true" className={`grid size-9 shrink-0 place-items-center rounded-xl ${vertical ? 'sm:size-10' : 'lg:size-12'} ${t.icono}`}>{icono}</span>}
      <span className="grid min-w-0 gap-0.5">
        {/* Los espacios van como nodos de texto entre elementos (en una grilla no ocupan lugar) para que el nombre accesible no los pierda */}
        <span className="text-sm font-medium text-soft">{titulo}<span className="sr-only">:</span></span>{' '}
        <span className={`text-xl leading-tight font-bold tracking-tight whitespace-nowrap tabular-nums sm:text-2xl ${vertical ? 'lg:text-3xl' : 'lg:text-4xl'}`}>{valor}{detalle && <span className="sr-only">.</span>}</span>{' '}
        {detalle && <span className="text-xs text-muted-foreground sm:text-sm">{detalle}</span>}
      </span>
    </>
  )
  return to
    // Sin aria-label: el nombre sale del texto visible (axe label-content-name-mismatch); los separadores son solo para lectores
    ? <Link viewTransition to={to} className={`${clase} surface-interactive`}>{contenido}</Link>
    : <div className={clase}>{contenido}</div>
}
