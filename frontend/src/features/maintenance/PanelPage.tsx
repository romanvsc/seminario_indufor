import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { toast } from 'sonner'
import { AlertTriangle, ArrowRight, Search } from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { ESTADOS_MATAFUEGO, TONO_MATAFUEGO, useAtenderFalla, useFallasAbiertas, usePanel, type FilaPanel } from './api'
import { fecha, lectura } from './formato'
import { PageHeader } from '@/shared/components/PageHeader'
import { StatusBadge } from '@/shared/components/StatusBadge'
import { useFiltrosUrl } from '@/shared/hooks/useFiltrosUrl'


function Matafuego({ m }: { m: FilaPanel['matafuego'] }) {
  // MOB-13: falta cargarlo (pendiente, ámbar); el rojo queda para la carga vencida
  if (!m) return <span className="text-warning">⚠ Sin controles</span>
  return (
    <>
      {m.vencido && m.vencimiento !== null && m.estado !== 'FALTANTE'
        ? <StatusBadge tono="danger">⚠ Carga vencida</StatusBadge>
        : <StatusBadge tono={TONO_MATAFUEGO[m.estado]}>{ESTADOS_MATAFUEGO[m.estado]}</StatusBadge>}
      <span className="block text-sm">
        {/* D24: sin vencimiento cuando falta el matafuego o la etiqueta no se lee; nunca se muestra como vigente */}
        {m.estado === 'FALTANTE' ? <span className="font-medium text-danger">⚠ Falta el matafuego</span>
          : m.vencimiento === null ? <span className="font-medium text-correction">⚠ Etiqueta ilegible: sin fecha de vencimiento</span>
          // «estado: OK» al lado de «Carga vencida» se leía como contradicción: se dice qué hacer
          : m.vencido ? <span className="text-soft">Venció el {fecha(m.vencimiento)} · {m.estado === 'OK' ? 'el equipo está en buen estado, falta recargarlo' : `además está ${ESTADOS_MATAFUEGO[m.estado].toLowerCase()}`}</span>
          : m.por_vencer ? <span className="text-warning">⚠ Vence el {fecha(m.vencimiento)}</span>
          : <span className="text-soft">Vence el {fecha(m.vencimiento)}</span>}
      </span>
      {!m.control_del_mes && <span className="block text-sm text-warning">⚠ Sin control este mes</span>}
    </>
  )
}

/** UIX-048: cada pestaña es un trabajo; «todas» es la consulta de la flota completa. */
type Situacion = 'fallas' | 'lecturas' | 'matafuegos' | 'todas'
const SITUACIONES: Situacion[] = ['fallas', 'lecturas', 'matafuegos', 'todas']

function matafuegoPendiente(m: FilaPanel['matafuego']) {
  return !m || !m.control_del_mes || m.estado !== 'OK' || m.vencido || m.por_vencer || m.etiqueta_ilegible || m.vencimiento === null
}

/** UIX-029: carga vencida o falta el matafuego; es lo primero que hay que atender. */
const matafuegoCritico = (m: FilaPanel['matafuego']) => !!m && (m.estado === 'FALTANTE' || m.vencido)
const sinControlDelMes = (m: FilaPanel['matafuego']) => !matafuegoCritico(m) && (!m || !m.control_del_mes)

/** UIX-029: lo urgente primero (fallas abiertas o matafuego crítico), después cualquier pendiente; el resto en el orden del backend. */
const urgencia = (u: FilaPanel) => (u.fallas_abiertas > 0 || matafuegoCritico(u.matafuego) ? 2 : !u.lectura_semana || matafuegoPendiente(u.matafuego) ? 1 : 0)
/** UIX-048: en la pestaña Matafuegos, crítico → sin control del mes → otras observaciones. */
const urgenciaMatafuego = (u: FilaPanel) => (matafuegoCritico(u.matafuego) ? 2 : sinControlDelMes(u.matafuego) ? 1 : 0)

