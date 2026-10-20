import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/client'
import type { Paginado, Recurso } from '@/shared/api/types'
import type { Usuario } from '@/features/users/api'

type Persona = { id: number; nombre: string; apellido: string }
type Madera = { id: number; nombre: string }
export type EstadoViaje = 'PENDIENTE' | 'VALIDADO' | 'CORRECCION_SOLICITADA'

export type Viaje = {
  id: number
  fecha: string
  estado: EstadoViaje
  origen: { id: number; nombre: string }
  destino: string
  camion: { id: number; nombre: string; dominio_patente: string | null }
  camionero: Persona
  tipo_madera: Madera
  volumen_declarado: string
  observaciones: string | null
  remito: { numero: string; fecha: string; transportista: Persona; tipo_madera: Madera; volumen_toneladas: string } | null
  solicitud_abierta: { id: number; estado: 'PENDIENTE' | 'EN_REVISION'; detalle: string } | null
}

export type Solicitud = {
  id: number
  estado: 'PENDIENTE' | 'EN_REVISION' | 'RESUELTA'
  fecha_solicitud: string
  detalle: string
  responsable: Persona | null
  viaje: Viaje
}

export type Cotejo = { coincide: boolean; diferencias: string[] }

/** RF05: Bosques del Plata no es origen habilitado. El backend lo vuelve a verificar. */
export const ORIGENES = ['Papel Misionero', 'Prusia']

export const ESTADOS: Record<EstadoViaje, { texto: string; clase: string }> = {
  PENDIENTE: { texto: '○ Pendiente de remito', clase: 'text-pending' },
  VALIDADO: { texto: '✓ Validado', clase: 'text-approved' },
  CORRECCION_SOLICITADA: { texto: '⚠ Corrección solicitada', clase: 'text-correction' },
}

export type FiltrosViajes = { estado: '' | EstadoViaje; desde: string; hasta: string; page: number }

export function useViajes(f: FiltrosViajes) {
  const qs = new URLSearchParams(Object.entries({ ...f, page: String(f.page) }).filter(([, v]) => v !== ''))
  return useQuery({ queryKey: ['trips', f], queryFn: () => api<Paginado<Viaje>>(`/logistics/trips?${qs}`), placeholderData: keepPreviousData })
}

export function useSolicitudes() {
  return useQuery({ queryKey: ['corrections'], queryFn: () => api<Paginado<Solicitud>>('/logistics/corrections').then((r) => r.data) })
}

export function useCamioneros(habilitado: boolean) {
  return useQuery({
    queryKey: ['users', 'camioneros'],
    // shortcut: hasta 100 camioneros; sumar búsqueda si la nómina supera ese número
    queryFn: () => api<Paginado<Usuario>>('/users?rol=camionero&estado=todos&per_page=100').then((r) => r.data),
    enabled: habilitado,
  })
}

/** Toda mutación de logística puede cambiar viajes y solicitudes a la vez: se invalidan ambos. */
function useMutacion<V, R>(fn: (v: V) => Promise<R>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => Promise.all([qc.invalidateQueries({ queryKey: ['trips'] }), qc.invalidateQueries({ queryKey: ['corrections'] })]),
  })
}

export const useDeclararViaje = () =>
  useMutacion(({ datos, clave }: { datos: Record<string, unknown>; clave: string }) =>
    api<Recurso<Viaje>>('/logistics/trips', { method: 'POST', body: datos, headers: { 'Idempotency-Key': clave } }).then((r) => r.data),
  )

export const useCargarRemito = () =>
  useMutacion((datos: Record<string, unknown>) => api<Recurso<Viaje> & { cotejo: Cotejo }>('/logistics/remitos', { method: 'POST', body: datos }))

export const useTomarSolicitud = () =>
  useMutacion((id: number) => api<Recurso<Solicitud>>(`/logistics/corrections/${id}/review`, { method: 'POST' }))

export const useResolverSolicitud = () =>
  useMutacion(({ id, cuerpo }: { id: number; cuerpo: Record<string, unknown> }) =>
    api<Recurso<Viaje> & { cotejo: Cotejo }>(`/logistics/corrections/${id}/resolve`, { method: 'POST', body: cuerpo }),
  )
