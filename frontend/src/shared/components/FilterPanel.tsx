import { FilterIcon } from '@animateicons/react/lucide/filter-icon'
import { RotateCcwIcon } from '@animateicons/react/lucide/rotate-ccw-icon'
import { XIcon } from '@animateicons/react/lucide/x-icon'
import { ChevronDown } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { Button } from '@/shared/components/ui/button'

export type FiltroActivo<K extends string = string> = { clave: K; texto: string }

/**
 * Panel de filtros Forest Depth: los campos van en `children` (con sus Label). Los activos se muestran como
 * etiquetas removibles; "Limpiar filtros" aparece si hay activos o si `limpiable` lo indica (filtros sin etiquetas).
 * En el celular los campos arrancan plegados (MOB-14): si no, ocupan la primera pantalla y los resultados quedan abajo.
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
  const [abierto, setAbierto] = useState(false)
  const campos = useId()
  const aplicados = activos.length > 0 || limpiable
  return (
    <section aria-label={titulo} className="surface-quiet grid gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h2 className="flex items-center gap-2 text-base font-semibold"><FilterIcon size={18} className="text-brand" aria-hidden="true" />{titulo}</h2>
        <div className="flex flex-wrap items-center gap-1">
          {onLimpiar && aplicados && (
            <Button variant="ghost" size="sm" className="text-brand" onClick={onLimpiar}><RotateCcwIcon size={16} aria-hidden="true" />Limpiar filtros</Button>
          )}
          <Button variant="outline" size="sm" className="md:hidden" aria-expanded={abierto} aria-controls={campos} onClick={() => setAbierto(!abierto)}>
            {abierto ? 'Ocultar' : aplicados ? 'Ver filtros aplicados' : 'Mostrar'}
            <ChevronDown aria-hidden="true" size={16} className={abierto ? 'rotate-180' : ''} />
          </Button>
        </div>
      </div>
      <div id={campos} className={`${abierto ? 'grid' : 'hidden'} gap-3 md:grid ${columnas}`}>{children}</div>
      {activos.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Filtros activos">
          {activos.map((a) => (
            <li key={a.clave}>
              <button type="button" onClick={() => onQuitar?.(a.clave)} aria-label={`Quitar filtro ${a.texto}`}
                className="flex min-h-11 items-center gap-1.5 rounded-full md:min-h-8 border border-(--border-highlight) bg-brand/10 px-3 py-1 text-sm transition-colors hover:bg-brand/20">
                {a.texto}<XIcon size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
