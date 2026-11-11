import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { AlertTriangle, ArrowRight, ClipboardCheck, Gauge, Search, Wrench } from 'lucide-react'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Cargando } from '@/shared/components/Cargando'
import { usePermiso } from '@/features/auth/api'
import { ApiError } from '@/shared/api/client'
import { FilterPanel } from '@/shared/components/FilterPanel'
import { FiltroAutocompletable } from '@/shared/components/FiltroAutocompletable'
import { Paginacion } from '@/shared/components/Paginacion'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { ESTADOS_MATAFUEGO, TONO_MATAFUEGO, useAtenderFalla, useFallasAbiertas, usePanel, type FilaPanel } from './api'
import { fecha, lectura } from './formato'
import { PageHeader } from '@/shared/components/PageHeader'
import { StatusBadge } from '@/shared/components/StatusBadge'


function Matafuego({ m }: { m: FilaPanel['matafuego'] }) {
  if (!m) return <span className="text-correction">⚠ Sin controles</span>
  return (
    <>
      {m.vencido && m.vencimiento !== null && m.estado !== 'FALTANTE'
        ? <StatusBadge tono="danger">⚠ Carga vencida</StatusBadge>
        : <StatusBadge tono={TONO_MATAFUEGO[m.estado]}>{ESTADOS_MATAFUEGO[m.estado]}</StatusBadge>}
      <span className="block text-sm">
        {/* D24: sin vencimiento cuando falta el matafuego o la etiqueta no se lee; nunca se muestra como vigente */}
        {m.estado === 'FALTANTE' ? <span className="font-medium text-danger">⚠ Falta el matafuego</span>
          : m.vencimiento === null ? <span className="font-medium text-correction">⚠ Etiqueta ilegible: sin fecha de vencimiento</span>
          : m.vencido ? <span className="text-soft">Venció el {fecha(m.vencimiento)} · estado del matafuego: {ESTADOS_MATAFUEGO[m.estado]}</span>
          : m.por_vencer ? <span className="text-correction">⚠ Vence el {fecha(m.vencimiento)}</span>
          : <span className="text-soft">Vence el {fecha(m.vencimiento)}</span>}
      </span>
      {!m.control_del_mes && <span className="block text-sm text-correction">⚠ Sin control este mes</span>}
    </>
  )
}

type Situacion = 'todas' | 'fallas' | 'lecturas' | 'matafuegos'

function matafuegoPendiente(m: FilaPanel['matafuego']) {
  return !m || !m.control_del_mes || m.estado !== 'OK' || m.vencido || m.por_vencer || m.etiqueta_ilegible || m.vencimiento === null
}

function normalizar(valor: string) {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
}

