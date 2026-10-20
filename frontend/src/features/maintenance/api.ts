import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/client'
import type { Paginado, Recurso } from '@/shared/api/types'
import type { Metrica } from '@/features/machinery/api'

type Persona = { id: number; nombre: string; apellido: string }

export type Lectura = {
  id: number
  fecha_lectura: string
  unidad: { id: number; nombre: string; metrica: Metrica; frente: string | null }
  horometro_actual: string | null
  kilometraje_actual: number | null
  operario: Persona
  tiene_falla: boolean
  detalle_falla: string | null
  atencion: { fecha: string; por: Persona; nota: string } | null
}

export type UltimaLectura = { metrica: Metrica; anterior: { valor: string; fecha: string } | null }

export type FilaPanel = {
  unidad: { id: number; nombre: string; tipo: string; metrica: Metrica; frente: string | null }
  ultima_lectura: { fecha: string; valor: string | number } | null
  lectura_semana: boolean
  fallas_abiertas: number
  matafuego: { estado: EstadoMatafuego; revision: string; vencimiento: string; control_del_mes: boolean; vencido: boolean; por_vencer: boolean } | null
}

export type EstadoMatafuego = 'OK' | 'DESCARGADO' | 'DANADO' | 'FALTANTE'
export const ESTADOS_MATAFUEGO: Record<EstadoMatafuego, string> = { OK: 'OK', DESCARGADO: 'Descargado', DANADO: 'Dañado', FALTANTE: 'Faltante' }
export const UNIDAD_METRICA: Record<Metrica, string> = { HOROMETRO: 'h', KILOMETRAJE: 'km' }

export function useUltimaLectura(idUnidad: string) {
  return useQuery({
    queryKey: ['last-reading', idUnidad],
    queryFn: () => api<Recurso<UltimaLectura>>(`/maintenance/units/${idUnidad}/last-reading`).then((r) => r.data),
    enabled: idUnidad !== '',
  })
}

export function usePanel() {
  return useQuery({ queryKey: ['maintenance-panel'], queryFn: () => api<{ data: FilaPanel[] }>('/maintenance/panel').then((r) => r.data) })
}

/** Fallas abiertas. Con `refrescar` se consulta cada 60 s: es el aviso a Mantenimiento de ADR-003. */
export function useFallasAbiertas(habilitado = true, refrescar = false) {
  return useQuery({
    queryKey: ['failures', 'abiertas'],
    queryFn: () => api<Paginado<Lectura>>('/maintenance/failures?estado=abiertas'),
    enabled: habilitado,
    refetchInterval: refrescar ? 60_000 : false,
  })
}

function useMutacion<V, R>(fn: (v: V) => Promise<R>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => Promise.all(['failures', 'maintenance-panel', 'last-reading'].map((k) => qc.invalidateQueries({ queryKey: [k] }))),
  })
}

export const useRegistrarLectura = () =>
  useMutacion(({ datos, clave }: { datos: Record<string, unknown>; clave: string }) =>
    api<Recurso<Lectura>>('/maintenance/readings', { method: 'POST', body: datos, headers: { 'Idempotency-Key': clave } }),
  )

export const useAtenderFalla = () =>
  useMutacion(({ id, nota }: { id: number; nota: string }) => api<Recurso<Lectura>>(`/maintenance/failures/${id}/attend`, { method: 'POST', body: { nota } }))

export const useRegistrarMatafuego = () =>
  useMutacion((datos: Record<string, unknown>) => api('/maintenance/extinguishers', { method: 'POST', body: datos }))
