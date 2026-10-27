import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/client'
import type { Paginado } from '@/shared/api/types'

export type EstadoLote = 'EN_PROCESO' | 'OK' | 'PARCIAL' | 'ERROR' | 'REEMPLAZADO' | 'RECHAZADO'

export type Lote = {
  id: number
  tipo: 'EXPORT_LECTURAS' | 'IMPORT_CONSUMOS'
  periodo: string | null
  nombre_archivo: string | null
  estado: EstadoLote
  usuario: { id: number; nombre: string; apellido: string } | null
  iniciado_at: string
  finalizado_at: string | null
  consumos: number
  errores: { fila: number | null; mensaje: string }[]
}

export type Consumo = { unidad: { id: number; nombre: string; codigo: string }; litros: string; costo_total: string; referencia_externa: string | null; id_lote: number }

export const ESTADOS_LOTE: Record<EstadoLote, { texto: string; clase: string }> = {
  EN_PROCESO: { texto: '↻ En proceso', clase: 'text-pending' },
  OK: { texto: '✓ OK', clase: 'text-approved' },
  PARCIAL: { texto: '⚠ Parcial', clase: 'text-correction' },
  ERROR: { texto: '✕ Error', clase: 'text-danger' },
  REEMPLAZADO: { texto: '↺ Reemplazado', clase: 'text-soft' },
  // D21: reemplazo no aplicado porque el archivo traía filas con error; el lote vigente no cambió
  RECHAZADO: { texto: '✕ Reemplazo rechazado', clase: 'text-danger' },
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export function useLotes(tipo: '' | Lote['tipo'], pagina = 1) {
  const qs = new URLSearchParams({ ...(tipo ? { tipo } : {}), page: String(pagina) })
  return useQuery({
    queryKey: ['batches', tipo, pagina],
    queryFn: () => api<Paginado<Lote> & { pendientes_exportacion: number }>(`/integrations/batches?${qs}`),
    placeholderData: keepPreviousData,
  })
}

export function useConsumos(periodo: string) {
  return useQuery({
    queryKey: ['consumptions', periodo],
    queryFn: () => api<{ data: Consumo[]; totales: { litros: string; costo_total: string } }>(`/integrations/consumptions?periodo=${periodo}`),
    enabled: /^\d{4}-\d{2}$/.test(periodo),
  })
}

function useMutacion<V, R>(fn: (v: V) => Promise<R>) {
  const qc = useQueryClient()
  // onSettled: un reemplazo rechazado también deja un lote nuevo en el historial
  return useMutation({ mutationFn: fn, onSettled: () => Promise.all(['batches', 'consumptions'].map((k) => qc.invalidateQueries({ queryKey: [k] }))) })
}

export const useImportar = () =>
  useMutacion(({ archivo, periodo, reemplazar, motivo }: { archivo: File; periodo: string; reemplazar: boolean; motivo: string }) => {
    const form = new FormData()
    form.append('archivo', archivo)
    form.append('periodo', periodo)
    form.append('reemplazar', reemplazar ? '1' : '0')
    if (motivo) form.append('motivo', motivo)
    return api<{ data: Lote; ya_importado: boolean }>('/integrations/imports', { method: 'POST', body: form })
  })

export const useReintentarExportacion = () =>
  useMutacion(() => api<{ data: { exportadas: number; con_error: number } }>('/integrations/exports/retry', { method: 'POST' }).then((r) => r.data))

/** Archivo de prueba del simulador (ADR-004): se pide con la sesión y se guarda como descarga. */
export async function descargarSimulado(periodo: string) {
  const res = await fetch(`${API_URL}/api/v1/integrations/simulator/consumptions?periodo=${periodo}`, { credentials: 'include' })
  if (!res.ok) throw new Error('No se pudo generar el archivo de prueba.')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(await res.blob())
  a.download = `consumos-${periodo}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}
