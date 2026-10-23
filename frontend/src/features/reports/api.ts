import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api/client'

export type FilaProduccion = { id_frente: number; frente: string; tipo_madera: string; toneladas: string | null; metros_cubicos: string | null; partes: number }
export type FilaDetalle = FilaProduccion & { id_unidad: number; unidad: string; id_operario: number | null; operario: string | null }
export type FilaViajes = { estado: 'PENDIENTE' | 'VALIDADO' | 'CORRECCION_SOLICITADA'; viajes: number; toneladas: string }
export type Indicadores = {
  lecturas: number; fallas_reportadas: number; fallas_abiertas: number; solicitudes_abiertas: number
  unidades_activas: number; unidades_sin_lectura_semana: number; matafuegos_vencidos: number
}
export type FilaConsumo = { periodo: string; id_unidad: number; unidad: string; dominio_patente: string | null; litros: string; costo_total: string; referencia_externa: string | null }
export type TotalConsumos = { litros: string; costo_total: string; unidades: number }
/** Lote de consumos vigente del período (D21): se informa su estado; nunca significa "período completo". */
export type LoteVigente = { id: number; estado: 'OK' | 'PARCIAL'; archivo: string | null; fecha: string; unidades: number; filas_con_error: number } | null

type Datos<T> = { data: T }
const get = <T,>(url: string) => api<Datos<T>>(url).then((r) => r.data)
const qs = (o: Record<string, string | number | undefined>) => new URLSearchParams(Object.entries(o).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)]))

export const useQuincenal = (periodo: string, quincena: number) =>
  useQuery({
    queryKey: ['reports', 'fortnight', periodo, quincena],
    queryFn: () => get<{ periodo: string; quincena: number; desde: string; hasta: string; en_curso: boolean; por_frente: FilaProduccion[]; detalle: FilaDetalle[] }>(`/reports/production/fortnight?${qs({ periodo, quincena })}`),
    placeholderData: keepPreviousData,
  })

export const useHistorico = (f: { desde: string; hasta: string; frente: string; unidad: string; tipo_madera: string }) =>
  useQuery({
    queryKey: ['reports', 'production', f],
    queryFn: () => get<{ por_frente: FilaProduccion[]; detalle: FilaDetalle[] }>(`/reports/production?${qs(f)}`),
    enabled: !!f.desde && !!f.hasta && f.desde <= f.hasta,
    placeholderData: keepPreviousData,
  })

export const useMensual = (periodo: string) =>
  useQuery({
    queryKey: ['reports', 'monthly', periodo],
    queryFn: () => get<{
      periodo: string; desde: string; hasta: string; es_periodo_vencido: boolean; fecha_limite: string; lote_vigente: LoteVigente
      produccion: FilaProduccion[]; viajes: FilaViajes[]; operativo: Indicadores; consumos: FilaConsumo[]; total_consumos: TotalConsumos
    }>(`/reports/monthly?${qs({ periodo })}`),
    placeholderData: keepPreviousData,
  })

export const useConsumosReporte = (desde: string, hasta: string, unidad: string) =>
  useQuery({
    queryKey: ['reports', 'consumption', desde, hasta, unidad],
    queryFn: () => get<{ filas: FilaConsumo[]; totales: TotalConsumos; no_disponible: string[] }>(`/reports/consumption?${qs({ desde, hasta, unidad })}`),
    enabled: !!desde && !!hasta && desde <= hasta,
    placeholderData: keepPreviousData,
  })

export const useOperativo = (desde: string, hasta: string) =>
  useQuery({
    queryKey: ['reports', 'operational', desde, hasta],
    queryFn: () => get<{ viajes: FilaViajes[]; indicadores: Indicadores }>(`/reports/operational?${qs({ desde, hasta })}`),
    enabled: !!desde && !!hasta && desde <= hasta,
    placeholderData: keepPreviousData,
  })

export const useDashboard = () =>
  useQuery({
    queryKey: ['dashboard'],
    queryFn: () => get<{
      hoy: string
      quincena: { periodo: string; numero: number; desde: string; hasta: string; por_frente: FilaProduccion[] }
      viajes_quincena: FilaViajes[]
      operativo: Indicadores
      consumos_vencido: TotalConsumos & { periodo: string; fecha_limite: string; lote_vigente: LoteVigente }
    }>('/dashboard'),
    refetchInterval: 5 * 60_000,
  })
