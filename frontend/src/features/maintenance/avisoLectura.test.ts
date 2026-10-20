import { avisoLectura } from './avisoLectura'

const anterior = { valor: '1250.00', fecha: '13/10/2026 08:00' }

describe('avisoLectura (RNF05, aviso en el formulario)', () => {
  it('bloquea una lectura menor que la anterior, nombrando los números invertidos', () => {
    expect(avisoLectura('HOROMETRO', '1205', anterior, '2026-10-20T08:00')).toMatchObject({ tipo: 'bloquea' })
    expect(avisoLectura('HOROMETRO', '1205', anterior, '2026-10-20T08:00')?.texto).toContain('1250.00 h')
  })

  it('advierte si el horómetro sube más horas que las transcurridas', () => {
    expect(avisoLectura('HOROMETRO', '1500', anterior, '2026-10-20T08:00')).toMatchObject({ tipo: 'advierte' }) // 250 h en 168 h
    expect(avisoLectura('HOROMETRO', '1300,5', anterior, '2026-10-20T08:00')).toBeNull()
  })

  it('kilometraje: advierte saltos de más de 1500 km por día', () => {
    const km = { valor: '85000', fecha: '19/10/2026 08:00' }
    expect(avisoLectura('KILOMETRAJE', '85800', km, '2026-10-20T08:00')).toBeNull()
    expect(avisoLectura('KILOMETRAJE', '95000', km, '2026-10-20T08:00')).toMatchObject({ tipo: 'advierte' })
  })

  it('sin anterior o sin valor no avisa', () => {
    expect(avisoLectura('HOROMETRO', '10', null, '2026-10-20T08:00')).toBeNull()
    expect(avisoLectura('HOROMETRO', '', anterior, '2026-10-20T08:00')).toBeNull()
  })
})
