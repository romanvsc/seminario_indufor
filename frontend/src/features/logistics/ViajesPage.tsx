import { useState } from 'react'
import { Link } from 'react-router'
import { usePermiso } from '@/features/auth/api'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { ESTADOS, useViajes, type FiltrosViajes, type Viaje } from './api'
import { RemitoDialog } from './RemitoDialog'

const select = 'h-9 rounded-md border border-input bg-card px-3'
const fechaHora = (s: string) => {
  const [f, h] = s.split(' ')
  return `${f.split('-').reverse().join('/')} ${h}`
}

/** Viajes: el camionero ve los suyos; Administración, Gerencia y Logística ven todos (lo decide el backend). */
export function ViajesPage() {
  const [filtros, setFiltros] = useState<FiltrosViajes>({ estado: '', desde: '', hasta: '', page: 1 })
  const [cargando, setCargando] = useState<Viaje | null>(null)
  const lista = useViajes(filtros)
  const puedeDeclarar = usePermiso('logistics.trip.create')
  const puedeCargarRemito = usePermiso('logistics.remito.create')
  const filtrar = (c: Partial<FiltrosViajes>) => setFiltros({ ...filtros, ...c, page: 1 })
  const meta = lista.data?.meta

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold">Viajes</h1>
        {puedeDeclarar && <Button asChild className="h-11"><Link to="/viajes/nuevo">Declarar viaje</Link></Button>}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="estado">Estado</Label>
          <select id="estado" className={select} value={filtros.estado} onChange={(e) => filtrar({ estado: e.target.value as FiltrosViajes['estado'] })}>
            <option value="">Todos</option>
            {Object.entries(ESTADOS).map(([v, { texto }]) => <option key={v} value={v}>{texto}</option>)}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="desde">Desde</Label>
          <Input id="desde" type="date" value={filtros.desde} onChange={(e) => filtrar({ desde: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="hasta">Hasta</Label>
          <Input id="hasta" type="date" min={filtros.desde || undefined} value={filtros.hasta} onChange={(e) => filtrar({ hasta: e.target.value })} />
        </div>
      </div>

      {lista.isError && <p role="alert" className="text-danger">{(lista.error as Error).message}</p>}

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Recorrido</TableHead>
              <TableHead>Camión / camionero</TableHead>
              <TableHead>Declarado</TableHead>
              <TableHead>Remito</TableHead>
              <TableHead>Estado</TableHead>
              {puedeCargarRemito && <TableHead className="text-right">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {lista.isPending && <TableRow><TableCell colSpan={7} role="status">Cargando…</TableCell></TableRow>}
            {lista.data?.data.length === 0 && <TableRow><TableCell colSpan={7}>No hay viajes con esos filtros.</TableCell></TableRow>}
            {lista.data?.data.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="whitespace-nowrap">{fechaHora(v.fecha)}</TableCell>
                <TableCell>{v.origen.nombre} → {v.destino}</TableCell>
                <TableCell>
                  {v.camion.nombre}
                  <span className="block text-sm text-soft">{v.camionero.apellido}, {v.camionero.nombre}</span>
                </TableCell>
                <TableCell className="tabular-nums"><span className="capitalize">{v.tipo_madera.nombre}</span> · {v.volumen_declarado} t</TableCell>
                <TableCell className="tabular-nums">
                  {v.remito ? <>N.º {v.remito.numero}<span className="block text-sm text-soft"><span className="capitalize">{v.remito.tipo_madera.nombre}</span> · {v.remito.volumen_toneladas} t</span></> : '—'}
                </TableCell>
                <TableCell>
                  <span className={`font-medium ${ESTADOS[v.estado].clase}`}>{ESTADOS[v.estado].texto}</span>
                  {v.solicitud_abierta && <span className="block whitespace-pre-line text-sm text-soft">{v.solicitud_abierta.detalle}</span>}
                </TableCell>
                {puedeCargarRemito && (
                  <TableCell className="text-right">
                    {v.estado === 'PENDIENTE' && !v.remito && <Button size="sm" onClick={() => setCargando(v)}>Cargar remito</Button>}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {meta && meta.last_page > 1 && (
        <nav aria-label="Paginación" className="flex items-center gap-3">
          <Button variant="outline" size="sm" disabled={meta.current_page <= 1} onClick={() => setFiltros({ ...filtros, page: filtros.page - 1 })}>Anterior</Button>
          <span className="text-sm text-soft">Página {meta.current_page} de {meta.last_page}</span>
          <Button variant="outline" size="sm" disabled={meta.current_page >= meta.last_page} onClick={() => setFiltros({ ...filtros, page: filtros.page + 1 })}>Siguiente</Button>
        </nav>
      )}

      {cargando && <RemitoDialog viaje={cargando} onClose={() => setCargando(null)} />}
    </section>
  )
}
