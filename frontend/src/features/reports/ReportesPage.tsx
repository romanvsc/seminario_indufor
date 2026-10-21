import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { usePermiso } from '@/features/auth/api'
import { useFrentes } from '@/features/fronts/api'
import type { Unidad } from '@/features/machinery/api'
import { useTiposMadera } from '@/features/production/api'
import { api } from '@/shared/api/client'
import type { Paginado } from '@/shared/api/types'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { useConsumosReporte, useHistorico, useMensual, useOperativo, useQuincenal, type Indicadores } from './api'
import { fecha, litros, pesos } from './formato'
import { TablaDetalle, TablaProduccion, TablaViajes } from './Tablas'

const hoy = () => new Date().toLocaleDateString('sv-SE')
const mesAnterior = () => {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - 1)
  return d.toLocaleDateString('sv-SE').slice(0, 7)
}
const select = 'h-9 rounded-md border border-input bg-card px-3'
const ErrorConsulta = ({ q }: { q: { isError: boolean; error: unknown } }) => (q.isError ? <p role="alert" className="text-danger">{(q.error as Error).message}</p> : null)

type Pestaña = 'quincenal' | 'historico' | 'mensual' | 'consumos' | 'operativo'

/** Reportes RF14–RF16. Cada pestaña aparece según el permiso; el backend vuelve a autorizar cada consulta. */
export function ReportesPage() {
  const produccion = usePermiso('reports.production')
  const financiero = usePermiso('reports.financial')
  const operativo = usePermiso('reports.operational')
  const pestañas = ([
    ['quincenal', 'Quincenal', produccion], ['historico', 'Producción histórica', produccion],
    ['mensual', 'Consolidado mensual', financiero], ['consumos', 'Consumos', financiero], ['operativo', 'Operativo', operativo],
  ] as const).filter(([, , ok]) => ok)
  const [activa, setActiva] = useState<Pestaña>(pestañas[0]?.[0] ?? 'operativo')

  return (
    <section className="grid gap-4">
      <h1 className="text-2xl font-semibold">Reportes</h1>
      <div role="tablist" aria-label="Reportes" className="flex flex-wrap gap-1 border-b border-border">
        {pestañas.map(([id, texto]) => (
          <button key={id} role="tab" type="button" aria-selected={activa === id} aria-controls={`panel-${id}`} id={`tab-${id}`}
            className={`-mb-px rounded-t-md border-b-2 px-3 py-2 text-sm ${activa === id ? 'border-primary font-medium' : 'border-transparent text-soft hover:text-foreground'}`}
            onClick={() => setActiva(id)}>
            {texto}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${activa}`} aria-labelledby={`tab-${activa}`} className="grid gap-4">
        {activa === 'quincenal' && <Quincenal />}
        {activa === 'historico' && <Historico />}
        {activa === 'mensual' && <Mensual />}
        {activa === 'consumos' && <Consumos />}
        {activa === 'operativo' && <Operativo />}
      </div>
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
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5"><Label htmlFor="q-periodo">Mes</Label><Input id="q-periodo" type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} /></div>
        <div className="grid gap-1.5">
          <Label htmlFor="q-numero">Quincena</Label>
          <select id="q-numero" className={select} value={quincena} onChange={(e) => setQuincena(Number(e.target.value))}>
            <option value={1}>1.ª (días 1 a 15)</option>
            <option value={2}>2.ª (16 a fin de mes)</option>
          </select>
        </div>
      </div>
      <ErrorConsulta q={q} />
      {q.data && (
        <>
          <p className="text-sm text-soft">
            Del {fecha(q.data.desde)} al {fecha(q.data.hasta)}.{q.data.en_curso && ' Quincena en curso: los totales siguen cambiando con cada parte nuevo.'}
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
  const unidades = useQuery({ queryKey: ['machinery', 'todas'], queryFn: () => api<Paginado<Unidad>>('/machinery?estado=todos&per_page=100').then((r) => r.data) })
  const q = useHistorico(f)
  return (
    <>
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5"><Label htmlFor="h-desde">Desde</Label><Input id="h-desde" type="date" value={f.desde} onChange={(e) => setF({ ...f, desde: e.target.value })} /></div>
        <div className="grid gap-1.5"><Label htmlFor="h-hasta">Hasta</Label><Input id="h-hasta" type="date" min={f.desde} value={f.hasta} onChange={(e) => setF({ ...f, hasta: e.target.value })} /></div>
        <div className="grid gap-1.5">
          <Label htmlFor="h-frente">Frente</Label>
          <select id="h-frente" className={select} value={f.frente} onChange={(e) => setF({ ...f, frente: e.target.value })}>
            <option value="">Todos</option>
            {frentes.data?.data.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="h-unidad">Máquina</Label>
          <select id="h-unidad" className={select} value={f.unidad} onChange={(e) => setF({ ...f, unidad: e.target.value })}>
            <option value="">Todas</option>
            {unidades.data?.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="h-madera">Madera</Label>
          <select id="h-madera" className={`${select} capitalize`} value={f.tipo_madera} onChange={(e) => setF({ ...f, tipo_madera: e.target.value })}>
            <option value="">Todas</option>
            {tipos.data?.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
          </select>
        </div>
      </div>
      <ErrorConsulta q={q} />
      {q.data && <><TablaProduccion filas={q.data.por_frente} vacio="No hay producción con esos filtros." /><TablaDetalle filas={q.data.detalle} /></>}
    </>
  )
}

function TablaConsumos({ filas }: { filas: { periodo: string; id_unidad: number; unidad: string; dominio_patente: string | null; litros: string; costo_total: string }[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableHeader><TableRow><TableHead>Período</TableHead><TableHead>Máquina</TableHead><TableHead className="text-right">Litros</TableHead><TableHead className="text-right">Costo</TableHead></TableRow></TableHeader>
        <TableBody>
          {filas.map((c) => (
            <TableRow key={`${c.periodo}-${c.id_unidad}`}>
              <TableCell>{c.periodo}</TableCell>
              <TableCell>{c.unidad}{c.dominio_patente && <span className="text-sm text-soft"> · {c.dominio_patente}</span>}</TableCell>
              <TableCell className="text-right tabular-nums">{litros(c.litros)}</TableCell>
              <TableCell className="text-right tabular-nums">{pesos(c.costo_total)}</TableCell>
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
          <p className={`rounded-md border p-3 text-sm ${d.consumos_importados ? 'border-border' : 'border-warning'}`}>
            {d.es_periodo_vencido ? 'Período vencido. ' : ''}
            {d.consumos_importados
              ? `✓ Consolidado completo: incluye los consumos importados de ${d.total_consumos.unidades} unidades.`
              : `⚠ Faltan los consumos del sistema de gastos. Tienen que estar importados antes del ${fecha(d.fecha_limite)}.`}
          </p>
          <h2 className="text-lg font-semibold">Producción del mes</h2>
          <TablaProduccion filas={d.produccion} />
          <h2 className="text-lg font-semibold">Viajes</h2>
          <TablaViajes filas={d.viajes} />
          <h2 className="text-lg font-semibold">Mantenimiento</h2>
          <IndicadoresLista i={d.operativo} />
          <h2 className="text-lg font-semibold">Consumos y gastos</h2>
          {d.consumos.length > 0 && <TablaConsumos filas={d.consumos} />}
          <p className="font-semibold">Total: {litros(d.total_consumos.litros)} · {pesos(d.total_consumos.costo_total)}</p>
        </>
      )}
    </>
  )
}

function Consumos() {
  const [f, setF] = useState({ desde: mesAnterior(), hasta: mesAnterior(), unidad: '' })
  const q = useConsumosReporte(f.desde, f.hasta, f.unidad)
  return (
    <>
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5"><Label htmlFor="c-desde">Desde</Label><Input id="c-desde" type="month" value={f.desde} onChange={(e) => setF({ ...f, desde: e.target.value })} /></div>
        <div className="grid gap-1.5"><Label htmlFor="c-hasta">Hasta</Label><Input id="c-hasta" type="month" min={f.desde} value={f.hasta} onChange={(e) => setF({ ...f, hasta: e.target.value })} /></div>
      </div>
      {/* D09: el consolidado externo llega por unidad y mes; no se inventa un desglose */}
      <p className="text-sm text-soft">Por frente y por operario: no disponible. El sistema de gastos informa los consumos por máquina y por mes.</p>
      <ErrorConsulta q={q} />
      {q.data && (
        <>
          {q.data.filas.length === 0 ? <p className="text-soft">No hay consumos importados en ese rango.</p> : <TablaConsumos filas={q.data.filas} />}
          <p className="font-semibold">Total: {litros(q.data.totales.litros)} · {pesos(q.data.totales.costo_total)}</p>
        </>
      )}
    </>
  )
}

function IndicadoresLista({ i }: { i: Indicadores }) {
  const items: [string, number][] = [
    ['Lecturas cargadas', i.lecturas], ['Fallas reportadas', i.fallas_reportadas], ['Fallas abiertas hoy', i.fallas_abiertas],
    ['Solicitudes de corrección abiertas', i.solicitudes_abiertas], ['Unidades sin lectura esta semana', i.unidades_sin_lectura_semana], ['Matafuegos vencidos', i.matafuegos_vencidos],
  ]
  return (
    <dl className="grid gap-2 sm:grid-cols-3">
      {items.map(([t, v]) => (
        <div key={t} className="rounded-lg border border-border bg-card p-3">
          <dt className="text-sm text-soft">{t}</dt>
          <dd className="text-xl font-semibold tabular-nums">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

function Operativo() {
  const [f, setF] = useState({ desde: `${hoy().slice(0, 7)}-01`, hasta: hoy() })
  const q = useOperativo(f.desde, f.hasta)
  return (
    <>
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5"><Label htmlFor="o-desde">Desde</Label><Input id="o-desde" type="date" value={f.desde} onChange={(e) => setF({ ...f, desde: e.target.value })} /></div>
        <div className="grid gap-1.5"><Label htmlFor="o-hasta">Hasta</Label><Input id="o-hasta" type="date" min={f.desde} value={f.hasta} onChange={(e) => setF({ ...f, hasta: e.target.value })} /></div>
      </div>
      <ErrorConsulta q={q} />
      {q.data && <><TablaViajes filas={q.data.viajes} /><IndicadoresLista i={q.data.indicadores} /></>}
    </>
  )
}
