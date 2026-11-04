import { useState } from 'react'
import { Link } from 'react-router'
import { usePermiso } from '@/features/auth/api'
import { Paginacion } from '@/shared/components/Paginacion'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { useUnidadesTodas } from '@/features/machinery/api'
import { ESTADOS, useCamioneros, useViajes, type FiltrosViajes, type Viaje } from './api'
import { RemitoDialog } from './RemitoDialog'
import { useFiltrosUrl } from '@/shared/hooks/useFiltrosUrl'
import { controlSelect, FilterPanel } from '@/shared/components/FilterPanel'
import { PageHeader } from '@/shared/components/PageHeader'
import { StatusBadge } from '@/shared/components/StatusBadge'

const select = controlSelect
const fechaHora = (s: string) => {
  const [f, h] = s.split(' ')
  return `${f.split('-').reverse().join('/')} ${h}`
}

/** Viajes: el camionero ve los suyos; Administración, Gerencia y Logística ven todos (lo decide el backend). */
export function ViajesPage() {
  const [filtros, setFiltros] = useFiltrosUrl<FiltrosViajes>({ estado: '', desde: '', hasta: '', remito: '', camion: '', camionero: '', page: 1 })
  const [cargando, setCargando] = useState<Viaje | null>(null)
  const lista = useViajes(filtros)
  const puedeDeclarar = usePermiso('logistics.trip.create')
  const puedeCargarRemito = usePermiso('logistics.remito.create')
  // Camión y camionero solo tienen sentido para quien ve todos los viajes; la lista de camioneros exige users.view
  const verTodos = usePermiso('logistics.trip.view-all')
  const verUsuarios = usePermiso('users.view')
  const unidades = useUnidadesTodas()
  const camioneros = useCamioneros(verTodos && verUsuarios)
  const filtrar = (c: Partial<FiltrosViajes>) => setFiltros({ ...filtros, ...c, page: 1 })
  const meta = lista.data?.meta

  return (
    <section className="grid gap-6">
      <PageHeader eyebrow="Operación / Viajes" titulo="Viajes" descripcion="Viajes declarados y su cotejo con el remito"
        accion={puedeDeclarar && <Button asChild className="h-11"><Link to="/viajes/nuevo">Declarar viaje</Link></Button>} />

      <FilterPanel limpiable={Object.entries(filtros).some(([k, v]) => k !== 'page' && v !== '')}
        onLimpiar={() => setFiltros({ estado: '', desde: '', hasta: '', remito: '', camion: '', camionero: '', page: 1 })}>
        <div className="grid gap-1.5">
          <Label htmlFor="estado">Estado</Label>
          <select id="estado" className={select} value={filtros.estado} onChange={(e) => filtrar({ estado: e.target.value as FiltrosViajes['estado'] })}>
            <option value="">Todos</option>
            {Object.entries(ESTADOS).map(([v, { texto }]) => <option key={v} value={v}>{texto}</option>)}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="desde">Desde</Label>
          <Input id="desde" type="date" className="h-10" value={filtros.desde} onChange={(e) => filtrar({ desde: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="hasta">Hasta</Label>
          <Input id="hasta" type="date" className="h-10" min={filtros.desde || undefined} value={filtros.hasta} onChange={(e) => filtrar({ hasta: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="remito">N.º de remito</Label>
          <Input id="remito" type="search" placeholder="Ej.: A-0001" className="h-10" value={filtros.remito} onChange={(e) => filtrar({ remito: e.target.value })} />
        </div>
        {verTodos && (
          <div className="grid gap-1.5">
            <Label htmlFor="camion">Camión</Label>
            <select id="camion" className={select} value={filtros.camion} onChange={(e) => filtrar({ camion: e.target.value })}>
              <option value="">Todos</option>
              {unidades.data?.map((u) => <option key={u.id} value={u.id}>{u.nombre}{u.dominio_patente && ` · ${u.dominio_patente}`}</option>)}
            </select>
          </div>
        )}
        {verTodos && verUsuarios && (
          <div className="grid gap-1.5">
            <Label htmlFor="camionero">Camionero</Label>
            <select id="camionero" className={select} value={filtros.camionero} onChange={(e) => filtrar({ camionero: e.target.value })}>
              <option value="">Todos</option>
              {camioneros.data?.map((u) => <option key={u.id} value={u.id}>{u.apellido}, {u.nombre}</option>)}
            </select>
          </div>
        )}
      </FilterPanel>

      {lista.isError && <p role="alert" className="text-danger">{(lista.error as Error).message}</p>}

      <div className="surface overflow-x-auto">
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
                <TableCell className="min-w-44 whitespace-normal">{v.origen.nombre} → {v.destino}</TableCell>
                <TableCell>
                  {v.camion.nombre}
                  <span className="block text-sm text-soft">{v.camionero.apellido}, {v.camionero.nombre}</span>
                </TableCell>
                <TableCell className="tabular-nums"><span className="capitalize">{v.tipo_madera.nombre}</span> · {v.volumen_declarado} t</TableCell>
                <TableCell className="tabular-nums">
                  {v.remito ? <>N.º {v.remito.numero}<span className="block text-sm text-soft"><span className="capitalize">{v.remito.tipo_madera.nombre}</span> · {v.remito.volumen_toneladas} t</span></> : '—'}
                </TableCell>
                <TableCell>
                  <StatusBadge tono={ESTADOS[v.estado].tono}>{ESTADOS[v.estado].texto}</StatusBadge>
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

      <Paginacion meta={meta} onPagina={(page) => setFiltros({ ...filtros, page })} />

      {cargando && <RemitoDialog viaje={cargando} onClose={() => setCargando(null)} />}
    </section>
  )
}
