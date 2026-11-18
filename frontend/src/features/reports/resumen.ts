import type { FilaDiaria } from './api'

// Centésimos enteros: sumas de presentación sin errores de float
const cent = (v: string | null) => (v === null ? 0 : Math.round(Number(v) * 100))

/** Toneladas totales de un conjunto de filas (los m³ nunca se suman a las toneladas). */
export const totalToneladas = (filas: { toneladas: string | null }[]) => filas.reduce((s, f) => s + cent(f.toneladas), 0) / 100

/** Variación porcentual contra el tramo anterior; sin base (0) no hay comparación posible. */
export function variacion(actual: number, anterior: number): number | null {
  if (anterior === 0) return null
  return Math.round(((actual - anterior) / anterior) * 100)
}

const lunesDe = (iso: string) => {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d.toLocaleDateString('sv-SE')
}

/** Toneladas por semana (lunes a domingo) y tipo de madera, en orden cronológico. */
export function porSemana(filas: FilaDiaria[]) {
  const semanas = new Map<string, { pulpable: number; aserrable: number }>()
  for (const f of filas) {
    const s = semanas.get(lunesDe(f.fecha)) ?? { pulpable: 0, aserrable: 0 }
    if (f.tipo_madera === 'pulpable' || f.tipo_madera === 'aserrable') s[f.tipo_madera] += cent(f.toneladas)
    semanas.set(lunesDe(f.fecha), s)
  }
  return [...semanas.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([lunes, s]) => ({
    semana: lunes.slice(8, 10) + '/' + lunes.slice(5, 7), pulpable: s.pulpable / 100, aserrable: s.aserrable / 100,
  }))
}

/** Toneladas por frente, con su participación en el total; los m³ se informan aparte. */
export function cargaPorFrente(filas: { frente: string; toneladas: string | null; metros_cubicos: string | null }[]) {
  const frentes = new Map<string, { t: number; m3: number }>()
  for (const f of filas) {
    const a = frentes.get(f.frente) ?? { t: 0, m3: 0 }
    a.t += cent(f.toneladas)
    a.m3 += cent(f.metros_cubicos)
    frentes.set(f.frente, a)
  }
  const total = [...frentes.values()].reduce((s, a) => s + a.t, 0)
  return [...frentes.entries()].map(([frente, a]) => ({
    frente, toneladas: a.t / 100, metros_cubicos: a.m3 / 100, porcentaje: total ? Math.round((a.t / total) * 100) : 0,
  })).sort((x, y) => y.toneladas - x.toneladas || x.frente.localeCompare(y.frente))
}
