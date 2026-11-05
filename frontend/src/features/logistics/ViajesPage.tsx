import { FiltroAutocompletable } from '@/shared/components/FiltroAutocompletable'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { usePermiso } from '@/features/auth/api'
import { Paginacion } from '@/shared/components/Paginacion'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { ESTADOS, useCamioneros, useCamiones, useViajes, type FiltrosViajes, type Viaje } from './api'
import { RemitoDialog } from './RemitoDialog'
import { useFiltrosUrl } from '@/shared/hooks/useFiltrosUrl'
import { FilterPanel } from '@/shared/components/FilterPanel'
import { PageHeader } from '@/shared/components/PageHeader'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { capitalizar, fechaHora, numero } from '@/features/reports/formato'

/** Espera a que se deje de tipear el remito antes de consultar: una consulta por búsqueda, no por tecla. */
export const ESPERA_BUSQUEDA_MS = 400

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
  const unidades = useCamiones(verTodos)
  const camioneros = useCamioneros(verTodos && verUsuarios)
  const filtrar = (c: Partial<FiltrosViajes>) => setFiltros({ ...filtros, ...c, page: 1 })
  const meta = lista.data?.meta
  const columnas = puedeCargarRemito ? 7 : 6

  // El campo muestra lo tipeado; la URL (y la consulta) recién cambia al dejar de tipear
  const [remito, setRemito] = useState(filtros.remito)
  const [remitoUrl, setRemitoUrl] = useState(filtros.remito)
  if (filtros.remito !== remitoUrl) { setRemitoUrl(filtros.remito); setRemito(filtros.remito) } // "Atrás" o "Limpiar filtros"
  const actuales = useRef(filtros)
  useEffect(() => { actuales.current = filtros }) // el temporizador aplica sobre los filtros vigentes
  const espera = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(espera.current), [])
  const tipearRemito = (valor: string) => {
    setRemito(valor)
    clearTimeout(espera.current)
    espera.current = setTimeout(() => setFiltros({ ...actuales.current, remito: valor, page: 1 }), ESPERA_BUSQUEDA_MS)
  }

  // WCAG 2.4.3: al cerrar, el foco vuelve al botón; si el remito se cargó, el botón desaparece y va al título
  const disparador = useRef<HTMLButtonElement | null>(null)
  const cerrarDialogo = (cargado = false) => {
    setCargando(null)
    requestAnimationFrame(() => (cargado || !disparador.current?.isConnected ? document.querySelector<HTMLElement>('main h1') : disparador.current)?.focus())
  }

  return (
    <section className="grid gap-6">
      <PageHeader eyebrow="Operación / Viajes" titulo="Viajes" descripcion="Viajes declarados y su cotejo con el remito"
        accion={puedeDeclarar && <Button asChild className="h-11"><Link viewTransition to="/viajes/nuevo">Declarar viaje</Link></Button>} />

      <FilterPanel limpiable={Object.entries(filtros).some(([k, v]) => k !== 'page' && v !== '')}
        onLimpiar={() => { clearTimeout(espera.current); setRemito(''); setFiltros({ estado: '', desde: '', hasta: '', remito: '', camion: '', camionero: '', page: 1 }) }}>
        <div className="grid gap-1.5">
          <Label htmlFor="estado">Estado</Label>
          <FiltroAutocompletable id="estado" className="h-10" value={filtros.estado} onChange={(valor) => filtrar({ estado: valor as FiltrosViajes['estado'] })}>
            <option value="">Todos</option>
            {Object.entries(ESTADOS).map(([v, { texto }]) => <option key={v} value={v}>{texto}</option>)}
          </FiltroAutocompletable>
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
          <Input id="remito" type="search" placeholder="Ej.: A-0001" className="h-10" value={remito} onChange={(e) => tipearRemito(e.target.value)} />
        </div>
        {verTodos && (
          <div className="grid gap-1.5">
            <Label htmlFor="camion">Camión</Label>
            <FiltroAutocompletable id="camion" cargando={unidades.isLoading} error={unidades.isError} className="h-10" value={filtros.camion} onChange={(valor) => filtrar({ camion: valor })}>
              <option value="">Todos</option>
              {unidades.data?.map((u) => <option key={u.id} value={u.id}>{u.nombre}{u.dominio_patente && ` · ${u.dominio_patente}`}</option>)}
            </FiltroAutocompletable>
          </div>
        )}
        {verTodos && verUsuarios && (
          <div className="grid gap-1.5">
            <Label htmlFor="camionero">Camionero</Label>
            <FiltroAutocompletable id="camionero" cargando={camioneros.isLoading} error={camioneros.isError} className="h-10" value={filtros.camionero} onChange={(valor) => filtrar({ camionero: valor })}>
              <option value="">Todos</option>
              {camioneros.data?.map((u) => <option key={u.id} value={u.id}>{u.apellido}, {u.nombre}</option>)}
            </FiltroAutocompletable>
          </div>
        )}
      </FilterPanel>

      {lista.isError && <p role="alert" className="text-danger">{(lista.error as Error).message}</p>}

      <div className="surface overflow-x-auto">
        <Table className="tabla-apilada">
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
            {lista.isPending && <TableRow><TableCell colSpan={columnas}>Cargando…</TableCell></TableRow>}
            {lista.data?.data.length === 0 && <TableRow><TableCell colSpan={columnas}>No hay viajes con esos filtros.</TableCell></TableRow>}
            {lista.data?.data.map((v) => (
              <TableRow key={v.id}>
                <TableCell data-label="Fecha" className="w-px whitespace-normal tabular-nums">{fechaHora(v.fecha)}</TableCell>
                <TableCell data-label="Recorrido" className="min-w-36 whitespace-normal">{v.origen.nombre} → {v.destino}</TableCell>
                <TableCell data-label="Camión / camionero">
                  {v.camion.nombre}
                  <span className="block text-sm text-soft">{v.camionero.apellido}, {v.camionero.nombre}</span>
                </TableCell>
                <TableCell data-label="Declarado">{capitalizar(v.tipo_madera.nombre)}<span className="block tabular-nums">{numero(v.volumen_declarado)} t</span></TableCell>
                <TableCell data-label="Remito">
                  {v.remito ? <>N.º <span className="tabular-nums">{v.remito.numero}</span><span className="block text-sm text-soft">{capitalizar(v.remito.tipo_madera.nombre)} · <span className="tabular-nums">{numero(v.remito.volumen_toneladas)} t</span></span></> : '—'}
                </TableCell>
                <TableCell data-label="Estado">
                  <StatusBadge tono={ESTADOS[v.estado].tono}>{ESTADOS[v.estado].texto}</StatusBadge>
                  {v.solicitud_abierta && <span className="block whitespace-pre-line text-sm text-soft">{v.solicitud_abierta.detalle}</span>}
                </TableCell>
                {puedeCargarRemito && (
                  <TableCell data-label={v.estado === 'PENDIENTE' && !v.remito ? 'Acciones' : undefined} className="text-right">
                    {v.estado === 'PENDIENTE' && !v.remito && (
                      <Button size="sm" className="h-11 sm:h-8" onClick={(e) => { disparador.current = e.currentTarget; setCargando(v) }}>Cargar remito</Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Paginacion meta={meta} onPagina={(page) => setFiltros({ ...filtros, page })} />

      {cargando && <RemitoDialog viaje={cargando} onClose={cerrarDialogo} />}
      {/* Región montada vacía antes de anunciar, para que el lector de pantalla lo lea */}
      <p role="status" className="sr-only">{lista.isFetching ? 'Cargando viajes…' : ''}</p>
    </section>
  )
}
