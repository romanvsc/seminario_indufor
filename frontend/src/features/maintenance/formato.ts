import { numero } from '@/features/reports/formato'
import type { Metrica } from '@/features/machinery/api'
import { UNIDAD_METRICA } from './api'

/** Lectura en es-AR: horas con 2 decimales, kilómetros enteros. */
export const lectura = (v: string | number, metrica: Metrica) => `${numero(v, metrica === 'KILOMETRAJE' ? 0 : 2)} ${UNIDAD_METRICA[metrica]}`

/** 'AAAA-MM-DD' o 'AAAA-MM-DD HH:MM' → 'DD/MM/AAAA[ HH:MM]'. */
export const fecha = (iso: string) => {
  const [f, h] = iso.split(' ')
  return `${f.split('-').reverse().join('/')}${h ? ` ${h}` : ''}`
}
