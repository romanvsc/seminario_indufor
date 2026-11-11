import type { UseQueryResult } from '@tanstack/react-query'
import { Link } from 'react-router'
import { Cargando } from '@/shared/components/Cargando'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { usePermiso } from '@/features/auth/api'
import type { Paginado } from '@/shared/api/types'
import { Paginacion } from '@/shared/components/Paginacion'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import type { Lectura } from './api'
import { fecha, lectura } from './formato'

/** Lecturas con su falla y, si la hubo, la atención de Mantenimiento con su nota (spec 08, H-08.5). */
export function TablaLecturas({ q, onPagina, conUnidad, vacio = 'Todavía no hay lecturas.' }: { q: UseQueryResult<Paginado<Lectura>>; onPagina: (p: number) => void; conUnidad: boolean; vacio?: string }) {
  const columnas = conUnidad ? 4 : 3
  const verHistorial = usePermiso('maintenance.failure.view') // la ruta del historial exige este permiso
  return (
    <>
      {q.isError && <Alert variant="destructive"><AlertDescription>{(q.error as Error).message}</AlertDescription></Alert>}
      <div className="surface overflow-x-auto">
        <Table className="tabla-apilada">
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              {conUnidad && <TableHead>Unidad</TableHead>}
              <TableHead className="text-right">Lectura</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.isPending && <TableRow><TableCell colSpan={columnas} role="status"><Cargando /></TableCell></TableRow>}
            {q.data?.data.length === 0 && <TableRow><TableCell colSpan={columnas}>{vacio}</TableCell></TableRow>}
            {q.data?.data.map((l) => {
              const valor = l.horometro_actual ?? l.kilometraje_actual
              return (
                <TableRow key={l.id}>
                  <TableCell data-label="Fecha" className="whitespace-nowrap">
                    {fecha(l.fecha_lectura)}
                    <span className="block text-sm text-soft">{l.operario.apellido}, {l.operario.nombre}</span>
                  </TableCell>
                  {conUnidad && (
                    <TableCell data-label="Unidad">
                      {verHistorial
                        ? <Link viewTransition to={`/mantenimiento/unidad/${l.unidad.id}`} className="font-mono underline-offset-4 hover:underline">{l.unidad.nombre}</Link>
                        : <span className="font-mono">{l.unidad.nombre}</span>}
                      <span className="block text-sm text-soft">{l.unidad.frente ?? 'Sin frente'}</span>
                    </TableCell>
                  )}
                  <TableCell data-label="Lectura" className="text-right tabular-nums">{valor !== null ? lectura(valor, l.unidad.metrica) : '—'}</TableCell>
                  <TableCell data-label="Estado" className="min-w-64">
                    {!l.tiene_falla && <span className="text-soft">Sin falla</span>}
                    {l.tiene_falla && (
                      <div className="grid justify-items-start gap-1">
                        <StatusBadge tono={l.atencion ? 'success' : 'danger'}>{l.atencion ? '✓ Atendida' : '⚠ Abierta'}</StatusBadge>
                        <span className="text-sm">{l.detalle_falla}</span>
                        {l.atencion && <span className="text-sm text-soft">{fecha(l.atencion.fecha)} por {l.atencion.por.apellido}: {l.atencion.nota}</span>}
                      </div>
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
