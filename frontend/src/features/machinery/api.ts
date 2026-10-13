import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/client'
import type { Paginado, Recurso } from '@/shared/api/types'

export type Metrica = 'HOROMETRO' | 'KILOMETRAJE'
export const METRICAS: Record<Metrica, string> = { HOROMETRO: 'Horómetro', KILOMETRAJE: 'Kilometraje' }

export type TipoMaquinaria = { id: number; nombre: string; metrica: Metrica; estado_activo: boolean }

export type Unidad = {
  id: number
  nombre: string
  dominio_patente: string | null
  marca_modelo: string
  estado_activo: boolean
  tipo: { id: number; nombre: string; metrica: Metrica }
  frente: { id: number; nombre: string } | null
  usuario: { id: number; nombre: string; apellido: string } | null
}

export type DatosUnidad = {
  nombre: string
  dominio_patente: string | null
  marca_modelo: string
  id_tipo_maquinaria: number
  id_frente_actual: number | null
  id_usuario: number | null
}

export type FiltrosUnidades = { q: string; tipo: string; estado: 'activos' | 'inactivos' | 'todos'; page: number }

export function useUnidades(f: FiltrosUnidades) {
  const qs = new URLSearchParams({ estado: f.estado, page: String(f.page), ...(f.q ? { q: f.q } : {}), ...(f.tipo ? { tipo: f.tipo } : {}) })
  return useQuery({ queryKey: ['machinery', f], queryFn: () => api<Paginado<Unidad>>(`/machinery?${qs}`), placeholderData: keepPreviousData })
}

export function useTipos(estado: 'activos' | 'todos' = 'activos') {
  return useQuery({
    queryKey: ['machinery-types', estado],
    queryFn: () => api<Paginado<TipoMaquinaria>>(`/machinery-types?estado=${estado}`).then((r) => r.data),
  })
}

/** Cada mutación invalida lo que muestra la UI: solo se ve lo que el backend confirmó. */
function useMutacion<V>(fn: (v: V) => Promise<unknown>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => Promise.all([qc.invalidateQueries({ queryKey: ['machinery'] }), qc.invalidateQueries({ queryKey: ['machinery-types'] })]),
  })
}

export const useGuardarUnidad = () =>
  useMutacion(({ id, datos }: { id?: number; datos: DatosUnidad }) =>
    api<Recurso<Unidad>>(id ? `/machinery/${id}` : '/machinery', { method: id ? 'PUT' : 'POST', body: datos }),
  )

export const useGuardarTipo = () =>
  useMutacion(({ id, datos }: { id?: number; datos: { nombre: string; metrica: Metrica } }) =>
    api<Recurso<TipoMaquinaria>>(id ? `/machinery-types/${id}` : '/machinery-types', { method: id ? 'PUT' : 'POST', body: datos }),
  )

/** recurso: 'machinery' o 'machinery-types' */
export const useCambiarEstado = () =>
  useMutacion(({ recurso, id, activo }: { recurso: 'machinery' | 'machinery-types'; id: number; activo: boolean }) =>
    api(`/${recurso}/${id}/${activo ? 'enable' : 'disable'}`, { method: 'POST' }),
  )
