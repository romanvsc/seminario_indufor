import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/client'
import type { Paginado, Recurso } from '@/shared/api/types'
import type { RolResumen } from '@/features/auth/api'

export type Usuario = {
  id: number
  nombre: string
  apellido: string
  email: string
  telefono_whatsapp: string | null
  estado_activo: boolean
  ultimo_acceso_at: string | null
  roles: RolResumen[]
}

export type FiltrosUsuarios = { q: string; estado: 'activos' | 'inactivos' | 'todos'; page: number }

export type DatosUsuario = {
  nombre: string
  apellido: string
  email: string
  telefono_whatsapp: string | null
  password?: string
  roles?: string[]
}

const CLAVE = ['users'] as const

export function useUsuarios(f: FiltrosUsuarios) {
  const qs = new URLSearchParams({ estado: f.estado, page: String(f.page), ...(f.q ? { q: f.q } : {}) })
  return useQuery({
    queryKey: [...CLAVE, f],
    queryFn: () => api<Paginado<Usuario>>(`/users?${qs}`),
    placeholderData: keepPreviousData,
  })
}

export function useCatalogoRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => api<{ data: RolResumen[] }>('/roles').then((r) => r.data),
    staleTime: Infinity,
  })
}

/** Toda mutación invalida la lista: la UI muestra lo que el backend confirmó, nunca un estado supuesto. */
function useMutacion<V>(fn: (v: V) => Promise<unknown>) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: CLAVE }) })
}

export const useCrearUsuario = () =>
  useMutacion((d: DatosUsuario) => api<Recurso<Usuario>>('/users', { method: 'POST', body: d }))

export const useActualizarUsuario = () =>
  useMutacion(async ({ id, datos, roles }: { id: number; datos: DatosUsuario; roles: string[] | null }) => {
    await api<Recurso<Usuario>>(`/users/${id}`, { method: 'PUT', body: datos })
    if (roles) await api<Recurso<Usuario>>(`/users/${id}/roles`, { method: 'PUT', body: { roles } })
  })

export const useCambiarEstado = () =>
  useMutacion(({ id, activo }: { id: number; activo: boolean }) =>
    api<Recurso<Usuario>>(`/users/${id}/${activo ? 'enable' : 'disable'}`, { method: 'POST' }),
  )
