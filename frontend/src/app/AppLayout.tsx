import { useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import { useLogout, usePermiso, useUsuarioActual } from '@/features/auth/api'
import { useFallasAbiertas } from '@/features/maintenance/api'
import { ConnectionBadge } from '@/shared/components/ConnectionBadge'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { listarBorradores } from '@/shared/borrador'

const enlace = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm ${isActive ? 'bg-secondary font-medium text-foreground' : 'text-soft hover:text-foreground'}`

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
  const cargaMatafuegos = usePermiso('maintenance.extinguisher.create')
  const verPanel = usePermiso('maintenance.failure.view')
  const verIntegracion = usePermiso('integration.view-history')
  const verDashboard = usePermiso('dashboard.management')
  const repProduccion = usePermiso('reports.production')
  const repOperativo = usePermiso('reports.operational')
  const repFinanciero = usePermiso('reports.financial')
  // ADR-003: el contador de fallas abiertas se refresca solo mientras la app está abierta
  const fallas = useFallasAbiertas(verPanel, true).data?.meta.total ?? 0

  return (
    <div className="min-h-dvh bg-background">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <img src="/icons/icon-192.png" alt="" width={36} height={36} />
          <span className="text-lg font-semibold">INDUFOR</span>
          <nav aria-label="Principal" className="ml-2 flex flex-wrap gap-1">
            <NavLink to="/" end className={enlace}>Inicio</NavLink>
            {verDashboard && <NavLink to="/dashboard" className={enlace}>Dashboard</NavLink>}
            {(repProduccion || repOperativo || repFinanciero) && <NavLink to="/reportes" className={enlace}>Reportes</NavLink>}
            {verUsuarios && <NavLink to="/usuarios" className={enlace}>Usuarios</NavLink>}
            {verProduccion && <NavLink to="/produccion" className={enlace}>Producción</NavLink>}
            {(verViajesPropios || verViajesTodos) && <NavLink to="/viajes" className={enlace}>Viajes</NavLink>}
            {verCorrecciones && <NavLink to="/correcciones" className={enlace}>Correcciones</NavLink>}
            {cargaLecturas && <NavLink to="/lecturas/nueva" className={enlace}>Cargar lectura</NavLink>}
            {cargaMatafuegos && <NavLink to="/matafuegos/nuevo" className={enlace}>Matafuego</NavLink>}
            {verPanel && (
              <NavLink to="/mantenimiento" className={enlace} aria-label={fallas ? `Mantenimiento, ${fallas} fallas abiertas` : undefined}>
                Mantenimiento{fallas > 0 && <span className="ml-1.5 rounded-full bg-danger px-1.5 text-xs font-semibold text-primary-foreground">{fallas}</span>}
              </NavLink>
            )}
            {verIntegracion && <NavLink to="/integracion" className={enlace}>Integración</NavLink>}
            {verFrentes && <NavLink to="/frentes" className={enlace}>Frentes</NavLink>}
            {verMaquinaria && <NavLink to="/maquinaria" className={enlace}>Maquinaria</NavLink>}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <ConnectionBadge />
          <span className="text-sm text-soft">{usuario?.nombre} {usuario?.apellido}</span>
          <Button variant="outline" size="sm" onClick={salir} disabled={logout.isPending}>Salir</Button>
        </div>
      </header>
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

export function InicioPage() {
  const usuario = useUsuarioActual().data
  return (
    <section className="grid gap-2">
      <h1 className="text-2xl font-semibold">Hola, {usuario?.nombre}</h1>
      <p className="text-soft">Roles: {usuario?.roles.map((r) => r.nombre).join(', ')}</p>
    </section>
  )
}
