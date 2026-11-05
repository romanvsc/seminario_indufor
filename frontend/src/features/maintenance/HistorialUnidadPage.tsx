import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import type { Unidad } from '@/features/machinery/api'
import { api } from '@/shared/api/client'
import type { Recurso } from '@/shared/api/types'
import { Paginacion } from '@/shared/components/Paginacion'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { ESTADOS_MATAFUEGO, TONO_MATAFUEGO, useControles, useLecturas } from './api'
import { fecha } from './formato'
import { TablaLecturas } from './TablaLecturas'
import { PageHeader } from '@/shared/components/PageHeader'
import { StatusBadge } from '@/shared/components/StatusBadge'

/** Spec 08 (CA-08.7): historial de una unidad para Mantenimiento: lecturas, fallas con su atención y controles de matafuego. */
export function HistorialUnidadPage() {
  const id = Number(useParams().id)
  const unidad = useQuery({ queryKey: ['machinery', id], queryFn: () => api<Recurso<Unidad>>(`/machinery/${id}`).then((r) => r.data) })
  const [pagLecturas, setPagLecturas] = useState(1)
  const [pagControles, setPagControles] = useState(1)
  const lecturas = useLecturas({ unidad: id, page: pagLecturas })
  const controles = useControles({ unidad: id, page: pagControles })

  return (
    <section className="grid gap-6">
      <div className="grid gap-2">
        <Link viewTransition to="/mantenimiento" className="w-fit text-sm text-soft underline-offset-4 hover:underline">← Panel técnico</Link>
        <PageHeader eyebrow="Operación / Mantenimiento" titulo={unidad.data ? `Historial de ${unidad.data.nombre}` : 'Historial de la unidad'}
          descripcion={unidad.data && <>{unidad.data.tipo.nombre}{unidad.data.frente && ` · ${unidad.data.frente.nombre}`}{unidad.data.dominio_patente && ` · ${unidad.data.dominio_patente}`}</>} />
      </div>

      <div className="grid gap-3">
        <h2 className="text-lg font-semibold">Lecturas y fallas</h2>
        <TablaLecturas q={lecturas} onPagina={setPagLecturas} conUnidad={false} />
      </div>

      <div className="grid gap-3">
        <h2 className="text-lg font-semibold">Controles de matafuego</h2>
        {controles.isError && <p role="alert" className="text-danger">{(controles.error as Error).message}</p>}
        <div className="surface overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Revisión</TableHead><TableHead>Estado</TableHead><TableHead>Vencimiento de carga</TableHead><TableHead>Controló</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {controles.isPending && <TableRow><TableCell colSpan={4} role="status">Cargando…</TableCell></TableRow>}
              {controles.data?.data.length === 0 && <TableRow><TableCell colSpan={4}>Todavía no hay controles.</TableCell></TableRow>}
              {controles.data?.data.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{fecha(c.fecha_revision)}</TableCell>
                  <TableCell><StatusBadge tono={TONO_MATAFUEGO[c.estado]}>{ESTADOS_MATAFUEGO[c.estado]}</StatusBadge></TableCell>
                  <TableCell>{c.fecha_vencimiento_carga ? fecha(c.fecha_vencimiento_carga) : c.etiqueta_ilegible ? 'Etiqueta ilegible' : '—'}</TableCell>
                  <TableCell>{c.operario.apellido}, {c.operario.nombre}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Paginacion meta={controles.data?.meta} onPagina={setPagControles} etiqueta="Páginas de controles" />
      </div>
    </section>
  )
}
