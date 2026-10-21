import { m3, toneladas, totalesPorTipo } from './formato'

describe('formato de reportes', () => {
  it('suma por tipo sin mezclar pulpable con aserrable ni toneladas con m³', () => {
    expect(totalesPorTipo([
      { tipo_madera: 'pulpable', toneladas: '10.10', metros_cubicos: null },
      { tipo_madera: 'pulpable', toneladas: '0.20', metros_cubicos: null },
      { tipo_madera: 'aserrable', toneladas: null, metros_cubicos: '3.00' },
      { tipo_madera: 'aserrable', toneladas: '7.25', metros_cubicos: '2.00' },
    ])).toEqual([
      { tipo_madera: 'pulpable', toneladas: '10.30', metros_cubicos: null },
      { tipo_madera: 'aserrable', toneladas: '7.25', metros_cubicos: '5.00' },
    ])
  })

  it('sin dato muestra guion, no cero', () => {
    expect(toneladas(null)).toBe('—')
    expect(m3('1234.5')).toBe('1.234,50 m³')
  })
})
