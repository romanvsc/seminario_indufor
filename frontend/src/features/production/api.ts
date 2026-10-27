import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/client'
import { conCopiaLocal } from '@/shared/copiaLocal'
import { todasLasPaginas } from '@/shared/api/todasLasPaginas'
import type { Paginado, Recurso } from '@/shared/api/types'
import type { Asignacion } from '@/features/fronts/api'

type Persona = { id: number; nombre: string; apellido: string }

export type Parte = {
  id: number
  fecha_registro: string
  frente: { id: number; nombre: string; modalidad: 'CONSOLIDADA' | 'INDIVIDUAL' }
  unidad: { id: number; nombre: string }
  tipo_madera: { id: number; nombre: string }
  cantidad_toneladas: string | null
  metros_cubicos: string | null
  registrado_por: Persona
  operario: Persona | null
  tiene_foto: boolean
  observaciones: string | null
}

export type DatosParte = {
  id_frente: number
  id_unidad: number
  tipo_madera: number
  fecha_registro: string
  cantidad_toneladas: string | null
  metros_cubicos: string | null
  observaciones: string | null
}

export type FiltrosProduccion = { desde: string; hasta: string; frente: string; tipo_madera: string; unidad: string; operario: string; page: number }

export function useTiposMadera() {
  return useQuery({
    queryKey: ['wood-types'],
    queryFn: () => conCopiaLocal('tipos-madera', () => api<{ data: { id: number; nombre: string }[] }>('/wood-types').then((r) => r.data)),
    staleTime: Infinity,
  })
}

/** Asignaciones del usuario vigentes en la jornada del parte: el backend valida contra esa fecha (D12, specs/02). */
export function useMisAsignaciones(idUsuario: number | undefined, fecha: string) {
  return useQuery({
    queryKey: ['front-assignments', 'mias', idUsuario, fecha],
    queryFn: () => conCopiaLocal(`asignaciones-${idUsuario}-${fecha}`, () => api<Paginado<Asignacion>>(`/front-assignments?usuario=${idUsuario}&fecha=${fecha}&per_page=100`).then((r) => r.data)),
    enabled: idUsuario !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(fecha),
    placeholderData: keepPreviousData,
  })
}

/** Operarios para el filtro de RF16 (también los dados de baja: el histórico los incluye). Exige users.view. */
export function useOperarios(habilitado: boolean) {
  return useQuery({ queryKey: ['users', 'operarios'], queryFn: () => todasLasPaginas<Persona>('/users?rol=operario&estado=todos'), enabled: habilitado })
}

export function useProduccion(f: FiltrosProduccion) {
  const qs = new URLSearchParams(Object.entries({ ...f, page: String(f.page) }).filter(([, v]) => v !== ''))
  return useQuery({ queryKey: ['production', f], queryFn: () => api<Paginado<Parte>>(`/production?${qs}`), placeholderData: keepPreviousData })
}

export function useRegistrarParte() {
  const qc = useQueryClient()
  return useMutation({
    // La clave viaja con el borrador: si se reintenta tras un corte, el backend no duplica el parte
    mutationFn: ({ datos, clave }: { datos: DatosParte; clave: string }) =>
      api<Recurso<Parte> & { ya_registrado: boolean }>('/production', { method: 'POST', body: datos, headers: { 'Idempotency-Key': clave } })
        .then((r) => ({ ...r.data, ya_registrado: r.ya_registrado })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['production'] }),
  })
}

/** Corrección del autor (D18, D25): solo los campos que cambiaron, más el motivo que queda en la auditoría. */
export function useCorregirParte() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, cambios, motivo }: { id: number; cambios: Partial<DatosParte>; motivo: string }) =>
      api<Recurso<Parte>>(`/production/${id}`, { method: 'PUT', body: { ...cambios, motivo } }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['production'] }),
  })
}

export function useSubirFoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, foto }: { id: number; foto: File }) => {
      const form = new FormData()
      form.append('foto', foto)
      return api<Recurso<Parte>>(`/production/${id}/photo`, { method: 'POST', body: form })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['production'] }),
  })
}

/** Las fotos están en disco privado: se piden con la sesión y se abren como blob. */
export async function abrirFoto(id: number) {
  const res = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:8000'}/api/v1/production/${id}/photo`, { credentials: 'include' })
  if (!res.ok) throw new Error('No se pudo abrir la foto.')
  window.open(URL.createObjectURL(await res.blob()), '_blank', 'noopener')
}
