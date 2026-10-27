import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/api/client'
import type { Paginado, Recurso } from '@/shared/api/types'
import type { Metrica, Unidad } from '@/features/machinery/api'
import { useMisAsignaciones } from '@/features/production/api'

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

type Vecina = { valor: string; fecha: string } | null
export type UltimaLectura = { metrica: Metrica; anterior: Vecina; posterior: Vecina }

export type FilaPanel = {
  unidad: { id: number; nombre: string; tipo: string; metrica: Metrica; frente: string | null }
  ultima_lectura: { fecha: string; valor: string | number } | null
  ultima_carga_sin_valor: string | null
  lectura_semana: boolean
  fallas_abiertas: number
  matafuego: { estado: EstadoMatafuego; revision: string; vencimiento: string | null; etiqueta_ilegible: boolean; control_del_mes: boolean; vencido: boolean; por_vencer: boolean } | null
}

export type EstadoMatafuego = 'OK' | 'DESCARGADO' | 'DANADO' | 'FALTANTE'
export const ESTADOS_MATAFUEGO: Record<EstadoMatafuego, string> = { OK: 'OK', DESCARGADO: 'Descargado', DANADO: 'Dañado', FALTANTE: 'Faltante' }
export const UNIDAD_METRICA: Record<Metrica, string> = { HOROMETRO: 'h', KILOMETRAJE: 'km' }

/**
 * D28: unidades sobre las que el usuario puede cargar en esa fecha: es su responsable o está asignado a su frente actual.
 * Sin las asignaciones a mano (sin señal ni copia local) no se filtra: el backend lo valida igual al enviar.
 * La unidad ya elegida (por ejemplo, la de un borrador) se conserva para no perderla en silencio.
 */
export function useUnidadesCargables(unidades: Unidad[], idUsuario: number, fecha: string, elegida: string) {
  const asignaciones = useMisAsignaciones(idUsuario, fecha.slice(0, 10))
  const frentes = asignaciones.data?.map((a) => a.frente.id)
  if (!frentes) return unidades
  return unidades.filter((u) => u.usuario?.id === idUsuario || (u.frente !== null && frentes.includes(u.frente.id)) || String(u.id) === elegida)
}

/** Lecturas con valor vecinas a la fecha ingresada (D08, specs/02): la carga atrasada se compara contra esas. */
export function useUltimaLectura(idUnidad: string, fecha: string) {
  return useQuery({
    queryKey: ['last-reading', idUnidad, fecha],
    queryFn: () => api<Recurso<UltimaLectura>>(`/maintenance/units/${idUnidad}/last-reading?fecha=${encodeURIComponent(fecha)}`).then((r) => r.data),
    enabled: idUnidad !== '' && fecha !== '',
  })
}

export function usePanel() {
  return useQuery({ queryKey: ['maintenance-panel'], queryFn: () => api<{ data: FilaPanel[] }>('/maintenance/panel').then((r) => r.data) })
}

/** Fallas abiertas. Con `refrescar` se consulta cada 60 s: es el aviso a Mantenimiento de ADR-003. */
export function useFallasAbiertas(habilitado = true, refrescar = false, pagina = 1) {
  return useQuery({
    queryKey: ['failures', 'abiertas', pagina],
    queryFn: () => api<Paginado<Lectura>>(`/maintenance/failures?estado=abiertas&page=${pagina}`),
    placeholderData: keepPreviousData,
    enabled: habilitado,
    refetchInterval: refrescar ? 60_000 : false,
  })
}

function useMutacion<V, R>(fn: (v: V) => Promise<R>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => Promise.all(['failures', 'maintenance-panel', 'last-reading', 'readings', 'extinguishers'].map((k) => qc.invalidateQueries({ queryKey: [k] }))),
  })
}

export const useRegistrarLectura = () =>
  useMutacion(({ datos, clave }: { datos: Record<string, unknown>; clave: string }) =>
    api<Recurso<Lectura> & { ya_registrado: boolean }>('/maintenance/readings', { method: 'POST', body: datos, headers: { 'Idempotency-Key': clave } }),
  )

export const useAtenderFalla = () =>
  useMutacion(({ id, nota }: { id: number; nota: string }) => api<Recurso<Lectura>>(`/maintenance/failures/${id}/attend`, { method: 'POST', body: { nota } }))

export const useRegistrarMatafuego = () =>
  useMutacion(({ datos, clave }: { datos: Record<string, unknown>; clave: string }) =>
    api<{ data: ControlMatafuego; ya_registrado: boolean }>('/maintenance/extinguishers', { method: 'POST', body: datos, headers: { 'Idempotency-Key': clave } }),
  )

/** Lecturas con su falla y atención (RF09, RF10). El backend limita lo visible: su frente o todo (D20). */
export function useLecturas(f: { unidad?: number; page: number }) {
  const qs = new URLSearchParams({ page: String(f.page), ...(f.unidad ? { unidad: String(f.unidad) } : {}) })
  return useQuery({ queryKey: ['readings', f], queryFn: () => api<Paginado<Lectura>>(`/maintenance/readings?${qs}`), placeholderData: keepPreviousData })
}

export type ControlMatafuego = {
  id: number
  unidad: { id: number; nombre: string }
  operario: { id: number; nombre: string; apellido: string }
  estado: EstadoMatafuego
  fecha_revision: string
  fecha_vencimiento_carga: string | null
  etiqueta_ilegible: boolean
}

/** Controles de matafuego (RF11). El endpoint devuelve el paginador de Laravel sin `meta`: se adapta acá. */
export function useControles(f: { unidad?: number; page: number }) {
  const qs = new URLSearchParams({ page: String(f.page), ...(f.unidad ? { unidad: String(f.unidad) } : {}) })
  return useQuery({
    queryKey: ['extinguishers', f],
    queryFn: () => api<{ data: ControlMatafuego[]; current_page: number; last_page: number; per_page: number; total: number }>(`/maintenance/extinguishers?${qs}`)
      .then(({ data, current_page, last_page, per_page, total }): Paginado<ControlMatafuego> => ({ data, meta: { current_page, last_page, per_page, total } })),
    placeholderData: keepPreviousData,
  })
}