/** UIX-029: qué reúne «Matafuegos», en categorías que no se superponen. */
function desgloseMatafuegos(unidades: FilaPanel[]) {
  const pendientes = unidades.map((u) => u.matafuego).filter(matafuegoPendiente)
  const criticos = pendientes.filter(matafuegoCritico).length
  const sinControl = pendientes.filter(sinControlDelMes).length
  const otros = pendientes.length - criticos - sinControl
  const partes = [criticos && `${criticos} con carga vencida o faltante`, sinControl && `${sinControl} sin control del mes`, otros && `${otros} con otras observaciones`].filter(Boolean)
  return partes.length ? partes.join(' · ') : 'Controles y observaciones'
}

function normalizar(valor: string) {
  return valor.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase()
}

function CeldaUnidad({ u }: { u: FilaPanel }) {
  return <TableCell data-label="Unidad">
    <Link viewTransition to={`/mantenimiento/unidad/${u.unidad.id}`} className="group inline-flex min-h-11 flex-wrap items-center gap-x-2 rounded-sm text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><span className="font-mono font-medium underline underline-offset-4">{u.unidad.nombre}</span><span className="inline-flex items-center gap-1 text-sm font-semibold group-hover:underline group-focus-visible:underline">Ver historial <ArrowRight size={14} aria-hidden="true" /></span></Link>
    <span className="block text-sm text-soft">{u.unidad.tipo}{u.unidad.frente && ` · ${u.unidad.frente}`}</span>
  </TableCell>
}

function UltimaLectura({ u }: { u: FilaPanel }) {
  return <>
    {u.ultima_lectura ? <><span className="tabular-nums">{lectura(u.ultima_lectura.valor, u.unidad.metrica)}</span><span className="block text-sm text-soft tabular-nums">{fecha(u.ultima_lectura.fecha)}</span></> : <span className="text-soft">Sin lecturas</span>}
    {u.ultima_carga_sin_valor && <span className="block text-sm text-correction">⚠ Última carga: falla sin valor ({fecha(u.ultima_carga_sin_valor)})</span>}
  </>
}

function CeldaAccion({ texto, ruta, nombre }: { texto: string; ruta: string; nombre: string }) {
  return <TableCell data-label="Acción" className="text-right">
    <Button asChild size="sm" variant="outline"><Link viewTransition to={ruta} aria-label={`${texto} de ${nombre}`}>{texto}</Link></Button>
  </TableCell>
}

/** Fila de la tabla para estados de carga, vacío o sin resultados. */
function FilaAviso({ columnas, children }: { columnas: number; children: ReactNode }) {
  return <TableRow><TableCell colSpan={columnas}>{children}</TableCell></TableRow>
}

