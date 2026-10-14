import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useUsuarioActual } from './api'

/** Guard de navegación. Es solo comodidad de UI: cada endpoint vuelve a autorizar en el backend. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { data: usuario, isPending, isError } = useUsuarioActual()
  const location = useLocation()

  if (isPending) return <p className="p-6 text-soft" role="status">Cargando…</p>
  if (isError) return <p className="p-6 text-danger" role="alert">No se pudo verificar la sesión. Revisá la conexión.</p>
  if (!usuario) return <Navigate to="/login" replace state={{ desde: location.pathname }} />
  return children
}

/** Alcanza con tener uno de los permisos indicados. */
export function RequirePermiso({ permiso, children }: { permiso: string | string[]; children: ReactNode }) {
  const { data: usuario } = useUsuarioActual()
  if (![permiso].flat().some((p) => usuario?.permisos.includes(p))) {
    return <p className="p-6 text-soft" role="alert">No tenés permiso para ver esta sección.</p>
  }
  return children
}
