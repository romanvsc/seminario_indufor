import { useState, type ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router'
import { useLogout, usePermiso, useUsuarioActual } from '@/features/auth/api'
import { useFallasAbiertas } from '@/features/maintenance/api'
import { ConnectionBadge } from '@/shared/components/ConnectionBadge'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { listarBorradores } from '@/shared/borrador'

const enlace = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-11 items-center rounded-md px-3 py-2 text-base md:min-h-0 md:text-sm ${isActive ? 'bg-secondary font-medium text-foreground' : 'text-soft hover:text-foreground'}`

export function AppLayout() {
  const usuario = useUsuarioActual().data
  const logout = useLogout()
  // D23: salir borra los borradores del equipo; si hay alguno sin enviar, se avisa antes
  const [borradores, setBorradores] = useState(0)
  const salir = () => {
    const n = usuario ? listarBorradores(usuario.id).length : 0
    if (n > 0) setBorradores(n)
    else logout.mutate()
  }
  const verUsuarios = usePermiso('users.view')
  const verFrentes = usePermiso('fronts.view')
  const verProduccionPropia = usePermiso('production.view')
  const verProduccionTodo = usePermiso('production.view-all')
  const verProduccion = verProduccionPropia || verProduccionTodo
  const verMaquinaria = usePermiso('machinery.view')
  const verViajesPropios = usePermiso('logistics.trip.view-own')
  const verViajesTodos = usePermiso('logistics.trip.view-all')
  const verCorrecciones = usePermiso('logistics.correction.manage')
  const cargaLecturas = usePermiso('maintenance.reading.create')
  const verLecturas = usePermiso('maintenance.reading.view')
  const cargaMatafuegos = usePermiso('maintenance.extinguisher.create')
  const verPanel = usePermiso('maintenance.failure.view')
  const verIntegracion = usePermiso('integration.view-history')
  const verDashboard = usePermiso('dashboard.management')
  const repProduccion = usePermiso('reports.production')
  const repOperativo = usePermiso('reports.operational')
  const repFinanciero = usePermiso('reports.financial')
  // ADR-003: el contador de fallas abiertas se refresca solo mientras la app está abierta
  const fallas = useFallasAbiertas(verPanel, true).data?.meta.total ?? 0

  const [menu, setMenu] = useState(false)
  const link = (to: string, texto: ReactNode, extra: { end?: boolean; aria?: string } = {}) => (
    <NavLink key={to} to={to} end={extra.end} className={enlace} aria-label={extra.aria}>{texto}</NavLink>
  )
  const secciones: { titulo: string; enlaces: ReactNode[] }[] = [
    { titulo: 'Inicio', enlaces: [link('/', 'Inicio', { end: true })] },
    { titulo: 'Campo', enlaces: [
      cargaLecturas && link('/lecturas/nueva', 'Cargar lectura'),
      cargaMatafuegos && link('/matafuegos/nuevo', 'Matafuego'),
    ].filter(Boolean) },
    { titulo: 'Operación', enlaces: [
      verProduccion && link('/produccion', 'Producción'),
      (verViajesPropios || verViajesTodos) && link('/viajes', 'Viajes'),
      verCorrecciones && link('/correcciones', 'Correcciones'),
      verLecturas && link('/lecturas', 'Lecturas', { end: true }),
      verPanel && link('/mantenimiento', <>Mantenimiento{fallas > 0 && <span className="ml-1.5 rounded-full bg-danger px-1.5 text-xs font-semibold text-primary-foreground">{fallas}</span>}</>,
        { aria: fallas ? `Mantenimiento, ${fallas} fallas abiertas` : undefined }),
    ].filter(Boolean) },
    { titulo: 'Gestión', enlaces: [
      verDashboard && link('/dashboard', 'Dashboard'),
      (repProduccion || repOperativo || repFinanciero) && link('/reportes', 'Reportes'),
      verIntegracion && link('/integracion', 'Integración'),
      verUsuarios && link('/usuarios', 'Usuarios'),
      verFrentes && link('/frentes', 'Frentes'),
      verMaquinaria && link('/maquinaria', 'Maquinaria'),
    ].filter(Boolean) },
  ]

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-card px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="/icons/icon-192.png" alt="" width={36} height={36} />
            <span className="text-lg font-semibold">INDUFOR</span>
          </div>
          <div className="flex items-center gap-2 md:order-last">
            <ConnectionBadge />
            <span className="hidden text-sm text-soft sm:inline">{usuario?.nombre} {usuario?.apellido}</span>
            <Button variant="outline" size="sm" className="h-11 md:h-8" onClick={salir} disabled={logout.isPending}>Salir</Button>
            <Button variant="outline" size="sm" className="h-11 md:hidden" aria-expanded={menu} aria-controls="menu-principal" onClick={() => setMenu(!menu)}>
              {menu ? 'Cerrar' : 'Menú'}
            </Button>
          </div>
          {/* Un solo menú: en línea en pantallas anchas; en el celular, desplegable y agrupado por tarea (spec 07, auditoría) */}
          <nav id="menu-principal" aria-label="Principal" onClick={() => setMenu(false)}
            className={`${menu ? 'grid' : 'hidden'} w-full gap-3 md:flex md:w-auto md:flex-1 md:flex-wrap md:gap-1`}>
            {secciones.map((s) => s.enlaces.length > 0 && (
              <div key={s.titulo} className="grid gap-1 md:contents">
                <p className="text-xs font-semibold tracking-wide text-soft uppercase md:hidden">{s.titulo}</p>
                {s.enlaces}
              </div>
            ))}
          </nav>
        </div>
      </header>
      {/* Con 401/419 la sesión ya no existía y se limpió: no hay nada que reintentar */}
      {logout.isError && usuario && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border-b border-danger bg-card px-4 py-3 text-sm">
          <p>
            <strong className="text-danger">No se pudo cerrar la sesión.</strong> Revisá la conexión y tocá Reintentar; mientras tanto, la sesión
            sigue abierta en este equipo.
          </p>
          <Button variant="outline" size="sm" className="h-11 md:h-8" onClick={() => logout.mutate()} disabled={logout.isPending}>Reintentar</Button>
        </div>
      )}
      {borradores > 0 && (
        <Dialog open onOpenChange={(abierto) => !abierto && setBorradores(0)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Salir con borradores sin enviar?</DialogTitle>
              <DialogDescription>
                {borradores === 1 ? 'Tenés 1 borrador sin enviar en este equipo.' : `Tenés ${borradores} borradores sin enviar en este equipo.`} Si salís se borran.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBorradores(0)}>Volver</Button>
              <Button variant="destructive" onClick={() => { setBorradores(0); logout.mutate() }}>Salir igual</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      <main className="mx-auto max-w-6xl p-4">
        <Outlet />
      </main>
    </div>
  )
}
