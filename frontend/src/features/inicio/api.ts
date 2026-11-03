import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api/client'
import { conCopiaLocal } from '@/shared/copiaLocal'

/** Cantidad total y los primeros casos (los más antiguos), para saber qué atender. */
export type Conjunto<T> = { cantidad: number; items: T[] }
export type LoteVigente = { id: number; estado: 'OK' | 'PARCIAL'; archivo: string | null; fecha: string; unidades: number; filas_con_error: number }

/** Pendientes del inicio con su contexto. Una clave ausente significa que al usuario no le corresponde (I-07.1). */
export type Pendientes = Partial<{
  unidades_sin_lectura_semana: Conjunto<{ id: number; nombre: string; frente: string | null }>
  mis_viajes_pendientes: Conjunto<{ id: number; fecha: string; destino: string }>
  mis_viajes_en_correccion: Conjunto<{ id: number; fecha: string; destino: string }>
  viajes_sin_remito: Conjunto<{ id: number; fecha: string; origen: string; camionero: string }>
  correcciones_abiertas: Conjunto<{ id: number; fecha: string; viaje: number }>
  lecturas_sin_exportar: Conjunto<{ id: number; fecha: string; unidad: string }>
  consumos_periodo_vencido: { periodo: string; fecha_limite: string; plazo_vencido: boolean; lote: LoteVigente | null }
  fallas_abiertas: Conjunto<{ id: number; fecha: string; unidad: string; frente: string | null; detalle: string | null }>
  matafuegos_vencidos: Conjunto<{ id: number; nombre: string; vencimiento: string }>
}>
export type RespuestaPendientes = { data: Pendientes; meta: { generado_at: string } }

export type Evento = { id: number; accion: string; entidad_id: string | null; fecha: string; usuario: string; contexto: string | null }

/**
 * Se refresca solo cada minuto, al volver a la pestaña y al recuperar la señal (la configuración global
 * no refresca al recuperar el foco). Sin señal se muestra la última copia, con su hora (generado_at).
 */
export function usePendientes() {
  return useQuery({
    queryKey: ['pendientes'],
    queryFn: () => conCopiaLocal('pendientes', () => api<RespuestaPendientes>('/me/pending')),
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

export function useActividad() {
  return useQuery({
    queryKey: ['pendientes', 'actividad'],
    queryFn: () => conCopiaLocal('actividad', () => api<{ data: Evento[] }>('/me/activity').then((r) => r.data)),
    staleTime: 30_000,
    refetchInterval: 120_000,
    refetchOnWindowFocus: true,
  })
}
