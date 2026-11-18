import { GaugeIcon } from '@animateicons/react/lucide/gauge-icon'
import { LayersIcon } from '@animateicons/react/lucide/layers-icon'
import { TruckIcon } from '@animateicons/react/lucide/truck-icon'
import { ArrowUpRight, Fuel, PrinterIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts'
import { Cargando } from '@/shared/components/Cargando'
import { Button } from '@/shared/components/ui/button'
import { useDashboard } from './api'
import { fecha, litros, numero, pesos, toneladas } from './formato'
import { cargaPorFrente, porSemana, totalToneladas, variacion } from './resumen'

const SERIES = [
  { clave: 'pulpable', texto: 'Pulpable', color: 'var(--color-chart-pulpable)' },
  { clave: 'aserrable', texto: 'Aserrable', color: 'var(--color-chart-aserrable)' },
] as const

function Panel({ titulo, ver, children, className = '' }: { titulo: string; ver?: { texto: string; to: string }; children: ReactNode; className?: string }) {
  return (
    <section className={`surface grid content-start gap-4 p-4 sm:p-5 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">{titulo}</h3>
        {ver && <Link viewTransition to={ver.to} className="-my-3 flex min-h-11 shrink-0 items-center gap-1 text-sm whitespace-nowrap text-soft underline-offset-4 hover:text-foreground hover:underline">{ver.texto}<ArrowUpRight aria-hidden="true" size={16} /></Link>}
      </div>
      {children}
    </section>
  )
}

/** La comparación es neutra (flecha y texto): subir o bajar no es bueno ni malo por sí solo, y el teal no comunica estados. */
function Comparacion({ actual, anterior }: { actual: number; anterior: number }) {
  const v = variacion(actual, anterior)
  if (v === null) return <span className="text-xs text-muted-foreground">Sin datos del tramo anterior</span>
  return <span className="text-xs text-soft"><span aria-hidden="true">{v > 0 ? '▲' : v < 0 ? '▼' : '='}</span> {v > 0 ? '+' : ''}{v} % vs. el mismo tramo de la quincena anterior</span>
}

function Kpi({ titulo, icono, valor, unidad, pie, alerta = false, to }: {
  titulo: string; icono: ReactNode; valor: string; unidad?: string; pie: ReactNode; alerta?: boolean; to?: string
}) {
  const cuerpo = (
    <>
      <span className="flex items-center justify-between gap-2 text-sm font-medium text-soft">{titulo}<span aria-hidden="true" className="text-muted-foreground">{icono}</span></span>
      {/* Un texto (p. ej. "Sin importar") va más chico que un número para no partirse */}
      <span className={`leading-none font-bold tracking-tight tabular-nums ${/\d/.test(valor) ? 'text-2xl sm:text-3xl' : 'text-xl'}`}>
        {alerta && <span aria-hidden="true">⚠ </span>}{valor}{unidad && <span className="ml-1 text-base font-medium text-soft">{unidad}</span>}
      </span>
      {pie}
    </>
  )
  // El tinte va sobre bg-surface opaca: translúcido sobre el Grainient claro, text-soft quedaba en 4,39:1
  const clase = `grid min-w-0 content-between gap-3 p-3 sm:p-4 ${alerta ? 'rounded-2xl border border-warning/50 bg-surface bg-linear-to-b from-warning/10 to-warning/10' : 'surface'}`
  return to ? <Link viewTransition to={to} className={`${clase} surface-interactive`}>{cuerpo}</Link> : <div className={clase}>{cuerpo}</div>
}

function Globo({ active, payload, label }: TooltipContentProps<number, string>) {
  if (!active || !payload?.length) return null
  return (
    <div className="grid gap-1 rounded-md border border-border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
      <p className="font-medium">Semana del {label}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="flex items-center gap-2 tabular-nums">
          <span aria-hidden="true" className="size-2.5 rounded-sm" style={{ background: p.color }} />
          {SERIES.find((s) => s.clave === p.dataKey)?.texto}: {numero(Number(p.value))} t
        </p>
      ))}
    </div>
  )
}

function Barra({ porcentaje, etiqueta }: { porcentaje: number; etiqueta: string }) {
  return (
    <span role="meter" aria-label={etiqueta} aria-valuenow={porcentaje} aria-valuemin={0} aria-valuemax={100} className="block h-2 overflow-hidden rounded-full bg-secondary">
      <span className="block h-full rounded-full bg-brand" style={{ width: `${porcentaje}%` }} />
    </span>
  )
}

/**
 * Dashboard gerencial (RF14–RF16) dentro de Inicio (UIX-018; UIX-021 compacto): 4 KPI, producción por semana y carga por frente.
 * Lo pendiente (viajes sin remito, fallas, matafuegos) vive solo en la lista de pendientes de Inicio: no se repite acá.
 */
export function ResumenQuincena() {
  const q = useDashboard()
  if (q.isPending) return <p role="status"><Cargando /></p>
  if (q.isError) return <p className="text-sm text-soft">No se pudo consultar el resumen de la quincena: {(q.error as Error).message}</p>
  const d = q.data
  const o = d.operativo
  const c = d.consumos_vencido
  const validados = (v: typeof d.viajes_quincena) => v.find((x) => x.estado === 'VALIDADO')
  const viajesHoy = validados(d.viajes_quincena)
  const viajesAntes = validados(d.tramo_anterior.viajes)
  const produccion = totalToneladas(d.quincena.por_frente)
  const m3 = totalToneladas(d.quincena.por_frente.map((f) => ({ toneladas: f.metros_cubicos })))
  const semanas = porSemana(d.serie_30_dias.filas)
  const frentes = cargaPorFrente(d.quincena.por_frente)
  const leidas = o.unidades_activas - o.unidades_sin_lectura_semana
  const pctLeidas = o.unidades_activas ? Math.round((leidas / o.unidades_activas) * 100) : 0

  return (
    <section aria-labelledby="resumen-quincena" className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="resumen-quincena" className="text-sm font-normal text-soft">
          <span className="font-semibold text-foreground">Quincena {d.quincena.numero} de {d.quincena.periodo}</span>: del {fecha(d.quincena.desde)} al {fecha(d.hoy)}
        </h2>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" size="sm" className="hidden md:inline-flex" onClick={() => window.print()}><PrinterIcon aria-hidden="true" />Imprimir</Button>
          <Button variant="outline" size="sm" asChild><Link viewTransition to="/reportes">Ver reportes</Link></Button>
        </div>
      </div>

      {/* MOB-04: dos columnas en el celular; una sola obligaba a scrollear una pantalla entera de KPI */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
        <Kpi titulo="Producción de la quincena" icono={<LayersIcon size={20} />} valor={numero(produccion)} unidad="t" to="/reportes"
          pie={<span className="grid gap-0.5"><Comparacion actual={produccion} anterior={totalToneladas(d.tramo_anterior.por_frente)} />{m3 > 0 && <span className="text-xs text-muted-foreground">y {numero(m3)} m³</span>}</span>} />
        <Kpi titulo="Viajes validados" icono={<TruckIcon size={20} />} valor={String(viajesHoy?.viajes ?? 0)}
          pie={<span className="grid gap-0.5"><Comparacion actual={viajesHoy?.viajes ?? 0} anterior={viajesAntes?.viajes ?? 0} />{viajesHoy && <span className="text-xs text-muted-foreground">{toneladas(viajesHoy.toneladas)} declaradas</span>}</span>} />
        <Kpi titulo="Lecturas de la semana" icono={<GaugeIcon size={20} />} valor={String(pctLeidas)} unidad="%"
          alerta={o.unidades_sin_lectura_semana > 0}
          pie={<span className="text-xs text-soft">{leidas} de {o.unidades_activas} unidades leídas desde el lunes</span>} />
        <Kpi titulo={`Combustible ${c.periodo}`} icono={<Fuel size={20} />} valor={c.lote_vigente ? pesos(c.costo_total) : 'Sin importar'} to="/reportes?pestana=mensual"
          alerta={!c.lote_vigente || c.lote_vigente.filas_con_error > 0}
          pie={<span className="text-xs text-soft">{!c.lote_vigente ? `Límite de importación: ${fecha(c.fecha_limite)}`
            : `${litros(c.litros)} · ${c.unidades} unidades${c.lote_vigente.filas_con_error ? ` · ${c.lote_vigente.filas_con_error} filas con error` : ''}`}</span>} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel titulo="Producción por semana" ver={{ texto: 'Histórico', to: '/reportes?pestana=historico' }}>
          <figure className="grid gap-2">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-soft">
              <span>Últimos 30 días: <span className="font-semibold text-foreground tabular-nums">{numero(totalToneladas(d.serie_30_dias.filas))} t</span></span>
              <ul aria-hidden="true" className="flex gap-4">
                {SERIES.map((s) => <li key={s.clave} className="flex items-center gap-2"><span className="size-2.5 rounded-sm" style={{ background: s.color }} />{s.texto}</li>)}
              </ul>
            </div>
            <div className="h-52" aria-hidden="true">
              {semanas.length === 0 ? <p className="grid h-full place-items-center text-sm text-soft">Sin partes en los últimos 30 días.</p> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={semanas} barGap={2} barCategoryGap="28%" accessibilityLayer={false}>
                    <CartesianGrid vertical={false} stroke="var(--color-border-default)" />
                    <XAxis dataKey="semana" tickLine={false} axisLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                    <YAxis width={40} tickLine={false} axisLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                    <Tooltip content={Globo} cursor={{ fill: 'var(--color-bg-subtle)' }} />
                    {SERIES.map((s) => <Bar key={s.clave} dataKey={s.clave} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />)}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            {/* Vista en tabla del gráfico, para lectores de pantalla */}
            <table className="sr-only">
              <caption>Toneladas por semana y tipo de madera, últimos 30 días</caption>
              <thead><tr><th>Semana del</th><th>Pulpable</th><th>Aserrable</th></tr></thead>
              <tbody>{semanas.map((s) => <tr key={s.semana}><td>{s.semana}</td><td>{numero(s.pulpable)} t</td><td>{numero(s.aserrable)} t</td></tr>)}</tbody>
            </table>
            <figcaption className="text-xs text-muted-foreground">En toneladas. Los metros cúbicos no se convierten: están en Reportes.</figcaption>
          </figure>
        </Panel>

        <Panel titulo="Carga por frente" ver={{ texto: 'Detalle', to: '/reportes' }}>
          {frentes.length === 0 ? <p className="text-sm text-soft">Todavía no hay partes en esta quincena.</p> : (
            <ul className="grid gap-4">
              {frentes.map((f) => (
                <li key={f.frente} className="grid gap-1.5">
                  {/* MOB-07: un frente que solo carga m³ no tiene "0 t · 0 %": se muestran sus m³, sin barra de toneladas */}
                  <span className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="font-medium">{f.frente}</span>
                    <span className="tabular-nums text-soft">{f.toneladas > 0 ? `${numero(f.toneladas)} t · ${f.porcentaje} %` : `${numero(f.metros_cubicos)} m³`}</span>
                  </span>
                  {f.toneladas > 0 ? <Barra porcentaje={f.porcentaje} etiqueta={`${f.frente}: ${f.porcentaje} % de las toneladas`} />
                    : <span className="text-xs text-muted-foreground">Mide en metros cúbicos: no suma a las toneladas.</span>}
                  {f.toneladas > 0 && f.metros_cubicos > 0 && <span className="text-xs text-muted-foreground">y {numero(f.metros_cubicos)} m³</span>}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </section>
  )
}
