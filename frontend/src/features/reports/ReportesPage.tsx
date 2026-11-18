import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { FiltroAutocompletable } from '@/shared/components/FiltroAutocompletable'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { IntegracionPage } from '@/features/integration/IntegracionPage'
import { usePermiso } from '@/features/auth/api'
import { useFrentes } from '@/features/fronts/api'
import { useUnidadesTodas } from '@/features/machinery/api'
import { useTiposMadera } from '@/features/production/api'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { NativeSelect } from '@/shared/components/ui/native-select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { useConsumosReporte, useHistorico, useMensual, useOperativo, useQuincenal, type Indicadores, type LoteVigente } from './api'
import { fecha, litros, pesos } from './formato'
import { TablaDetalle, TablaProduccion, TablaViajes } from './Tablas'
import { PageHeader } from '@/shared/components/PageHeader'

const hoy = () => new Date().toLocaleDateString('sv-SE')
const mesAnterior = () => {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - 1)
  return d.toLocaleDateString('sv-SE').slice(0, 7)
}
const select = 'h-11 md:h-9'
const ErrorConsulta = ({ q }: { q: { isError: boolean; error: unknown } }) => (q.isError ? <Alert variant="destructive"><AlertDescription>{(q.error as Error).message}</AlertDescription></Alert> : null)

type Pestaña = 'quincenal' | 'historico' | 'mensual' | 'consumos' | 'operativo' | 'integracion'

/** Reportes RF14–RF16. Cada pestaña aparece según el permiso; el backend vuelve a autorizar cada consulta. */
export function ReportesPage() {
  const produccion = usePermiso('reports.production')
  const financiero = usePermiso('reports.financial')
  const operativo = usePermiso('reports.operational')
  const integracion = usePermiso('integration.view-history')
  const pestañas = ([
    ['quincenal', 'Quincenal', produccion], ['historico', 'Producción histórica', produccion],
    ['mensual', 'Consolidado mensual', financiero], ['consumos', 'Consumos', financiero], ['operativo', 'Operativo', operativo],
    // UIX-019: la importación del consolidado alimenta estos reportes; no es un módulo aparte
    ['integracion', 'Integración', integracion],
  ] as const).filter(([, , ok]) => ok)
  // La pestaña va en la URL: los avisos de Inicio y /integracion abren la que corresponde
  const [params, setParams] = useSearchParams()
  const activa: Pestaña = pestañas.find(([id]) => id === params.get('pestana'))?.[0] ?? pestañas[0]?.[0] ?? 'operativo'
  const setActiva = (id: Pestaña) => setParams({ pestana: id }, { replace: true })
  const titulo = pestañas.find(([id]) => id === activa)?.[1] ?? 'Operativo'

  return (
    <section className="grid gap-6">
      <PageHeader eyebrow="Gestión / Reportes" titulo="Reportes" descripcion="Producción, consumos y gastos por período, con filtros históricos" />
      {/* min-w-0: si no, la tira de pestañas (6 para Administración) ensancha la grilla y el layout recorta las tablas */}
      <Tabs value={activa} onValueChange={(v) => setActiva(v as Pestaña)} className="min-w-0 gap-4">
        {/* UIX-032: en el celular, un selector muestra todos los reportes de un vistazo (la tira escondía los de la derecha).
            Con un solo reporte (Mantenimiento) no hay nada que elegir: queda el título */}
        {pestañas.length > 1 && (
          <div className="grid gap-1.5 sm:hidden">
            <Label htmlFor="reporte-activo">Reporte</Label>
            <NativeSelect id="reporte-activo" className="h-11" value={activa} onChange={(e) => setActiva(e.target.value as Pestaña)}>
              {pestañas.map(([id, texto]) => <option key={id} value={id}>{texto}</option>)}
            </NativeSelect>
          </div>
        )}
        {pestañas.length > 1 && <TabsList variant="line" aria-label="Reportes" className="w-full justify-start max-sm:hidden overflow-x-auto rounded-none border-b border-border [scrollbar-width:none] group-data-[orientation=horizontal]/tabs:h-auto">
          {pestañas.map(([id, texto]) => (
            <TabsTrigger key={id} value={id} className="h-auto min-h-11 flex-none px-3 after:bg-brand group-data-[orientation=horizontal]/tabs:after:bottom-0 md:min-h-9">{texto}</TabsTrigger>
          ))}
        </TabsList>}
        <TabsContent value={activa} className="grid gap-4">
          <h2 className="text-xl font-semibold">{titulo}</h2>
          {activa === 'quincenal' && <Quincenal />}
          {activa === 'historico' && <Historico />}
          {activa === 'mensual' && <Mensual />}
          {activa === 'consumos' && <Consumos />}
          {activa === 'operativo' && <Operativo />}
          {activa === 'integracion' && <IntegracionPage />}
        </TabsContent>
      </Tabs>
    </section>
  )
}

