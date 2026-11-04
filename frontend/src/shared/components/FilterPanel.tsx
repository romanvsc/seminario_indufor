import { FilterIcon } from '@animateicons/react/lucide/filter-icon'
import { RotateCcwIcon } from '@animateicons/react/lucide/rotate-ccw-icon'
import { XIcon } from '@animateicons/react/lucide/x-icon'
import type { ReactNode } from 'react'
import { Button } from '@/shared/components/ui/button'

/** Misma altura para selects nativos e inputs dentro de un FilterPanel. */
export const controlSelect = 'h-10 w-full rounded-md border border-input bg-card px-3'

export type FiltroActivo<K extends string = string> = { clave: K; texto: string }

/**
 * Panel de filtros Forest Depth: los campos van en `children` (con sus Label). Los activos se muestran como
 * etiquetas removibles; "Limpiar filtros" aparece si hay activos o si `limpiable` lo indica (filtros sin etiquetas).
 */
export function FilterPanel<K extends string>({ titulo = 'Filtros de búsqueda', activos = [], onQuitar, onLimpiar, limpiable = false, columnas = 'grid-cols-2 md:grid-cols-3 xl:grid-cols-6', children }: {
  titulo?: string
  activos?: FiltroActivo<K>[]
  onQuitar?: (clave: K) => void
  onLimpiar?: () => void
  limpiable?: boolean
  columnas?: string
  children: ReactNode
}) {
  return (
    <section aria-label={titulo} className="surface-quiet grid gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold"><FilterIcon size={18} className="text-brand" aria-hidden="true" />{titulo}</h2>
        {onLimpiar && (activos.length > 0 || limpiable) && (
          <Button variant="ghost" size="sm" className="text-brand" onClick={onLimpiar}><RotateCcwIcon size={16} aria-hidden="true" />Limpiar filtros</Button>
        )}
      </div>
      <div className={`grid gap-3 ${columnas}`}>{children}</div>
      {activos.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Filtros activos">
          {activos.map((a) => (
            <li key={a.clave}>
              <button type="button" onClick={() => onQuitar?.(a.clave)} aria-label={`Quitar filtro ${a.texto}`}
                className="flex min-h-8 items-center gap-1.5 rounded-full border border-(--border-highlight) bg-brand/10 px-3 py-1 text-sm transition-colors hover:bg-brand/20">
                {a.texto}<XIcon size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
