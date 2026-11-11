import { z } from 'zod'
import { hoy } from '@/features/fronts/api'

/** Reglas de campo compartidas por el alta y la corrección de un parte: las mismas validaciones en los dos lugares. */
export const cantidad = z.string().trim().regex(/^$|^\d{1,8}([.,]\d{1,2})?$/, 'Usá solo números, con hasta 2 decimales.')
export const camposParte = {
  id_frente: z.string().min(1, 'Elegí el frente.'),
  id_unidad: z.string().min(1, 'Elegí la máquina.'),
  tipo_madera: z.string().min(1, 'Elegí pulpable o aserrable.'),
  fecha_registro: z.string().min(1, 'Indicá la fecha.').refine((f) => f <= hoy(), 'La fecha no puede ser posterior a hoy.'),
  cantidad_toneladas: cantidad,
  metros_cubicos: cantidad,
  observaciones: z.string().max(2000),
}
export const conMagnitud = <T extends { cantidad_toneladas: string; metros_cubicos: string }>(d: T) => d.cantidad_toneladas !== '' || d.metros_cubicos !== ''
export const SIN_MAGNITUD = { path: ['cantidad_toneladas'], message: 'Indicá toneladas o metros cúbicos.' }

export const numero = (v: string) => (v === '' ? null : v.replace(',', '.'))
