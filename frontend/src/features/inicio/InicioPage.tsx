import { useIconHover } from '@animateicons/react'
import { ArrowRightIcon } from '@animateicons/react/lucide/arrow-right-icon'
import { CalendarIcon } from '@animateicons/react/lucide/calendar-icon'
import { ClipboardListIcon } from '@animateicons/react/lucide/clipboard-list-icon'
import { ClockIcon } from '@animateicons/react/lucide/clock-icon'
import { FactoryIcon } from '@animateicons/react/lucide/factory-icon'
import { FileCheckIcon } from '@animateicons/react/lucide/file-check-icon'
import { FileUpIcon } from '@animateicons/react/lucide/file-up-icon'
import { FlameIcon } from '@animateicons/react/lucide/flame-icon'
import { GaugeIcon } from '@animateicons/react/lucide/gauge-icon'
import { LayersIcon } from '@animateicons/react/lucide/layers-icon'
import { LayoutDashboardIcon } from '@animateicons/react/lucide/layout-dashboard-icon'
import { TriangleAlertIcon } from '@animateicons/react/lucide/triangle-alert-icon'
import { TruckIcon } from '@animateicons/react/lucide/truck-icon'
import { UploadIcon } from '@animateicons/react/lucide/upload-icon'
import { WrenchIcon } from '@animateicons/react/lucide/wrench-icon'
import { ZapIcon } from '@animateicons/react/lucide/zap-icon'
import { useState, type ComponentProps, type ComponentType } from 'react'
import { Link } from 'react-router'
import { useUsuarioActual } from '@/features/auth/api'
import { listarBorradores } from '@/shared/borrador'
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus'
import { useActividad, usePendientes, type Evento } from './api'
import { avisos, indicadores, type Clave, type Nivel } from './reglas'

type Icono = ComponentType<ComponentProps<typeof TruckIcon>>

const ICONO: Record<Clave, Icono> = {
  viajes_sin_remito: TruckIcon, mis_viajes_pendientes: TruckIcon, mis_viajes_en_correccion: TruckIcon,
  lecturas_sin_exportar: LayersIcon, fallas_abiertas: WrenchIcon, matafuegos_vencidos: FlameIcon,
  unidades_sin_lectura_semana: GaugeIcon, correcciones_abiertas: FileCheckIcon, consumos_periodo_vencido: FileUpIcon,
}
// Estilo por gravedad: crítico (rojo), atención (ámbar), seguimiento (verde), sin pendientes (neutro)
const TONO: Record<Nivel | 'ok', { tarjeta: string; icono: string; iconoFila?: string; barra: string; insignia: string }> = {
  critico: { tarjeta: 'border-danger/50 bg-danger/10', icono: 'bg-danger/20 text-danger', barra: 'border-l-danger', insignia: 'bg-danger/15 text-danger' },
  atencion: { tarjeta: 'border-warning/50 bg-warning/10', icono: 'bg-warning/20 text-warning', barra: 'border-l-warning', insignia: 'bg-warning/15 text-warning' },
  seguimiento: { tarjeta: 'border-brand/40 bg-brand/10', icono: 'bg-brand/20 text-brand', iconoFila: 'bg-secondary text-soft', barra: 'border-l-border-strong', insignia: 'bg-secondary text-foreground' },
  ok: { tarjeta: 'border-border bg-card', icono: 'bg-secondary text-soft', barra: 'border-l-border', insignia: 'bg-secondary text-soft' },
}
const NIVEL: Record<Nivel, string> = { critico: 'Crítico', atencion: 'Atención', seguimiento: 'Seguimiento' }
const BORRADORES: Record<string, { texto: string; ruta: string }> = {
  parte: { texto: 'Parte de producción', ruta: '/produccion/nuevo' },
  lectura: { texto: 'Lectura', ruta: '/lecturas/nueva' },
  matafuego: { texto: 'Control de matafuego', ruta: '/matafuegos/nuevo' },
  viaje: { texto: 'Viaje', ruta: '/viajes/nuevo' },
}
const ACTIVIDAD: Record<string, string> = {
  'produccion.registrada': 'Parte de producción cargado', 'produccion.corregida': 'Parte corregido', 'viaje.declarado': 'Viaje declarado',
  'remito.cargado': 'Remito cargado', 'remito.corregido': 'Remito corregido', 'solicitud.creada': 'Corrección solicitada',
  'solicitud.resuelta': 'Corrección aplicada', 'lectura.registrada': 'Lectura registrada', 'falla.reportada': 'Falla reportada',
  'falla.atendida': 'Falla atendida', 'matafuego.controlado': 'Matafuego controlado', 'consumos.importados': 'Consolidado importado',
  'consumos.reemplazados': 'Consolidado reemplazado',
}

