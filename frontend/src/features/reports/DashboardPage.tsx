import { FileCheckIcon } from '@animateicons/react/lucide/file-check-icon'
import { FlameIcon } from '@animateicons/react/lucide/flame-icon'
import { GaugeIcon } from '@animateicons/react/lucide/gauge-icon'
import { LayersIcon } from '@animateicons/react/lucide/layers-icon'
import { TruckIcon } from '@animateicons/react/lucide/truck-icon'
import { WrenchIcon } from '@animateicons/react/lucide/wrench-icon'
import { Fuel } from 'lucide-react'
import type { ReactNode } from 'react'
import { useDashboard } from './api'
import { fecha, litros, pesos, toneladas, totalesPorTipo } from './formato'
import { TablaProduccion } from './Tablas'
import { PageHeader } from '@/shared/components/PageHeader'
import { KpiCard } from '@/shared/components/KpiCard'

// La alerta se comunica con ⚠ y texto además del tono, nunca solo con color
function Kpi({ titulo, valor, detalle, alerta = false, to, icono }: { titulo: string; valor: string; detalle?: string; alerta?: boolean; to?: string; icono: ReactNode }) {
  return <KpiCard vertical icono={icono} titulo={titulo} valor={`${alerta ? '⚠ ' : ''}${valor}`} detalle={detalle} to={to} tono={alerta ? 'atencion' : 'neutro'} />
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
      <PageHeader eyebrow="Gestión / Dashboard" titulo="Dashboard gerencial" fondo="/header-bosque.webp"
        descripcion={`Quincena ${d.quincena.numero} de ${d.quincena.periodo}: del ${fecha(d.quincena.desde)} al ${fecha(d.hoy)}.`} />

      <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-3">
        {(porTipo.length ? porTipo : [{ tipo_madera: 'pulpable', toneladas: null, metros_cubicos: null }]).map((t) => (
          <Kpi key={t.tipo_madera} icono={<LayersIcon size={22} />} titulo={`Producción ${t.tipo_madera} (quincena)`} valor={toneladas(t.toneladas)}
            detalle={t.metros_cubicos ? `y ${Number(t.metros_cubicos).toLocaleString('es-AR', { minimumFractionDigits: 2 })} m³` : undefined} to="/reportes" />
        ))}
        <Kpi icono={<TruckIcon size={22} />} titulo="Viajes validados (quincena)" valor={String(viajes.VALIDADO?.viajes ?? 0)} detalle={viajes.VALIDADO ? toneladas(viajes.VALIDADO.toneladas) : undefined} />
        <Kpi icono={<TruckIcon size={22} />} titulo="Viajes pendientes de remito" valor={String(viajes.PENDIENTE?.viajes ?? 0)} />
        <Kpi icono={<FileCheckIcon size={22} />} titulo="Correcciones abiertas" valor={String(o.solicitudes_abiertas)} alerta={o.solicitudes_abiertas > 0} />
        <Kpi icono={<WrenchIcon size={22} />} titulo="Fallas abiertas" valor={String(o.fallas_abiertas)} alerta={o.fallas_abiertas > 0} />
        <Kpi icono={<GaugeIcon size={22} />} titulo="Unidades sin lectura esta semana" valor={`${o.unidades_sin_lectura_semana} de ${o.unidades_activas}`} alerta={o.unidades_sin_lectura_semana > 0} />
        <Kpi icono={<FlameIcon size={22} />} titulo="Matafuegos vencidos" valor={String(o.matafuegos_vencidos)} alerta={o.matafuegos_vencidos > 0} />
        <Kpi icono={<Fuel size={22} />} titulo={`Gastos de combustible ${c.periodo}`} valor={c.lote_vigente ? pesos(c.costo_total) : 'Sin importar'}
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
