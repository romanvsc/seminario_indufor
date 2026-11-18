import type { ReactNode } from 'react'
import { TableCell, TableRow } from '@/shared/components/ui/table'

/** Panel de superficie con título, contador y la tabla adentro (con su propio desplazamiento horizontal). */
export function TablaPanel({ titulo, icono, contador, children }: { titulo: string; icono?: ReactNode; contador?: string; children: ReactNode }) {
  return (
    <section aria-label={titulo} className="surface overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold">{icono && <span aria-hidden="true" className="text-brand">{icono}</span>}{titulo}</h2>
        {contador && <span className="text-sm text-soft">{contador}</span>}
      </div>
      {children}
    </section>
  )
}

/** Fila de estado dentro de una tabla: cargando (status), vacío o error (alert), con el mismo alto que los datos. */
export function FilaEstado({ tipo, columnas, children }: { tipo: 'cargando' | 'vacio' | 'error'; columnas: number; children: ReactNode }) {
  const rol = tipo === 'cargando' ? 'status' : tipo === 'error' ? 'alert' : undefined
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={columnas} role={rol} className={`h-14 px-4 sm:px-5 ${tipo === 'error' ? 'text-danger' : 'text-soft'}`}>{children}</TableCell>
    </TableRow>
  )
}
