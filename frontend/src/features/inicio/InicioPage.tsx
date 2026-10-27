import { Link } from 'react-router'
import { usePermiso, useUsuarioActual } from '@/features/auth/api'
import { listarBorradores } from '@/shared/borrador'
import { usePendientes, type Pendientes } from './api'

const BORRADORES: Record<string, { texto: string; ruta: string }> = {
  parte: { texto: 'Parte de producción', ruta: '/produccion/nuevo' },
  lectura: { texto: 'Lectura', ruta: '/lecturas/nueva' },
  matafuego: { texto: 'Control de matafuego', ruta: '/matafuegos/nuevo' },
  viaje: { texto: 'Viaje', ruta: '/viajes/nuevo' },
}
const plural = (n: number, uno: string, varios: string) => (n === 1 ? uno : varios.replace('#', String(n)))

type Aviso = { texto: string; ruta: string; urgente?: boolean }

/** Lo que el inicio pide atender, armado solo con las claves que el backend devolvió para este usuario (I-07.1). */
function avisos(p: Pendientes): Aviso[] {
  const a: Aviso[] = []
  if (p.unidades_sin_lectura_semana) a.push({ texto: plural(p.unidades_sin_lectura_semana, '1 unidad sin lectura desde el lunes', '# unidades sin lectura desde el lunes'), ruta: '/lecturas/nueva', urgente: true })
  if (p.mis_viajes_en_correccion) a.push({ texto: plural(p.mis_viajes_en_correccion, '1 viaje tuyo con corrección solicitada', '# viajes tuyos con corrección solicitada'), ruta: '/viajes?estado=CORRECCION_SOLICITADA', urgente: true })
  if (p.mis_viajes_pendientes) a.push({ texto: plural(p.mis_viajes_pendientes, '1 viaje tuyo espera el remito', '# viajes tuyos esperan el remito'), ruta: '/viajes?estado=PENDIENTE' })
  if (p.viajes_sin_remito) a.push({ texto: plural(p.viajes_sin_remito, '1 viaje espera remito', '# viajes esperan remito'), ruta: '/viajes?estado=PENDIENTE' })
  if (p.correcciones_abiertas) a.push({ texto: plural(p.correcciones_abiertas, '1 solicitud de corrección abierta', '# solicitudes de corrección abiertas'), ruta: '/correcciones', urgente: true })
  if (p.lecturas_sin_exportar) a.push({ texto: plural(p.lecturas_sin_exportar, '1 lectura sin enviar al sistema de gastos', '# lecturas sin enviar al sistema de gastos'), ruta: '/integracion', urgente: true })
  if (p.consumos_periodo_vencido && !p.consumos_periodo_vencido.importado) {
    a.push({ texto: `Falta importar el consolidado de consumos de ${p.consumos_periodo_vencido.periodo}`, ruta: '/integracion' })
  }
  if (p.fallas_abiertas) a.push({ texto: plural(p.fallas_abiertas, '1 falla abierta', '# fallas abiertas'), ruta: '/mantenimiento', urgente: true })
  if (p.matafuegos_vencidos) a.push({ texto: plural(p.matafuegos_vencidos, '1 matafuego con la carga vencida', '# matafuegos con la carga vencida'), ruta: '/mantenimiento', urgente: true })
  return a
}

const accion = 'flex min-h-14 items-center justify-center rounded-lg border border-border bg-card px-4 text-center text-base font-medium shadow-xs hover:border-primary focus-visible:ring-2 focus-visible:ring-ring'

/** Spec 07 (D26): inicio orientado a la tarea del día, según los permisos de cada rol. */
export function InicioPage() {
  const usuario = useUsuarioActual().data
  const pendientes = usePendientes()
  const acciones = [
    { permiso: usePermiso('production.create'), texto: 'Cargar parte', ruta: '/produccion/nuevo' },
    { permiso: usePermiso('maintenance.reading.create'), texto: 'Cargar lectura', ruta: '/lecturas/nueva' },
    { permiso: usePermiso('maintenance.extinguisher.create'), texto: 'Control de matafuego', ruta: '/matafuegos/nuevo' },
    { permiso: usePermiso('logistics.trip.create'), texto: 'Declarar viaje', ruta: '/viajes/nuevo' },
    { permiso: usePermiso('logistics.remito.create'), texto: 'Cargar remito', ruta: '/viajes?estado=PENDIENTE' },
    { permiso: usePermiso('integration.import-costs'), texto: 'Importar consolidado', ruta: '/integracion' },
    { permiso: usePermiso('maintenance.failure.view'), texto: 'Panel técnico', ruta: '/mantenimiento' },
    { permiso: usePermiso('dashboard.management'), texto: 'Dashboard', ruta: '/dashboard' },
  ].filter((a) => a.permiso)
  const borradores = usuario ? listarBorradores(usuario.id) : []
  const lista = pendientes.data ? avisos(pendientes.data) : []

  return (
    <section className="mx-auto grid max-w-3xl gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Hola, {usuario?.nombre}</h1>
        <p className="text-soft">{usuario?.roles.map((r) => r.nombre).join(', ')}</p>
      </div>

      {borradores.length > 0 && (
        <div role="status" className="grid gap-2 rounded-lg border border-warning bg-card p-4">
          <p className="font-medium">⚠ {plural(borradores.length, 'Tenés 1 borrador sin enviar', 'Tenés # borradores sin enviar')} en este equipo</p>
          <ul className="grid gap-1">
            {borradores.map((t) => BORRADORES[t] && (
              <li key={t}><Link to={BORRADORES[t].ruta} className="underline underline-offset-4">Seguir con: {BORRADORES[t].texto}</Link></li>
            ))}
          </ul>
        </div>
      )}

      {acciones.length > 0 && (
        <nav aria-label="Accesos rápidos" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {acciones.map((a) => <Link key={a.ruta + a.texto} to={a.ruta} className={accion}>{a.texto}</Link>)}
        </nav>
      )}

      <div className="grid gap-2">
        <h2 className="text-lg font-semibold">Pendientes</h2>
        {pendientes.isPending && <p role="status" className="text-soft">Buscando pendientes…</p>}
        {pendientes.isError && <p className="text-soft">No se pudieron consultar los pendientes. Revisá la señal; las cargas siguen disponibles.</p>}
        {pendientes.data && lista.length === 0 && <p className="text-approved">✓ No tenés nada pendiente.</p>}
        {lista.length > 0 && (
          <ul className="grid gap-2">
            {lista.map((a) => (
              <li key={a.texto}>
                <Link to={a.ruta} className={`flex min-h-12 items-center justify-between gap-3 rounded-lg border bg-card px-4 ${a.urgente ? 'border-correction' : 'border-border'}`}>
                  <span>{a.urgente ? '⚠ ' : ''}{a.texto}</span>
                  <span aria-hidden="true" className="text-soft">→</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
