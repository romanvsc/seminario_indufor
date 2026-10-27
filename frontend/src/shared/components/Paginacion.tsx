import type { Paginado } from '@/shared/api/types'
import { Button } from '@/shared/components/ui/button'

/** Anterior / Siguiente para cualquier lista paginada del backend (spec 08, H-08.2). Con una sola página no se muestra. */
export function Paginacion({ meta, onPagina, etiqueta = 'Paginación' }: { meta: Paginado<unknown>['meta'] | undefined; onPagina: (pagina: number) => void; etiqueta?: string }) {
  if (!meta || meta.last_page <= 1) return null
  return (
    <nav aria-label={etiqueta} className="flex flex-wrap items-center gap-3">
      <Button variant="outline" size="sm" disabled={meta.current_page <= 1} onClick={() => onPagina(meta.current_page - 1)}>Anterior</Button>
      <span className="text-sm text-soft">Página {meta.current_page} de {meta.last_page} · {meta.total} en total</span>
      <Button variant="outline" size="sm" disabled={meta.current_page >= meta.last_page} onClick={() => onPagina(meta.current_page + 1)}>Siguiente</Button>
    </nav>
  )
}
