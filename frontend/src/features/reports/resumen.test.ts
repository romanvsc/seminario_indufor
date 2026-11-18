import { cargaPorFrente, porSemana, totalToneladas, variacion } from './resumen'

const fila = (fecha: string, tipo_madera: string, toneladas: string | null, metros_cubicos: string | null = null) => ({ fecha, tipo_madera, toneladas, metros_cubicos })

describe('resumen de la quincena (UIX-021)', () => {
  it('suma toneladas sin float y nunca mezcla m³', () => {
    expect(totalToneladas([{ toneladas: '0.10' }, { toneladas: '0.20' }, { toneladas: null }])).toBe(0.3)
  })

  it('variación: sin base no compara; con base redondea el porcentaje', () => {
    expect(variacion(10, 0)).toBeNull()
    expect(variacion(15, 10)).toBe(50)
    expect(variacion(7, 10)).toBe(-30)
  })

  it('agrupa por semana de lunes a domingo, en orden', () => {
    const s = porSemana([fila('2026-10-19', 'pulpable', '5.00'), fila('2026-10-12', 'aserrable', '2.50'), fila('2026-10-18', 'pulpable', '1.00'), fila('2026-10-21', 'aserrable', null, '3.00')])
    expect(s).toEqual([{ semana: '12/10', pulpable: 1, aserrable: 2.5 }, { semana: '19/10', pulpable: 5, aserrable: 0 }])
  })

  it('carga por frente ordenada por toneladas, con su porcentaje y los m³ aparte', () => {
    const c = cargaPorFrente([
      { frente: 'Prusia', toneladas: '2.00', metros_cubicos: '3.00' },
      { frente: 'Papel Misionero', toneladas: '6.00', metros_cubicos: null },
      { frente: 'Papel Misionero', toneladas: null, metros_cubicos: '1.00' },
    ])
    expect(c).toEqual([
      { frente: 'Papel Misionero', toneladas: 6, metros_cubicos: 1, porcentaje: 75 },
      { frente: 'Prusia', toneladas: 2, metros_cubicos: 3, porcentaje: 25 },
    ])
  })
})
