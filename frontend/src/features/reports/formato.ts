/** Formato es-AR. null = no hay dato en esa magnitud (se muestra "—", nunca 0). */
const n = (v: string | number, dec = 2) => Number(v).toLocaleString('es-AR', { minimumFractionDigits: dec, maximumFractionDigits: dec })

export const toneladas = (v: string | null) => (v === null ? '—' : `${n(v)} t`)
export const m3 = (v: string | null) => (v === null ? '—' : `${n(v)} m³`)
export const litros = (v: string) => `${n(v)} L`
export const pesos = (v: string) => Number(v).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
export const fecha = (iso: string) => iso.split('-').reverse().join('/')

/**
 * Suma por tipo de madera, separando toneladas y m³. Las sumas de presentación sobre pocas filas usan
 * centésimos enteros para no arrastrar errores de float.
 */
export function totalesPorTipo(filas: { tipo_madera: string; toneladas: string | null; metros_cubicos: string | null }[]) {
  const t: Record<string, { toneladas: number | null; metros_cubicos: number | null }> = {}
  for (const f of filas) {
    const acc = (t[f.tipo_madera] ??= { toneladas: null, metros_cubicos: null })
    if (f.toneladas !== null) acc.toneladas = (acc.toneladas ?? 0) + Math.round(Number(f.toneladas) * 100)
    if (f.metros_cubicos !== null) acc.metros_cubicos = (acc.metros_cubicos ?? 0) + Math.round(Number(f.metros_cubicos) * 100)
  }
  return Object.entries(t).map(([tipo, v]) => ({
    tipo_madera: tipo,
    toneladas: v.toneladas === null ? null : (v.toneladas / 100).toFixed(2),
    metros_cubicos: v.metros_cubicos === null ? null : (v.metros_cubicos / 100).toFixed(2),
  }))
}