const hora = (iso: string) => iso.slice(11, 16)
function cuando(iso: string) {
  const dia = iso.slice(0, 10)
  const hoy = new Date().toLocaleDateString('sv-SE')
  const ayer = new Date(Date.now() - 86_400_000).toLocaleDateString('sv-SE')
  return `${dia === hoy ? 'Hoy' : dia === ayer ? 'Ayer' : dia.split('-').reverse().slice(0, 2).join('/')}, ${hora(iso)}`
}
const fechaDeHoy = () => {
  const t = new Date().toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })
  return t.charAt(0).toUpperCase() + t.slice(1)
}

// P2: accesos frecuentes ordenados por uso en este equipo (comodidad local, no un dato del sistema)
const USO = 'indufor:accesos-uso'
const leerUso = (): Record<string, number> => {
  try {
    return JSON.parse(localStorage.getItem(USO) ?? '{}') as Record<string, number>
  } catch {
    return {}
  }
}
const registrarUso = (ruta: string) => {
  try {
    const uso = leerUso()
    localStorage.setItem(USO, JSON.stringify({ ...uso, [ruta]: (uso[ruta] ?? 0) + 1 }))
  } catch {
    // sin almacenamiento solo se pierde el orden por uso
  }
}

function FilaAviso({ a }: { a: ReturnType<typeof avisos>[number] }) {
  const { ref, triggerProps } = useIconHover()
  const Icono = a.nivel === 'critico' ? TriangleAlertIcon : ICONO[a.clave]
  const t = TONO[a.nivel]
  return (
    <li>
      <Link to={a.ruta} {...triggerProps} className={`flex items-center gap-3 rounded-xl border border-border border-l-4 bg-card p-3 hover:bg-secondary sm:gap-4 sm:p-4 ${t.barra}`}>
        <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${t.iconoFila ?? t.icono}`}><Icono ref={ref} size={20} /></span>
        <span className="grid min-w-0 flex-1 gap-0.5">
          <span className="font-semibold">{a.titulo}</span>
          <span className="text-sm text-soft">{a.area} · {a.contexto}</span>
        </span>
        <span className={`hidden shrink-0 rounded-full px-3 py-1 text-xs font-semibold sm:inline ${t.insignia}`}>{NIVEL[a.nivel]}</span>
        <span className="sr-only">, {NIVEL[a.nivel]}</span>
        <ArrowRightIcon size={18} className="shrink-0 text-soft" />
      </Link>
    </li>
  )
}

function Tarjeta({ i }: { i: ReturnType<typeof indicadores>[number] }) {
  const { ref, triggerProps } = useIconHover()
  const Icono = ICONO[i.clave]
  const t = TONO[i.nivel]
  return (
    <Link to={i.ruta} {...triggerProps} aria-label={`${i.titulo}: ${i.valor}. ${i.subtitulo}`}
      className={`flex flex-col items-start gap-3 rounded-2xl border p-3 transition-colors hover:brightness-110 sm:flex-row sm:gap-4 sm:p-4 ${t.tarjeta}`}>
      <span className={`grid size-10 shrink-0 place-items-center rounded-xl sm:size-12 ${t.icono}`}><Icono ref={ref} size={22} /></span>
      <span className="grid gap-0.5">
        <span className="text-sm font-medium">{i.titulo}</span>
        <span className="text-3xl leading-tight font-bold tabular-nums">{i.valor}</span>
        <span className="text-sm text-soft">{i.subtitulo}</span>
      </span>
    </Link>
  )
}

function Accion({ a, destacada }: { a: { texto: string; ruta: string; icono: Icono }; destacada: boolean }) {
  const { ref, triggerProps } = useIconHover()
  return (
    <Link to={a.ruta} {...triggerProps} onClick={() => registrarUso(a.ruta)}
      className={`flex min-h-14 items-center gap-3 rounded-xl border px-4 py-3 font-semibold focus-visible:ring-2 focus-visible:ring-ring ${
        destacada ? 'border-brand/60 bg-primary text-primary-foreground hover:bg-primary-hover' : 'border-border bg-card hover:bg-secondary'}`}>
      <a.icono ref={ref} size={22} className="shrink-0" />
      <span className="flex-1">{a.texto}</span>
      <ArrowRightIcon size={18} className="shrink-0 opacity-80" />
    </Link>
  )
}

function Actividad({ eventos }: { eventos: Evento[] }) {
  if (eventos.length === 0) return <p className="text-sm text-soft">Todavía no hay actividad registrada.</p>
  return (
    <ol className="relative grid gap-3 border-l border-border pl-5">
      {eventos.map((e) => (
        <li key={e.id} className="relative grid gap-0.5 text-sm sm:grid-cols-[6.5rem_1fr] sm:gap-3">
          <span aria-hidden="true" className="absolute top-1.5 -left-[1.6rem] size-2.5 rounded-full bg-brand ring-4 ring-card" />
          <span className="text-soft tabular-nums">{cuando(e.fecha)}</span>
          <span><strong className="font-semibold">{ACTIVIDAD[e.accion] ?? e.accion}</strong>{e.contexto && <span className="text-soft"> · {e.contexto}</span>}</span>
        </li>
      ))}
    </ol>
  )
}

/** Inicio por rol (spec 07, D26; rediseño del 2026-11-03): indicadores, alertas con gravedad, accesos y actividad. */
export function InicioPage() {
  const usuario = useUsuarioActual().data
  const pendientes = usePendientes()
  const actividad = useActividad()
  const online = useOnlineStatus()
  const [uso] = useState(leerUso)
  // Permisos solo para adaptar la vista (como usePermiso): la autorización real la hace el backend
  const tiene = (p: string) => usuario?.permisos.includes(p) ?? false
  const gestion = tiene('dashboard.management') || tiene('logistics.remito.create') || tiene('integration.import-costs')
  const posibles = [
    { permiso: tiene('logistics.remito.create'), texto: 'Cargar remito', ruta: '/viajes?estado=PENDIENTE', icono: TruckIcon },
    { permiso: tiene('integration.import-costs'), texto: 'Importar consolidado', ruta: '/integracion', icono: UploadIcon },
    { permiso: tiene('production.create'), texto: 'Cargar parte', ruta: '/produccion/nuevo', icono: FactoryIcon },
    { permiso: tiene('maintenance.reading.create'), texto: 'Cargar lectura', ruta: '/lecturas/nueva', icono: GaugeIcon },
    { permiso: tiene('maintenance.extinguisher.create'), texto: 'Control de matafuego', ruta: '/matafuegos/nuevo', icono: FlameIcon },
    { permiso: tiene('logistics.trip.create'), texto: 'Declarar viaje', ruta: '/viajes/nuevo', icono: TruckIcon },
    { permiso: tiene('maintenance.failure.view'), texto: 'Panel técnico', ruta: '/mantenimiento', icono: WrenchIcon },
    { permiso: tiene('dashboard.management'), texto: 'Dashboard', ruta: '/dashboard', icono: LayoutDashboardIcon },
    { permiso: tiene('maintenance.reading.view'), texto: 'Ver lecturas', ruta: '/lecturas', icono: ClipboardListIcon },
  ]
  // Orden por uso en el equipo; a igual uso, el orden de la tarea principal del rol
  const acciones = posibles.filter((a) => a.permiso).map((a, i) => ({ ...a, i }))
    .sort((x, y) => (uso[y.ruta] ?? 0) - (uso[x.ruta] ?? 0) || x.i - y.i).slice(0, 6)

  const datos = pendientes.data
  const lista = datos ? avisos(datos.data) : []
  const tarjetas = datos ? indicadores(datos.data) : []
  const borradores = usuario ? listarBorradores(usuario.id) : []
  const rol = usuario?.roles[0]?.nombre ?? ''
  // Sin señal o con error se siguen mostrando los últimos datos, con su hora: nunca se inventa un estado.
  // Una copia local de antes se nota porque el servidor la generó mucho antes de que la consulta la entregara.
  const viejos = datos && (!online || pendientes.isError || pendientes.dataUpdatedAt - new Date(datos.meta.generado_at.replace(' ', 'T')).getTime() > 5 * 60_000)

  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-1">
          <p className="text-xs font-semibold tracking-[0.18em] text-brand uppercase">INDUFOR{rol && ` / ${rol}`}</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{gestion ? 'Centro de operaciones' : 'Mi jornada'}</h1>
          <p className="text-soft">Hola, {usuario?.nombre}. {gestion ? 'Resumen de la operación y tareas que requieren tu atención.' : 'Tus cargas y lo que tenés pendiente.'}</p>
        </div>
        <div className="grid justify-items-end gap-1.5">
          <span className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium"><CalendarIcon size={18} />{fechaDeHoy()}</span>
          <span role="status" className={`flex items-center gap-1.5 text-xs ${viejos ? 'text-warning' : 'text-soft'}`}>
            <ClockIcon size={14} />
            {!datos ? (pendientes.isError ? 'No se pudieron consultar los pendientes' : 'Consultando…')
              : viejos ? `Mostrando datos de las ${hora(datos.meta.generado_at)}${!online ? ' · sin conexión' : ''}`
              : `Actualizado a las ${hora(datos.meta.generado_at)}`}
          </span>
        </div>
      </div>

      {tarjetas.length > 0 && (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{tarjetas.map((i) => <Tarjeta key={i.clave} i={i} />)}</div>
      )}

      {borradores.length > 0 && (
        <div role="status" className="grid gap-2 rounded-2xl border border-warning/50 bg-warning/10 p-4">
          <p className="font-semibold">⚠ {borradores.length === 1 ? 'Tenés 1 borrador sin enviar' : `Tenés ${borradores.length} borradores sin enviar`} en este equipo</p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {borradores.map((t) => BORRADORES[t] && (
              <li key={t}><Link to={BORRADORES[t].ruta} className="underline underline-offset-4">Seguir con: {BORRADORES[t].texto}</Link></li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="grid gap-4 rounded-2xl border border-border bg-card/60 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <ClipboardListIcon size={26} className="mt-0.5 text-brand" />
              <div>
                <h2 className="text-xl font-semibold">Pendientes y alertas</h2>
                <p className="text-sm text-soft">Situaciones que requieren gestión.</p>
              </div>
            </div>
            {lista.length > 0 && <span className="shrink-0 rounded-full border border-border px-3 py-1 text-sm">{lista.length === 1 ? '1 pendiente' : `${lista.length} pendientes`}</span>}
          </div>
          {pendientes.isPending && <p role="status" className="text-soft">Buscando pendientes…</p>}
          {!datos && pendientes.isError && <p className="text-soft">No se pudieron consultar los pendientes. Revisá la señal; las cargas siguen disponibles.</p>}
          {datos && lista.length === 0 && <p className="text-approved">✓ No tenés nada pendiente.</p>}
          {lista.length > 0 && <ul className="grid gap-2.5">{lista.map((a) => <FilaAviso key={a.clave} a={a} />)}</ul>}
        </div>

        <div className="grid gap-6">
          {acciones.length > 0 && (
            <div className="grid gap-4 rounded-2xl border border-border bg-card/60 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <ZapIcon size={26} className="mt-0.5 text-brand" />
                <div>
                  <h2 className="text-xl font-semibold">Acciones frecuentes</h2>
                  <p className="text-sm text-soft">Accesos rápidos a las tareas principales.</p>
                </div>
              </div>
              <nav aria-label="Accesos rápidos" className="grid gap-3 sm:grid-cols-2">
                {acciones.map((a, i) => <Accion key={a.ruta + a.texto} a={a} destacada={i === 0} />)}
              </nav>
            </div>
          )}

          <div className="grid gap-4 rounded-2xl border border-border bg-card/60 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <ClockIcon size={26} className="mt-0.5 text-brand" />
              <div>
                <h2 className="text-xl font-semibold">Actividad reciente</h2>
                <p className="text-sm text-soft">{gestion ? 'Últimas operaciones registradas.' : 'Tus últimas cargas.'}</p>
              </div>
            </div>
            {actividad.data ? <Actividad eventos={actividad.data} /> : <p className="text-sm text-soft">{actividad.isError ? 'No se pudo consultar la actividad.' : 'Consultando…'}</p>}
          </div>
        </div>
      </div>
    </section>
  )
}