function Quincenal() {
  const actual = hoy()
  const [periodo, setPeriodo] = useState(actual.slice(0, 7))
  const [quincena, setQuincena] = useState(Number(actual.slice(8, 10)) <= 15 ? 1 : 2)
  const q = useQuincenal(periodo, quincena)
  return (
    <>
      <div className="surface-quiet flex w-fit max-w-full flex-wrap items-end gap-3 p-4">
        <div className="grid gap-1.5"><Label htmlFor="q-periodo">Mes</Label><Input id="q-periodo" type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} /></div>
        <div className="grid gap-1.5">
          <Label htmlFor="q-numero">Quincena</Label>
          <FiltroAutocompletable id="q-numero" className={select} value={quincena} onChange={(valor) => setQuincena(Number(valor))}>
            <option value={1}>1.ª (días 1 a 15)</option>
            <option value={2}>2.ª (16 a fin de mes)</option>
          </FiltroAutocompletable>
        </div>
      </div>
      <ErrorConsulta q={q} />
      {q.data && (
        <>
          <p>
            <span className="font-medium">Del {fecha(q.data.desde)} al {fecha(q.data.hasta)}.</span>
            {q.data.en_curso && <span className="text-soft"> Quincena en curso: los totales siguen cambiando con cada parte nuevo.</span>}
          </p>
          <TablaProduccion filas={q.data.por_frente} />
          <TablaDetalle filas={q.data.detalle} />
        </>
      )}
    </>
  )
}

