import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/client'
import type { Paginado, Recurso } from '@/shared/api/types'
import type { Usuario } from '@/features/users/api'

export type Modalidad = 'CONSOLIDADA' | 'INDIVIDUAL'

export type Frente = { id: number; nombre: string; ubicacion: string | null; modalidad: Modalidad; estado_activo: boolean }

export type Asignacion = {
  id: number
  frente: { id: number; nombre: string }
  usuario: { id: number; nombre: string; apellido: string }
  fecha_desde: string
  fecha_hasta: string | null
}

export type DatosFrente = { nombre_frente: string; ubicacion_geografica: string | null; modalidad_produccion: Modalidad }

export const MODALIDADES: Record<Modalidad, string> = { CONSOLIDADA: 'Consolidada', INDIVIDUAL: 'Individual' }

/** Fecha local de hoy en formato YYYY-MM-DD (la API trabaja en America/Argentina/Buenos_Aires). */
export const hoy = () => new Date().toLocaleDateString('sv-SE')

export function useFrentes(estado: 'activos' | 'inactivos' | 'todos') {
  return useQuery({
    queryKey: ['fronts', estado],
    queryFn: () => api<Paginado<Frente>>(`/fronts?estado=${estado}&per_page=100`),
    placeholderData: keepPreviousData,
  })
}

export function useAsignaciones(idFrente: number) {
  return useQuery({
    queryKey: ['front-assignments', idFrente],
    // shortcut: trae las últimas 100 asignaciones del frente; paginar si el historial crece más
    queryFn: () => api<Paginado<Asignacion>>(`/front-assignments?frente=${idFrente}&per_page=100`).then((r) => r.data),
  })
}

export function useUsuariosActivos(habilitado: boolean) {
  return useQuery({
    queryKey: ['users', 'opciones'],
    // shortcut: hasta 100 usuarios activos en el selector; sumar búsqueda si la nómina supera ese número
    queryFn: () => api<Paginado<Usuario>>('/users?estado=activos&per_page=100').then((r) => r.data),
    enabled: habilitado,
  })
}

/** Cada mutación invalida lo que muestra la UI: solo se ve lo que el backend confirmó. */
function useMutacion<V>(clave: string, fn: (v: V) => Promise<unknown>) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: [clave] }) })
}

export const useGuardarFrente = () =>
  useMutacion('fronts', ({ id, datos }: { id?: number; datos: DatosFrente }) =>
    api<Recurso<Frente>>(id ? `/fronts/${id}` : '/fronts', { method: id ? 'PUT' : 'POST', body: datos }),
  )

export const useCambiarEstadoFrente = () =>
  useMutacion('fronts', ({ id, activo }: { id: number; activo: boolean }) =>
    api<Recurso<Frente>>(`/fronts/${id}/${activo ? 'enable' : 'disable'}`, { method: 'POST' }),
  )

export const useAsignar = () =>
  useMutacion('front-assignments', (d: { id_frente: number; id_usuario: number; fecha_desde: string; fecha_hasta: string | null }) =>
    api<Recurso<Asignacion>>('/front-assignments', { method: 'POST', body: d }),
  )

export const useFinalizarAsignacion = () =>
  useMutacion('front-assignments', ({ id, fecha_hasta }: { id: number; fecha_hasta: string }) =>
    api<Recurso<Asignacion>>(`/front-assignments/${id}/end`, { method: 'POST', body: { fecha_hasta } }),
  )
