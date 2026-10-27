import type { UseQueryResult } from '@tanstack/react-query'
import type { Paginado } from '@/shared/api/types'
import { Paginacion } from '@/shared/components/Paginacion'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { UNIDAD_METRICA, type Lectura } from './api'
import { fecha } from './formato'

/** Lecturas con su falla y, si la hubo, la atención de Mantenimiento con su nota (spec 08, H-08.5). */
export function TablaLecturas({ q, onPagina, conUnidad }: { q: UseQueryResult<Paginado<Lectura>>; onPagina: (p: number) => void; conUnidad: boolean }) {
  const columnas = conUnidad ? 4 : 3
  return (
    <>
      {q.isError && <p role="alert" className="text-danger">{(q.error as Error).message}</p>}
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              {conUnidad && <TableHead>Unidad</TableHead>}
              <TableHead className="text-right">Lectura</TableHead>
              <TableHead>Falla</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.isPending && <TableRow><TableCell colSpan={columnas} role="status">Cargando…</TableCell></TableRow>}
            {q.data?.data.length === 0 && <TableRow><TableCell colSpan={columnas}>Todavía no hay lecturas.</TableCell></TableRow>}
            {q.data?.data.map((l) => {
              const valor = l.horometro_actual ?? l.kilometraje_actual
              return (
                <TableRow key={l.id}>
                  <TableCell className="whitespace-nowrap">
                    {fecha(l.fecha_lectura)}
                    <span className="block text-sm text-soft">{l.operario.apellido}, {l.operario.nombre}</span>
                  </TableCell>
                  {conUnidad && <TableCell>{l.unidad.nombre}</TableCell>}
                  <TableCell className="text-right tabular-nums">{valor !== null ? `${valor} ${UNIDAD_METRICA[l.unidad.metrica]}` : '—'}</TableCell>
                  <TableCell className="text-sm">
                    {!l.tiene_falla && <span className="text-soft">—</span>}
                    {l.tiene_falla && (
                      <>
                        <span className="block">{l.detalle_falla}</span>
                        {l.atencion
                          ? <span className="block text-approved">✓ Atendida el {fecha(l.atencion.fecha)} por {l.atencion.por.apellido}: {l.atencion.nota}</span>
                          : <span className="block font-medium text-danger">⚠ Abierta</span>}
                      </>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <Paginacion meta={q.data?.meta} onPagina={onPagina} etiqueta="Páginas de lecturas" />
    </>
  )
}
