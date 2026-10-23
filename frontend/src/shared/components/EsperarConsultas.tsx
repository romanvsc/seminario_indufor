import type { ReactNode } from 'react'
import { Button } from '@/shared/components/ui/button'

type Consulta = { data?: unknown; isError: boolean; refetch: () => unknown }

/**
 * Espera los catálogos de un formulario. Si alguno falla y no hay copia en el equipo, muestra el error con
 * "Reintentar" en lugar de quedar en "Cargando…" para siempre (specs/04 T-04.2).
 */
export function EsperarConsultas({ consultas, children }: { consultas: Consulta[]; children: () => ReactNode }) {
  const fallidas = consultas.filter((c) => c.data === undefined && c.isError)
  if (fallidas.length) {
    return (
      <div role="alert" className="mx-auto grid max-w-md gap-3 rounded-md border border-danger p-4">
        <p>No se pudieron cargar los datos del formulario. Revisá la señal y reintentá; lo que ya cargaste queda guardado en este equipo.</p>
        <Button type="button" className="h-11 w-fit" onClick={() => fallidas.forEach((c) => c.refetch())}>Reintentar</Button>
      </div>
    )
  }
  if (consultas.some((c) => c.data === undefined)) return <p role="status" className="p-4">Cargando…</p>
  return <>{children()}</>
}
