import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, ApiError } from '@/shared/api/client'
import type { Recurso } from '@/shared/api/types'

export type RolResumen = { codigo: string; nombre: string }

export type UsuarioActual = {
  id: number
  nombre: string
  apellido: string
  email: string
  roles: RolResumen[]
  permisos: string[]
}

const ME = ['auth', 'me'] as const

/** Usuario de la sesión. `null` si no hay sesión (401). */
export function useUsuarioActual() {
  return useQuery({
    queryKey: ME,
    queryFn: async (): Promise<UsuarioActual | null> => {
      try {
        return (await api<Recurso<UsuarioActual>>('/auth/me')).data
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null
        throw e
      }
    },
    staleTime: 5 * 60_000,
    retry: false,
  })
}

/** Permisos solo para adaptar la UI: la autorización real la hace el backend. */
export function usePermiso(permiso: string): boolean {
  return useUsuarioActual().data?.permisos.includes(permiso) ?? false
}

export function useLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (datos: { email: string; password: string; recordar: boolean }) =>
      api<Recurso<UsuarioActual>>('/auth/login', { method: 'POST', body: datos }).then((r) => r.data),
    onSuccess: (usuario) => qc.setQueryData(ME, usuario),
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api<void>('/auth/logout', { method: 'POST' }),
    // Al cerrar sesión no queda ningún dato del usuario en memoria. La query de sesión se pone en null
    // (no se borra): si se borrara, los guards seguirían suscriptos a la instancia vieja y no redirigirían.
    onSettled: () => {
      qc.setQueryData(ME, null)
      qc.removeQueries({ predicate: (q) => q.queryKey[0] !== ME[0] })
    },
  })
}
