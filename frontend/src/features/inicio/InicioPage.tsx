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
import { PageHeader } from '@/shared/components/PageHeader'
import { KpiCard, type TonoKpi } from '@/shared/components/KpiCard'
import { ResumenQuincena } from '@/features/reports/ResumenQuincena'

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
const VISIBLES_MOVIL = 3
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

// P2: accesos rápidos ordenados por uso en este equipo (comodidad local, no un dato del sistema)
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

function FilaAviso({ a, plegada }: { a: ReturnType<typeof avisos>[number]; plegada: boolean }) {
  const { ref, triggerProps } = useIconHover()
  const Icono = a.nivel === 'critico' ? TriangleAlertIcon : ICONO[a.clave]
  const t = TONO[a.nivel]
  return (
    <li className={plegada ? 'max-lg:hidden' : undefined}>
      <Link viewTransition to={a.ruta} {...triggerProps} className={`flex items-center gap-3 rounded-xl border border-border border-l-4 bg-card p-3 hover:bg-secondary sm:gap-4 sm:p-4 ${t.barra}`}>
        <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${t.iconoFila ?? t.icono}`}><Icono ref={ref} size={20} /></span>
        <span className="grid min-w-0 flex-1 gap-0.5">
          {/* En el celular la gravedad va en texto sobre el título (el lector la recibe por el sr-only de abajo) */}
          <span aria-hidden="true" className={`w-fit rounded-full px-2 py-0.5 text-xs font-semibold sm:hidden ${t.insignia}`}>{NIVEL[a.nivel]}</span>
          {/* UIX-024: hasta dos líneas antes de cortar, para leer el aviso sin entrar (MOB-06). El texto completo queda en title */}
          <span className="font-semibold lg:line-clamp-2" title={a.titulo}>{a.titulo}</span>
          <span className="text-sm text-soft lg:line-clamp-2" title={`${a.area} · ${a.contexto}`}>{a.area} · {a.contexto}</span>
        </span>
        <span className={`hidden w-28 shrink-0 rounded-full py-1 text-center text-xs font-semibold sm:inline ${t.insignia}`}>{NIVEL[a.nivel]}</span>
        <span className="sr-only">, {NIVEL[a.nivel]}</span>
        <ArrowRightIcon size={18} className="shrink-0 text-soft" />
      </Link>
    </li>
  )
}

// Gravedad del indicador → tono de KpiCard (seguimiento en verde de marca; sin pendientes, neutro)
const TONO_KPI: Record<Nivel | 'ok', TonoKpi> = { critico: 'critico', atencion: 'atencion', seguimiento: 'ok', ok: 'neutro' }

function Tarjeta({ i }: { i: ReturnType<typeof indicadores>[number] }) {
  const Icono = ICONO[i.clave]
  return <KpiCard to={i.ruta} icono={<Icono size={22} />} titulo={i.titulo} valor={String(i.valor)} detalle={i.subtitulo} tono={TONO_KPI[i.nivel]} />
}

function Accion({ a, destacada }: { a: { texto: string; ruta: string; icono: Icono }; destacada: boolean }) {
  const { ref, triggerProps } = useIconHover()
  return (
    <Link viewTransition to={a.ruta} {...triggerProps} onClick={() => registrarUso(a.ruta)}
      className={`flex min-h-14 items-center gap-3 rounded-xl border px-4 py-3 font-semibold focus-visible:ring-2 focus-visible:ring-ring ${
        destacada ? 'border-brand/60 bg-primary text-primary-foreground hover:bg-primary-hover' : 'surface surface-interactive'}`}>
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
          <span className="text-soft">{cuando(e.fecha)}</span>
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
  const [todas, setTodas] = useState(false)
  // Permisos solo para adaptar la vista (como usePermiso): la autorización real la hace el backend
  const tiene = (p: string) => usuario?.permisos.includes(p) ?? false
  const tablero = tiene('dashboard.management')
  const gestion = tablero ||tiene('logistics.remito.create') || tiene('integration.import-costs')
  const posibles = [
    { permiso: tiene('logistics.remito.create'), texto: 'Cargar remito', ruta: '/viajes?estado=PENDIENTE', icono: TruckIcon },
    { permiso: tiene('integration.import-costs'), texto: 'Importar consolidado', ruta: '/reportes?pestana=integracion', icono: UploadIcon },
    { permiso: tiene('production.create'), texto: 'Cargar parte', ruta: '/produccion/nuevo', icono: FactoryIcon },
    { permiso: tiene('maintenance.reading.create'), texto: 'Cargar lectura', ruta: '/lecturas/nueva', icono: GaugeIcon },
    { permiso: tiene('maintenance.extinguisher.create'), texto: 'Control de matafuego', ruta: '/matafuegos/nuevo', icono: FlameIcon },
    { permiso: tiene('logistics.trip.create'), texto: 'Declarar viaje', ruta: '/viajes/nuevo', icono: TruckIcon },
    { permiso: tiene('maintenance.failure.view'), texto: 'Panel técnico', ruta: '/mantenimiento', icono: WrenchIcon },
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
      <PageHeader eyebrow={`INDUFOR${rol && ` / ${rol}`}`} titulo={gestion ? 'Centro de operaciones' : 'Mi jornada'}
        descripcion={`Hola, ${usuario?.nombre ?? ''}. ${gestion ? 'Lo que requiere tu atención y el resumen de la operación.' : 'Tus cargas y lo que tenés pendiente.'}`}
        accion={<div className="grid justify-items-end gap-1.5">
          {/* MOB-05: en el celular la fecha ya la muestra el sistema; queda solo la hora de actualización */}
          <span className="hidden items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-sm font-medium sm:flex"><CalendarIcon size={18} />{fechaDeHoy()}</span>
          <span role="status" className={`flex items-center gap-1.5 text-xs ${viejos ? 'text-warning' : 'text-soft'}`}>
            <ClockIcon size={14} />
            {!datos ? (pendientes.isError ? 'No se pudieron consultar los pendientes' : 'Consultando…')
              : viejos ? `Mostrando datos de las ${hora(datos.meta.generado_at)}${!online ? ' · sin conexión' : ''}`
              : `Actualizado a las ${hora(datos.meta.generado_at)}`}
          </span>
        </div>} />

      {/* UIX-021/023: con el dashboard no hay tarjetas; lo pendiente va en la lista y el resumen de la quincena al final */}
      {!tablero && tarjetas.length > 0 && (
        // UIX-024: en el celular repiten las alertas y empujan los accesos; ahí queda solo la lista
        <div className="grid grid-cols-2 gap-3 max-sm:hidden xl:grid-cols-4">{tarjetas.map((i) => <Tarjeta key={i.clave} i={i} />)}</div>
      )}

      {borradores.length > 0 && (
        <div role="status" className="grid gap-2 rounded-2xl border border-warning/50 bg-warning/10 p-4">
          <p className="font-semibold">⚠ {borradores.length === 1 ? 'Tenés 1 borrador sin enviar' : `Tenés ${borradores.length} borradores sin enviar`} en este equipo</p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {borradores.map((t) => BORRADORES[t] && (
              <li key={t}><Link viewTransition to={BORRADORES[t].ruta} className="underline underline-offset-4">Seguir con: {BORRADORES[t].texto}</Link></li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="surface grid content-start gap-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <ClipboardListIcon size={26} className="mt-0.5 text-brand" />
              <div>
                <h2 className="text-xl font-semibold">Pendientes y alertas</h2>
                <p className="text-sm text-soft">Situaciones que requieren gestión.</p>
              </div>
            </div>
            {lista.length > 0 && <span className="shrink-0 rounded-full border border-border px-3 py-1 text-sm">{lista.length === 1 ? '1 tipo de alerta' : `${lista.length} tipos de alerta`}</span>}
          </div>
          {pendientes.isPending && <p role="status" className="text-soft">Buscando pendientes…</p>}
          {!datos && pendientes.isError && <p className="text-soft">No se pudieron consultar los pendientes. Revisá la señal; las cargas siguen disponibles.</p>}
          {datos && lista.length === 0 && <p className="text-approved">✓ No hay alertas en las categorías consultadas.</p>}
          {/* UIX-024: en una columna se ven las primeras (lo crítico va primero) para que los accesos queden cerca */}
          {lista.length > 0 && <ul id="lista-alertas" className="grid gap-2.5">{lista.map((a, i) => <FilaAviso key={a.clave} a={a} plegada={!todas && i >= VISIBLES_MOVIL} />)}</ul>}
          {lista.length > VISIBLES_MOVIL && (
            <button type="button" aria-expanded={todas} aria-controls="lista-alertas" onClick={() => setTodas(!todas)}
              className="min-h-11 rounded-xl border border-border px-4 text-sm font-semibold hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring lg:hidden">
              {todas ? 'Ver menos alertas' : `Ver ${lista.length - VISIBLES_MOVIL} ${lista.length - VISIBLES_MOVIL === 1 ? 'alerta' : 'alertas'} más`}
            </button>
          )}
        </div>

        <div className="grid gap-6">
          {acciones.length > 0 && (
            // Se estira hasta el alto de Pendientes y reparte los accesos en filas iguales
            <div className="surface grid grid-rows-[auto_1fr] gap-4 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <ZapIcon size={26} className="mt-0.5 text-brand" />
                <div>
                  <h2 className="text-xl font-semibold">Accesos rápidos</h2>
                  <p className="text-sm text-soft">Ordenados por tu uso en este equipo.</p>
                </div>
              </div>
              <nav aria-label="Accesos rápidos" className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {acciones.map((a, i) => <Accion key={a.ruta + a.texto} a={a} destacada={i === 0} />)}
              </nav>
            </div>
          )}

          {!tablero && (
            <div className="surface grid gap-4 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <ClockIcon size={26} className="mt-0.5 text-brand" />
                <div>
                  <h2 className="text-xl font-semibold">Actividad reciente</h2>
                  <p className="text-sm text-soft">{gestion ? 'Últimas operaciones registradas.' : 'Tus últimas cargas.'}</p>
                </div>
              </div>
              {actividad.data ? <Actividad eventos={actividad.data} /> : <p className="text-sm text-soft">{actividad.isError ? 'No se pudo consultar la actividad.' : 'Consultando…'}</p>}
            </div>
          )}
        </div>
      </div>

      {tablero && <ResumenQuincena />}
    </section>
  )
}
