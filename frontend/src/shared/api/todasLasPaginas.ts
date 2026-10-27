import { api } from './client'
import type { Paginado } from './types'

/**
 * Opciones de un selector: recorre todas las páginas (de a 100, el máximo del backend) en vez de quedarse con la primera.
 * Así ningún registro queda inaccesible desde la interfaz (spec 08, H-08.2) y la copia local sin señal está completa.
 */
export async function todasLasPaginas<T>(ruta: string): Promise<T[]> {
  const sep = ruta.includes('?') ? '&' : '?'
  const primera = await api<Paginado<T>>(`${ruta}${sep}per_page=100&page=1`)
  const resto = await Promise.all(
    Array.from({ length: Math.max(0, primera.meta.last_page - 1) }, (_, i) => api<Paginado<T>>(`${ruta}${sep}per_page=100&page=${i + 2}`)),
  )
  return [primera, ...resto].flatMap((p) => p.data)
}
