import { Link } from 'react-router'
import { useDashboard } from './api'
import { fecha, litros, pesos, toneladas, totalesPorTipo } from './formato'
import { TablaProduccion } from './Tablas'

function Kpi({ titulo, valor, detalle, alerta = false, to }: { titulo: string; valor: string; detalle?: string; alerta?: boolean; to?: string }) {
  const contenido = (
    <>
      <p className="text-sm text-soft">{titulo}</p>
      <p className={`text-2xl font-semibold tabular-nums ${alerta ? 'text-correction' : ''}`}>{alerta && '⚠ '}{valor}</p>
      {detalle && <p className="text-sm text-soft">{detalle}</p>}
    </>
  )
  const clase = 'grid gap-1 rounded-lg border border-border bg-card p-4'
  return to ? <Link to={to} className={`${clase} hover:border-primary focus-visible:ring-2 focus-visible:ring-ring`}>{contenido}</Link> : <div className={clase}>{contenido}</div>
}

/** Dashboard gerencial: lo que antes llegaba tarde en cuadernitos, al día y explicable desde los registros. */
export function DashboardPage() {
  const q = useDashboard()
  if (q.isPending) return <p role="status">Cargando…</p>
  if (q.isError) return <p role="alert" className="text-danger">{(q.error as Error).message}</p>
  const d = q.data
  const porTipo = totalesPorTipo(d.quincena.por_frente)
  const viajes = Object.fromEntries(d.viajes_quincena.map((v) => [v.estado, v]))
  const o = d.operativo
  const c = d.consumos_vencido

  return (
    <section className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard gerencial</h1>
        <p className="text-soft">Quincena {d.quincena.numero} de {d.quincena.periodo}: del {fecha(d.quincena.desde)} al {fecha(d.hoy)}.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(porTipo.length ? porTipo : [{ tipo_madera: 'pulpable', toneladas: null, metros_cubicos: null }]).map((t) => (
          <Kpi key={t.tipo_madera} titulo={`Producción ${t.tipo_madera} (quincena)`} valor={toneladas(t.toneladas)}
            detalle={t.metros_cubicos ? `y ${Number(t.metros_cubicos).toLocaleString('es-AR', { minimumFractionDigits: 2 })} m³` : undefined} to="/reportes" />
        ))}
        <Kpi titulo="Viajes validados (quincena)" valor={String(viajes.VALIDADO?.viajes ?? 0)} detalle={viajes.VALIDADO ? toneladas(viajes.VALIDADO.toneladas) : undefined} />
        <Kpi titulo="Viajes pendientes de remito" valor={String(viajes.PENDIENTE?.viajes ?? 0)} />
        <Kpi titulo="Correcciones abiertas" valor={String(o.solicitudes_abiertas)} alerta={o.solicitudes_abiertas > 0} />
        <Kpi titulo="Fallas abiertas" valor={String(o.fallas_abiertas)} alerta={o.fallas_abiertas > 0} />
        <Kpi titulo="Unidades sin lectura esta semana" valor={`${o.unidades_sin_lectura_semana} de ${o.unidades_activas}`} alerta={o.unidades_sin_lectura_semana > 0} />
        <Kpi titulo="Matafuegos vencidos" valor={String(o.matafuegos_vencidos)} alerta={o.matafuegos_vencidos > 0} />
        <Kpi titulo={`Gastos de combustible ${c.periodo}`} valor={c.lote_vigente ? pesos(c.costo_total) : 'Sin importar'}
          detalle={!c.lote_vigente ? `Límite: ${fecha(c.fecha_limite)}`
            : `${litros(c.litros)} · ${c.unidades} unidades${c.lote_vigente.filas_con_error ? ` · ${c.lote_vigente.filas_con_error} filas con error` : ''}`}
          alerta={!c.lote_vigente || c.lote_vigente.filas_con_error > 0} to="/reportes" />
      </div>

      <div className="grid gap-3">
        <h2 className="text-lg font-semibold">Producción de la quincena por frente</h2>
        <TablaProduccion filas={d.quincena.por_frente} vacio="Todavía no hay partes cargados en esta quincena." />
      </div>
    </section>
  )
}
