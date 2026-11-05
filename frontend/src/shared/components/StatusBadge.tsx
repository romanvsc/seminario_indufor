import type { ReactNode } from 'react'
import { Badge } from '@/shared/components/ui/badge'

export type TonoEstado = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'pulpable' | 'aserrable'

const TONO: Record<TonoEstado, string> = {
  success: 'border-success/50 bg-success/10 text-success',
  warning: 'border-warning/50 bg-warning/10 text-warning',
  danger: 'border-danger/50 bg-danger/10 text-danger',
  info: 'border-info/50 bg-info/10 text-info',
  neutral: 'border-border bg-secondary text-soft',
  pulpable: 'border-pulpable/50 bg-pulpable/10 text-pulpable',
  aserrable: 'border-aserrable/50 bg-aserrable/10 text-aserrable',
}

/** Etiqueta de estado: el texto es obligatorio (el color nunca comunica solo); el ícono es opcional y decorativo. */
export function StatusBadge({ tono, icono, children, className = '' }: { tono: TonoEstado; icono?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Badge variant="outline" data-slot="status-badge" className={`px-2.5 py-0.5 text-sm whitespace-nowrap ${TONO[tono]} ${className}`}>
      {icono && <span aria-hidden="true" className="inline-flex">{icono}</span>}
      {children}
    </Badge>
  )
}