function Resumen({ titulo, valor, detalle, accion, icono, onClick }: { titulo: string; valor: string; detalle: string; accion: string; icono: ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="panel-accion surface group flex min-h-28 w-full cursor-pointer items-start gap-4 p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
    <span className="mt-0.5 text-brand" aria-hidden="true">{icono}</span>
    <span className="grid flex-1 gap-1"><span className="text-2xl font-bold tabular-nums">{valor}</span>{' '}
      <span className="font-semibold">{titulo}</span><span className="text-sm text-soft">{detalle}</span>
      <span className="mt-1 flex items-center gap-1 text-sm font-semibold text-brand group-hover:underline group-focus-visible:underline">{accion}<ArrowRight size={16} aria-hidden="true" /></span></span>
  </button>
}

/** Panel técnico de Mantenimiento: estado de cada unidad y fallas abiertas (RF09–RF11, ADR-003). */
export function PanelPage() {
  const panel = usePanel()
  const [pagina, setPagina] = useState(1)
  const fallas = useFallasAbiertas(true, false, pagina)
  const puedeAtender = usePermiso('maintenance.failure.manage')
  const atender = useAtenderFalla()
  const [nota, setNota] = useState<{ id: number; texto: string } | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [frente, setFrente] = useState('')
  const [situacion, setSituacion] = useState<Situacion>('todas')
  const puedeCargarLectura = usePermiso('maintenance.reading.create')
  const puedeCargarMatafuego = usePermiso('maintenance.extinguisher.create')
  const unidades = panel.data ?? []
  const frentes = Array.from(new Set(unidades.flatMap((u) => u.unidad.frente ? [u.unidad.frente] : []))).sort((a, b) => a.localeCompare(b, 'es'))
  const sinLectura = unidades.filter((u) => !u.lectura_semana).length
  const pendientesMatafuego = unidades.filter((u) => matafuegoPendiente(u.matafuego)).length
  const filtradas = unidades.filter((u) => normalizar(u.unidad.nombre).includes(normalizar(busqueda.trim()))
    && (!frente || u.unidad.frente === frente)
    && (situacion === 'todas' || (situacion === 'fallas' && u.fallas_abiertas > 0)
      || (situacion === 'lecturas' && !u.lectura_semana) || (situacion === 'matafuegos' && matafuegoPendiente(u.matafuego))))
  const irA = (id: string) => {
    const destino = document.getElementById(id)
    destino?.scrollIntoView?.({ block: 'start' })
    destino?.focus({ preventScroll: true })
  }
  const filtrarSituacion = (valor: Situacion) => { setSituacion(valor); irA('estado-flota') }

  const confirmar = async () => {
    if (!nota || nota.texto.trim().length < 3) return toast.error('Escribí qué se hizo (mínimo 3 caracteres).')
    try {
      await atender.mutateAsync({ id: nota.id, nota: nota.texto.trim() })
      toast.success('Falla marcada como atendida.')
      setNota(null)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'No se pudo marcar como atendida.')
    }
  }

  return (
    <section className="grid gap-6">
      <PageHeader eyebrow="Operación / Mantenimiento" titulo="Panel técnico" descripcion="Seguimiento de fallas, lecturas y controles de la flota"
        accion={<>{puedeCargarLectura && <Button asChild variant="outline"><Link viewTransition to="/lecturas/nueva">Cargar lectura</Link></Button>}{puedeCargarMatafuego && <Button asChild variant="outline"><Link viewTransition to="/matafuegos/nuevo">Control de matafuego</Link></Button>}</>} />

      <div className="grid gap-3 sm:grid-cols-3" aria-label="Resumen de mantenimiento">
        <Resumen titulo="Fallas abiertas" valor={fallas.data ? String(fallas.data.meta.total) : '—'} detalle="Reportes pendientes de atención" accion="Ver fallas" icono={<Wrench size={21} />} onClick={() => irA('fallas-abiertas')} />
        <Resumen titulo="Sin lectura semanal" valor={panel.data ? String(sinLectura) : '—'} detalle="Unidades sin carga desde el lunes" accion="Ver unidades" icono={<Gauge size={21} />} onClick={() => filtrarSituacion('lecturas')} />
        <Resumen titulo="Matafuegos con pendientes" valor={panel.data ? String(pendientesMatafuego) : '—'} detalle="Controles y observaciones" accion="Ver unidades" icono={<ClipboardCheck size={21} />} onClick={() => filtrarSituacion('matafuegos')} />
      </div>
      {panel.data && panel.data.length >= 200 && <p role="status" className="rounded-md border border-warning/50 bg-warning/10 p-3 text-sm">Se muestran hasta 200 unidades; los resultados y totales podrían estar incompletos.</p>}

      <section id="fallas-abiertas" tabIndex={-1} aria-label="Fallas abiertas" className="surface scroll-mt-4 grid gap-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2"><div><h2 className="text-lg font-semibold">Fallas abiertas</h2><p className="text-sm text-soft">Reportes pendientes de atención</p></div><span className="text-sm font-medium text-soft">{fallas.data ? `${fallas.data.meta.total} en total` : '—'}</span></div>
        {fallas.isPending && <p role="status" className="text-soft">Cargando fallas…</p>}
        {fallas.isError && <Alert variant="destructive"><AlertDescription className="flex flex-wrap items-center gap-3"><span>No se pudieron cargar las fallas.</span><Button variant="outline" size="sm" onClick={() => void fallas.refetch()}>Reintentar</Button></AlertDescription></Alert>}
        {fallas.data?.data.length === 0 && <p className="rounded-md bg-brand/10 px-4 py-3 text-sm text-soft">No hay fallas abiertas.</p>}
        <ul className="grid gap-3">
          {fallas.data?.data.map((f) => (
            <li key={f.id} className="surface-quiet grid gap-2 p-4">
              <p className="flex flex-wrap items-center gap-2 font-medium"><AlertTriangle size={17} className="text-danger" aria-hidden="true" /> {f.unidad.nombre}{f.unidad.frente && ` · ${f.unidad.frente}`} · {fecha(f.fecha_lectura)}</p>
              <p>{f.detalle_falla}</p>
              <p className="text-sm text-soft">Reportó {f.operario.apellido}, {f.operario.nombre}</p>
              {puedeAtender && nota?.id !== f.id && <Button size="sm" variant="outline" className="w-fit" onClick={() => setNota({ id: f.id, texto: '' })}>Marcar atendida</Button>}
              {nota?.id === f.id && (
                <div className="flex flex-wrap items-center gap-2">
                  <Input aria-label="Qué se hizo" className="max-w-sm" placeholder="Qué se hizo" value={nota.texto} onChange={(e) => setNota({ ...nota, texto: e.target.value })} />
                  <Button size="sm" disabled={atender.isPending} onClick={confirmar}>Confirmar</Button>
                  <Button size="sm" variant="ghost" onClick={() => setNota(null)}>Cancelar</Button>
                </div>
              )}
            </li>
          ))}
        </ul>
        <Paginacion meta={fallas.data?.meta} onPagina={setPagina} etiqueta="Páginas de fallas abiertas" />
      </section>

      <section id="estado-flota" tabIndex={-1} aria-label="Estado de la flota" className="scroll-mt-4 grid gap-3">
        <div><h2 className="text-lg font-semibold">Estado de la flota</h2><p className="text-sm text-soft">Lecturas, fallas y controles por unidad</p></div>
        <FilterPanel limpiable={!!busqueda || !!frente || situacion !== 'todas'} onLimpiar={() => { setBusqueda(''); setFrente(''); setSituacion('todas') }} columnas="grid-cols-1 sm:grid-cols-3">
          <div className="grid gap-1.5"><Label htmlFor="buscar-unidad">Buscar unidad</Label><div className="relative"><Search aria-hidden="true" size={17} className="pointer-events-none absolute left-3 top-3 text-soft" /><Input id="buscar-unidad" type="search" className="h-10 bg-card pl-9" placeholder="Nombre de la unidad" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></div></div>
          <div className="grid gap-1.5"><Label htmlFor="filtro-frente">Frente</Label><FiltroAutocompletable id="filtro-frente" value={frente} onChange={setFrente}><option value="">Todos</option>{frentes.map((f) => <option key={f} value={f}>{f}</option>)}</FiltroAutocompletable></div>
          <div className="grid gap-1.5"><Label htmlFor="filtro-situacion">Situación</Label><FiltroAutocompletable id="filtro-situacion" value={situacion} onChange={(v) => setSituacion(v as Situacion)}><option value="todas">Todas</option><option value="fallas">Con fallas abiertas</option><option value="lecturas">Sin lectura semanal</option><option value="matafuegos">Matafuegos con pendientes</option></FiltroAutocompletable></div>
        </FilterPanel>
        {panel.isError && <Alert variant="destructive"><AlertDescription className="flex flex-wrap items-center gap-3"><span>No se pudo cargar el estado de la flota.</span><Button variant="outline" size="sm" onClick={() => void panel.refetch()}>Reintentar</Button></AlertDescription></Alert>}
        {panel.data && <p className="text-sm text-soft" aria-live="polite">{filtradas.length} de {unidades.length} unidades</p>}
        <div className="surface overflow-x-auto">
          <Table className="tabla-apilada">
            <TableHeader>
              <TableRow>
                <TableHead>Unidad</TableHead>
                <TableHead>Última lectura</TableHead>
                <TableHead>Fallas</TableHead>
                <TableHead>Matafuego</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {panel.isPending && <TableRow><TableCell colSpan={4} role="status"><Cargando /></TableCell></TableRow>}
              {panel.data?.length === 0 && <TableRow><TableCell colSpan={4}>No hay unidades activas.</TableCell></TableRow>}
              {panel.data && panel.data.length > 0 && filtradas.length === 0 && <TableRow><TableCell colSpan={4}>No hay unidades con esos filtros.</TableCell></TableRow>}
              {panel.data && filtradas.map((u) => (
                <TableRow key={u.unidad.id}>
                  <TableCell data-label="Unidad">
                    <Link viewTransition to={`/mantenimiento/unidad/${u.unidad.id}`} className="group inline-flex min-h-11 flex-wrap items-center gap-x-2 rounded-sm text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><span className="font-mono font-medium underline underline-offset-4">{u.unidad.nombre}</span><span className="inline-flex items-center gap-1 text-sm font-semibold group-hover:underline group-focus-visible:underline">Ver historial <ArrowRight size={14} aria-hidden="true" /></span></Link>
                    <span className="block text-sm text-soft">{u.unidad.tipo}{u.unidad.frente && ` · ${u.unidad.frente}`}</span>
                  </TableCell>
                  <TableCell data-label="Última lectura">
                    {u.ultima_lectura ? <><span className="tabular-nums">{lectura(u.ultima_lectura.valor, u.unidad.metrica)}</span><span className="block text-sm text-soft tabular-nums">{fecha(u.ultima_lectura.fecha)}</span></> : '—'}
                    {u.ultima_carga_sin_valor && <span className="block text-sm text-correction">⚠ Última carga: falla sin valor ({fecha(u.ultima_carga_sin_valor)})</span>}
                    <span className={`block text-sm ${u.lectura_semana ? 'text-approved' : 'text-correction'}`}>{u.lectura_semana ? '✓ Leída esta semana' : '⚠ Sin lectura desde el lunes'}</span>
                  </TableCell>
                  <TableCell data-label="Fallas">{u.fallas_abiertas > 0 ? <span className="font-medium text-danger">⚠ {u.fallas_abiertas} abierta{u.fallas_abiertas > 1 && 's'}</span> : <span className="text-soft">—</span>}</TableCell>
                  <TableCell data-label="Matafuego"><Matafuego m={u.matafuego} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </section>
  )
}