function Historico() {
  const [f, setF] = useState({ desde: `${hoy().slice(0, 7)}-01`, hasta: hoy(), frente: '', unidad: '', tipo_madera: '' })
  const frentes = useFrentes('todos')
  const tipos = useTiposMadera()
  const unidades = useUnidadesTodas()
  const q = useHistorico(f)
  return (
    <>
      <div className="surface-quiet flex w-fit max-w-full flex-wrap items-end gap-3 p-4">
        <div className="grid gap-1.5"><Label htmlFor="h-desde">Desde</Label><Input id="h-desde" type="date" value={f.desde} onChange={(e) => setF({ ...f, desde: e.target.value })} /></div>
        <div className="grid gap-1.5"><Label htmlFor="h-hasta">Hasta</Label><Input id="h-hasta" type="date" min={f.desde} value={f.hasta} onChange={(e) => setF({ ...f, hasta: e.target.value })} /></div>
        <div className="grid gap-1.5">
          <Label htmlFor="h-frente">Frente</Label>
          <FiltroAutocompletable id="h-frente" cargando={frentes.isLoading} error={frentes.isError} className={select} value={f.frente} onChange={(valor) => setF({ ...f, frente: valor })}>
            <option value="">Todos</option>
            {frentes.data?.data.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
          </FiltroAutocompletable>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="h-unidad">Máquina</Label>
          <FiltroAutocompletable id="h-unidad" cargando={unidades.isLoading} error={unidades.isError} className={select} value={f.unidad} onChange={(valor) => setF({ ...f, unidad: valor })}>
            <option value="">Todas</option>
            {unidades.data?.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
          </FiltroAutocompletable>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="h-madera">Madera</Label>
          <FiltroAutocompletable id="h-madera" cargando={tipos.isLoading} error={tipos.isError} className={`${select} capitalize`} value={f.tipo_madera} onChange={(valor) => setF({ ...f, tipo_madera: valor })}>
            <option value="">Todas</option>
            {tipos.data?.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
          </FiltroAutocompletable>
        </div>
      </div>
      <ErrorConsulta q={q} />
      {q.data && <><TablaProduccion filas={q.data.por_frente} vacio="No hay producción con esos filtros." /><TablaDetalle filas={q.data.detalle} /></>}
    </>
  )
}

function TablaConsumos({ filas }: { filas: { periodo: string; id_unidad: number; unidad: string; dominio_patente: string | null; litros: string; costo_total: string }[] }) {
  return (
    <div className="surface overflow-x-auto">
      <Table className="tabla-apilada-angosta">
        <TableHeader><TableRow><TableHead>Período</TableHead><TableHead>Máquina</TableHead><TableHead className="text-right">Litros</TableHead><TableHead className="text-right">Costo</TableHead></TableRow></TableHeader>
        <TableBody>
          {filas.map((c) => (
            <TableRow key={`${c.periodo}-${c.id_unidad}`}>
              <TableCell data-label="Período">{c.periodo}</TableCell>
              <TableCell data-label="Máquina">{c.unidad}{c.dominio_patente && <span className="text-sm text-soft"> · {c.dominio_patente}</span>}</TableCell>
              <TableCell data-label="Litros" className="text-right tabular-nums">{litros(c.litros)}</TableCell>
              <TableCell data-label="Costo" className="text-right tabular-nums">{pesos(c.costo_total)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function Mensual() {
  const [periodo, setPeriodo] = useState(mesAnterior())
  const q = useMensual(periodo)
  const d = q.data
  return (
    <>
      <div className="grid w-fit gap-1.5"><Label htmlFor="m-periodo">Período</Label><Input id="m-periodo" type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} /></div>
      <ErrorConsulta q={q} />
      {d && (
        <>
          <EstadoConsumos lote={d.lote_vigente} fechaLimite={d.fecha_limite} vencido={d.es_periodo_vencido} />
          <h2 className="text-lg font-semibold">Producción del mes</h2>
          <TablaProduccion filas={d.produccion} />
          <h2 className="text-lg font-semibold">Viajes</h2>
          <TablaViajes filas={d.viajes} />
          <h2 className="text-lg font-semibold">Mantenimiento</h2>
          <IndicadoresLista i={d.operativo} />
          <h2 className="text-lg font-semibold">Consumos y gastos</h2>
          {d.consumos.length > 0 && <TablaConsumos filas={d.consumos} />}
          {/* UIX-031: sin lote importado no hay total; un 0,00 se leería como "no hubo gasto" */}
          {d.lote_vigente ? <p className="font-semibold">Total: {litros(d.total_consumos.litros)} · {pesos(d.total_consumos.costo_total)}</p> : <p className="text-soft">Sin datos importados: el total aparece cuando se importe el consolidado.</p>}
        </>
      )}
    </>
  )
}

/** D21: estado del lote vigente tal cual; el sistema no puede saber si el período está "completo". */
function EstadoConsumos({ lote, fechaLimite, vencido }: { lote: LoteVigente; fechaLimite: string; vencido: boolean }) {
  const prefijo = vencido ? 'Período vencido. ' : ''
  if (!lote) {
    return <p className="rounded-md border border-warning p-3 text-sm">{prefijo}⚠ Sin consumos importados del sistema de gastos. Tienen que estar importados antes del {fecha(fechaLimite)}.</p>
  }
  const origen = `lote #${lote.id}${lote.archivo ? `, ${lote.archivo}` : ''}, ${fecha(lote.fecha.slice(0, 10))}`
  return lote.estado === 'PARCIAL'
    ? <p className="rounded-md border border-warning p-3 text-sm">{prefijo}⚠ Importado con {lote.filas_con_error} {lote.filas_con_error === 1 ? 'fila' : 'filas'} con error ({origen}): {lote.unidades} unidades. Revisá el detalle en Integración.</p>
    : <p className="rounded-md border border-border p-3 text-sm">{prefijo}✓ Importado sin errores ({origen}): {lote.unidades} unidades.</p>
}

function Consumos() {
  const [f, setF] = useState({ desde: mesAnterior(), hasta: mesAnterior(), unidad: '' })
  const q = useConsumosReporte(f.desde, f.hasta, f.unidad)
  const unidades = useUnidadesTodas()
  return (
    <>
      <div className="surface-quiet flex w-fit max-w-full flex-wrap items-end gap-3 p-4">
        <div className="grid gap-1.5"><Label htmlFor="c-desde">Desde</Label><Input id="c-desde" type="month" value={f.desde} onChange={(e) => setF({ ...f, desde: e.target.value })} /></div>
        <div className="grid gap-1.5"><Label htmlFor="c-hasta">Hasta</Label><Input id="c-hasta" type="month" min={f.desde} value={f.hasta} onChange={(e) => setF({ ...f, hasta: e.target.value })} /></div>
        <div className="grid gap-1.5">
          <Label htmlFor="c-unidad">Máquina</Label>
          <FiltroAutocompletable id="c-unidad" cargando={unidades.isLoading} error={unidades.isError} className={select} value={f.unidad} onChange={(valor) => setF({ ...f, unidad: valor })}>
            <option value="">Todas</option>
            {unidades.data?.map((u) => <option key={u.id} value={u.id}>{u.nombre}{u.dominio_patente && ` · ${u.dominio_patente}`}</option>)}
          </FiltroAutocompletable>
        </div>
      </div>
      {/* D09: el consolidado externo llega por unidad y mes; no se inventa un desglose */}
      <p className="text-sm text-soft">Por frente y por operario: no disponible. El sistema de gastos informa los consumos por máquina y por mes.</p>
      <ErrorConsulta q={q} />
      {q.data && (
        <>
          {q.data.filas.length === 0
            ? <p className="text-soft">Sin datos importados en ese rango: no hay total para mostrar.</p>
            : <><TablaConsumos filas={q.data.filas} /><p className="font-semibold">Total: {litros(q.data.totales.litros)} · {pesos(q.data.totales.costo_total)}</p></>}
        </>
      )}
    </>
  )
}

/** UIX-031: lo del período y la situación de hoy van separados, para no leer lo actual como histórico. */
function IndicadoresLista({ i }: { i: Indicadores }) {
  const grupos: [string, [string, number][]][] = [
    ['En el período', [['Lecturas cargadas', i.lecturas], ['Fallas reportadas', i.fallas_reportadas]]],
    ['Situación actual', [['Fallas abiertas hoy', i.fallas_abiertas], ['Solicitudes de corrección abiertas', i.solicitudes_abiertas],
      ['Unidades sin lectura esta semana', i.unidades_sin_lectura_semana], ['Matafuegos vencidos', i.matafuegos_vencidos]]],
  ]
  return grupos.map(([titulo, items]) => (
    <div key={titulo} className="grid gap-2">
      <h3 className="text-sm font-semibold text-soft">{titulo}</h3>
      <dl className="grid gap-2 sm:grid-cols-3">
        {items.map(([t, v]) => (
          <div key={t} className="surface p-3">
            <dt className="text-sm text-soft">{t}</dt>
            <dd className="text-xl font-semibold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  ))
}

function Operativo() {
  const [f, setF] = useState({ desde: `${hoy().slice(0, 7)}-01`, hasta: hoy() })
  const q = useOperativo(f.desde, f.hasta)
  return (
    <>
      <div className="surface-quiet flex w-fit max-w-full flex-wrap items-end gap-3 p-4">
        <div className="grid gap-1.5"><Label htmlFor="o-desde">Desde</Label><Input id="o-desde" type="date" value={f.desde} onChange={(e) => setF({ ...f, desde: e.target.value })} /></div>
        <div className="grid gap-1.5"><Label htmlFor="o-hasta">Hasta</Label><Input id="o-hasta" type="date" min={f.desde} value={f.hasta} onChange={(e) => setF({ ...f, hasta: e.target.value })} /></div>
      </div>
      <ErrorConsulta q={q} />
      {q.data && <><TablaViajes filas={q.data.viajes} /><IndicadoresLista i={q.data.indicadores} /></>}
    </>
  )
}
