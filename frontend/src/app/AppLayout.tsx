import { NavLink, Outlet } from 'react-router'
import { useLogout, usePermiso, useUsuarioActual } from '@/features/auth/api'
import { ConnectionBadge } from '@/shared/components/ConnectionBadge'
import { Button } from '@/shared/components/ui/button'

const enlace = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm ${isActive ? 'bg-secondary font-medium text-foreground' : 'text-soft hover:text-foreground'}`

export function AppLayout() {
  const usuario = useUsuarioActual().data
  const logout = useLogout()
  const verUsuarios = usePermiso('users.view')
  const verFrentes = usePermiso('fronts.view')
  const verProduccionPropia = usePermiso('production.view')
  const verProduccionTodo = usePermiso('production.view-all')
  const verProduccion = verProduccionPropia || verProduccionTodo
  const verMaquinaria = usePermiso('machinery.view')

  return (
    <div className="min-h-dvh bg-background">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <img src="/icons/icon-192.png" alt="" width={36} height={36} />
          <span className="text-lg font-semibold">INDUFOR</span>
          <nav aria-label="Principal" className="ml-2 flex flex-wrap gap-1">
            <NavLink to="/" end className={enlace}>Inicio</NavLink>
            {verUsuarios && <NavLink to="/usuarios" className={enlace}>Usuarios</NavLink>}
            {verProduccion && <NavLink to="/produccion" className={enlace}>Producción</NavLink>}
            {verFrentes && <NavLink to="/frentes" className={enlace}>Frentes</NavLink>}
            {verMaquinaria && <NavLink to="/maquinaria" className={enlace}>Maquinaria</NavLink>}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <ConnectionBadge />
          <span className="text-sm text-soft">{usuario?.nombre} {usuario?.apellido}</span>
          <Button variant="outline" size="sm" onClick={() => logout.mutate()} disabled={logout.isPending}>Salir</Button>
        </div>
      </header>
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
