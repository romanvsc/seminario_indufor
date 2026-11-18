import { capitalizar, toneladas } from '@/features/reports/formato'
import type { Viaje } from './api'

export type CampoCotejo = 'volumen' | 'madera' | 'transportista'
export type Diferencia = { campo: CampoCotejo; etiqueta: string; declarado: string; remito: string }

const ETIQUETA: Record<CampoCotejo, string> = { volumen: 'Volumen', madera: 'Tipo de madera', transportista: 'Transportista' }
const persona = (p: { nombre: string; apellido: string }) => `${p.apellido}, ${p.nombre}`

/** Toneladas comparadas a 2 decimales, como el backend: "12.5" y "12.50" son iguales. */
export const mismasToneladas = (a: string, b: string) => Number(a.replace(',', '.')).toFixed(2) === Number(b.replace(',', '.')).toFixed(2)

/**
 * Campos en los que el viaje y su remito no coinciden, para MOSTRARLOS (RF07, D05, D06).
 * Replica las reglas de `Cotejo.php`, pero no decide nada: el viaje solo se valida con el recotejo del backend.
 */
export function diferenciasViaje(v: Viaje): Diferencia[] {
  const r = v.remito
  if (!r) return []
  const d: Diferencia[] = []
  if (!mismasToneladas(v.volumen_declarado, r.volumen_toneladas)) d.push({ campo: 'volumen', etiqueta: ETIQUETA.volumen, declarado: toneladas(v.volumen_declarado), remito: toneladas(r.volumen_toneladas) })
  if (v.tipo_madera.id !== r.tipo_madera.id) d.push({ campo: 'madera', etiqueta: ETIQUETA.madera, declarado: capitalizar(v.tipo_madera.nombre), remito: capitalizar(r.tipo_madera.nombre) })
  if (v.camionero.id !== r.transportista.id) d.push({ campo: 'transportista', etiqueta: ETIQUETA.transportista, declarado: persona(v.camionero), remito: persona(r.transportista) })
  return d
}

/** "Hoy", "Ayer" o "Hace N días" desde la fecha de la solicitud ("2026-10-19 09:00"). Sin umbrales de urgencia. */
export function antiguedad(fecha: string, ahora = new Date()) {
  const [a, m, d] = fecha.slice(0, 10).split('-').map(Number)
  const dias = Math.round((Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()) - Date.UTC(a, m - 1, d)) / 86_400_000)
  if (dias <= 0) return 'Hoy'
  if (dias === 1) return 'Ayer'
  return `Hace ${dias} días`
}

export { persona as nombrePersona }