/** Panel técnico de Mantenimiento: lo pendiente de cada rol y el estado de la flota (RF09–RF11, ADR-003). */
export function PanelPage() {
  const panel = usePanel()
  const [pagina, setPagina] = useState(1)
  const fallas = useFallasAbiertas(true, false, pagina)
  const puedeAtender = usePermiso('maintenance.failure.manage')
  const atender = useAtenderFalla()
  const [nota, setNota] = useState<{ id: number; texto: string } | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [frente, setFrente] = useState('')
  const puedeCargarLectura = usePermiso('maintenance.reading.create')
  const puedeCargarMatafuego = usePermiso('maintenance.extinguisher.create')
  // UIX-048: Mantenimiento abre en su trabajo (fallas) y Administración en el suyo (lecturas); el resto consulta la flota.
  // UIX-023: la pestaña va en la URL para que Inicio pueda abrirla directamente
  const inicial: Situacion = puedeAtender ? 'fallas' : puedeCargarLectura ? 'lecturas' : 'todas'
  const [filtros, setFiltros] = useFiltrosUrl<{ situacion: string }>({ situacion: inicial })
  const situacion = SITUACIONES.includes(filtros.situacion as Situacion) ? filtros.situacion as Situacion : inicial
  const { hash } = useLocation()
  const unidades = panel.data ?? []
  const frentes = Array.from(new Set(unidades.flatMap((u) => u.unidad.frente ? [u.unidad.frente] : []))).sort((a, b) => a.localeCompare(b, 'es'))
  const sinLectura = unidades.filter((u) => !u.lectura_semana)
  const conMatafuegoPendiente = unidades.filter((u) => matafuegoPendiente(u.matafuego))
  const buscadas = (lista: FilaPanel[]) => lista.filter((u) => normalizar(u.unidad.nombre).includes(normalizar(busqueda.trim())) && (!frente || u.unidad.frente === frente))
  const delTab = situacion === 'lecturas' ? sinLectura : situacion === 'matafuegos' ? conMatafuegoPendiente : unidades
  const filtradas = buscadas(delTab).sort((a, b) => situacion === 'matafuegos' ? urgenciaMatafuego(b) - urgenciaMatafuego(a) : situacion === 'todas' ? urgencia(b) - urgencia(a) : 0)
  // Ancla de Inicio (#pendientes): se lleva el foco cuando la sección ya tiene datos
  useEffect(() => {
    if (hash !== '#pendientes' || !panel.isSuccess) return
    const destino = document.getElementById('pendientes')
    destino?.scrollIntoView?.({ block: 'start' })
    destino?.focus({ preventScroll: true })
  }, [hash, panel.isSuccess])

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

  const pestanas: { id: Situacion; texto: string; total?: number }[] = [
    { id: 'fallas', texto: 'Fallas', total: fallas.data?.meta.total },
    { id: 'lecturas', texto: 'Lecturas faltantes', total: panel.data && sinLectura.length },
    { id: 'matafuegos', texto: 'Matafuegos', total: panel.data && conMatafuegoPendiente.length },
    { id: 'todas', texto: 'Toda la flota' },
  ]
  const descripcion: Record<Situacion, string> = {
    fallas: 'Reportes de los operarios pendientes de atención',
    lecturas: 'Unidades sin lectura desde el lunes',
    matafuegos: panel.data ? desgloseMatafuegos(unidades) : 'Controles y observaciones',
    todas: 'Lecturas, fallas y controles por unidad; primero lo más urgente',
  }
  const vacio: Record<Situacion, string> = {
    fallas: 'No hay fallas abiertas.',
    lecturas: 'Todas las unidades tienen la lectura de esta semana.',
    matafuegos: 'No hay matafuegos con pendientes.',
    todas: 'No hay unidades activas.',
  }
  const conAccion = (situacion === 'lecturas' && puedeCargarLectura) || (situacion === 'matafuegos' && puedeCargarMatafuego)
  const columnas = situacion === 'todas' ? 4 : conAccion ? 3 : 2

  return (
    <section className="grid gap-6">
      <PageHeader eyebrow="Operación" titulo="Panel técnico" descripcion="Seguimiento de fallas, lecturas y controles de la flota"
        accion={<>{puedeCargarLectura && <Button asChild variant="outline"><Link viewTransition to="/lecturas/nueva">Cargar lectura</Link></Button>}{puedeCargarMatafuego && <Button asChild variant="outline"><Link viewTransition to="/matafuegos/nuevo">Control de matafuego</Link></Button>}</>} />

      {panel.data && panel.data.length >= 200 && <Alert variant="warning" role="status" className="text-sm"><AlertTriangle aria-hidden="true" /><AlertDescription>Se muestran hasta 200 unidades; los resultados y totales podrían estar incompletos.</AlertDescription></Alert>}

      <section id="pendientes" tabIndex={-1} aria-label="Pendientes de mantenimiento" className="min-w-0 scroll-mt-4 outline-none">
        <Tabs value={situacion} onValueChange={(v) => setFiltros({ situacion: v })} className="min-w-0 gap-4">
          <TabsList variant="line" aria-label="Pendientes de mantenimiento" className="w-full justify-start overflow-x-auto rounded-none border-b border-border [scrollbar-width:none] group-data-[orientation=horizontal]/tabs:h-auto">
            {pestanas.map(({ id, texto, total }) => (
              <TabsTrigger key={id} value={id} className="h-auto min-h-11 flex-none px-3 after:bg-brand group-data-[orientation=horizontal]/tabs:after:bottom-0 md:min-h-9">
                {texto}{total !== undefined && ' '}{total !== undefined && <span className={`rounded-full px-1.5 text-xs font-semibold tabular-nums ${total > 0 ? 'bg-warning/15 text-warning' : 'bg-muted text-soft'}`}>{total}</span>}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={situacion} className="grid gap-3">
            <p className="text-sm text-soft">{descripcion[situacion]}</p>

            {situacion === 'fallas' ? <>
              {fallas.isPending && <p role="status" className="text-soft">Cargando fallas…</p>}
              {fallas.isError && <Alert variant="destructive"><AlertDescription className="flex flex-wrap items-center gap-3"><span>No se pudieron cargar las fallas.</span><Button variant="outline" size="sm" onClick={() => void fallas.refetch()}>Reintentar</Button></AlertDescription></Alert>}
              {fallas.data?.data.length === 0 && <p className="rounded-md bg-brand/10 px-4 py-3 text-sm text-soft">{vacio.fallas}</p>}
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
            </> : <>
              <FilterPanel limpiable={!!busqueda || !!frente} onLimpiar={() => { setBusqueda(''); setFrente('') }} columnas="grid-cols-1 sm:grid-cols-2">
                <div className="grid gap-1.5"><Label htmlFor="buscar-unidad">Buscar unidad</Label><div className="relative"><Search aria-hidden="true" size={17} className="pointer-events-none absolute left-3 top-3 text-soft" /><Input id="buscar-unidad" type="search" className="h-10 bg-card pl-9" placeholder="Nombre de la unidad" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></div></div>
                <div className="grid gap-1.5"><Label htmlFor="filtro-frente">Frente</Label><FiltroAutocompletable id="filtro-frente" value={frente} onChange={setFrente}><option value="">Todos</option>{frentes.map((f) => <option key={f} value={f}>{f}</option>)}</FiltroAutocompletable></div>
              </FilterPanel>
              {panel.isError && <Alert variant="destructive"><AlertDescription className="flex flex-wrap items-center gap-3"><span>No se pudo cargar el estado de la flota.</span><Button variant="outline" size="sm" onClick={() => void panel.refetch()}>Reintentar</Button></AlertDescription></Alert>}
              {panel.data && <p className="text-sm text-soft" aria-live="polite">{filtradas.length} de {delTab.length} unidades</p>}
              <div className="surface overflow-x-auto">
                <Table className="tabla-apilada">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unidad</TableHead>
                      {situacion !== 'matafuegos' && <TableHead>Última lectura</TableHead>}
                      {situacion === 'todas' && <TableHead>Fallas</TableHead>}
                      {situacion !== 'lecturas' && <TableHead>Matafuego</TableHead>}
                      {conAccion && <TableHead className="text-right"><span className="sr-only">Acción</span></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {panel.isPending && <FilaAviso columnas={columnas}><span role="status"><Cargando /></span></FilaAviso>}
                    {panel.data && delTab.length === 0 && <FilaAviso columnas={columnas}>{vacio[situacion]}</FilaAviso>}
                    {panel.data && delTab.length > 0 && filtradas.length === 0 && <FilaAviso columnas={columnas}>No hay unidades con esos filtros.</FilaAviso>}
                    {panel.data && filtradas.map((u) => (
                      <TableRow key={u.unidad.id}>
                        <CeldaUnidad u={u} />
                        {situacion !== 'matafuegos' && <TableCell data-label="Última lectura">
                          <UltimaLectura u={u} />
                          {situacion === 'todas' && <span className={`block text-sm ${u.lectura_semana ? 'text-approved' : 'text-warning'}`}>{u.lectura_semana ? '✓ Leída esta semana' : '⚠ Sin lectura desde el lunes'}</span>}
                        </TableCell>}
                        {situacion === 'todas' && <TableCell data-label="Fallas">{u.fallas_abiertas > 0 ? <span className="font-medium text-danger">⚠ {u.fallas_abiertas} abierta{u.fallas_abiertas > 1 && 's'}</span> : <span className="text-soft">—</span>}</TableCell>}
                        {situacion !== 'lecturas' && <TableCell data-label="Matafuego"><Matafuego m={u.matafuego} /></TableCell>}
                        {conAccion && situacion === 'lecturas' && <CeldaAccion texto="Cargar lectura" ruta={`/lecturas/nueva?unidad=${u.unidad.id}`} nombre={u.unidad.nombre} />}
                        {conAccion && situacion === 'matafuegos' && <CeldaAccion texto="Registrar control" ruta={`/matafuegos/nuevo?unidad=${u.unidad.id}`} nombre={u.unidad.nombre} />}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>}
          </TabsContent>
        </Tabs>
      </section>
    </section>
  )
}
