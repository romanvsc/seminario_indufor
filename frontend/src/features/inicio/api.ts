import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api/client'

/** Spec 07 (T-07.1): conteos del inicio. Una clave ausente significa que al usuario no le corresponde. */
export type Pendientes = Partial<{
  unidades_sin_lectura_semana: number
  mis_viajes_pendientes: number
  mis_viajes_en_correccion: number
  viajes_sin_remito: number
  correcciones_abiertas: number
  lecturas_sin_exportar: number
  consumos_periodo_vencido: { periodo: string; importado: boolean }
  fallas_abiertas: number
  matafuegos_vencidos: number
}>

export function usePendientes() {
  return useQuery({ queryKey: ['pendientes'], queryFn: () => api<{ data: Pendientes }>('/me/pending').then((r) => r.data), staleTime: 60_000 })
}
