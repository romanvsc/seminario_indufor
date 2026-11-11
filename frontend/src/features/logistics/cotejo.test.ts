import { antiguedad, diferenciasViaje, mismasToneladas } from './cotejo'
import type { Viaje } from './api'

const persona = (id: number, nombre: string) => ({ id, nombre, apellido: 'Prueba' })
const viaje = (remito: Partial<NonNullable<Viaje['remito']>> = {}, extra: Partial<Viaje> = {}): Viaje => ({
  id: 3, fecha: '2026-10-19 08:30', estado: 'CORRECCION_SOLICITADA', origen: { id: 1, nombre: 'Prusia' }, destino: 'Planta',
  camion: { id: 9, nombre: 'Camión 1', dominio_patente: null }, camionero: persona(7, 'Camila'), tipo_madera: { id: 1, nombre: 'pulpable' },
  volumen_declarado: '30.00', observaciones: null, solicitud_abierta: null,
  remito: { numero: 'A-1', fecha: '2026-10-19', transportista: persona(7, 'Camila'), tipo_madera: { id: 1, nombre: 'pulpable' }, volumen_toneladas: '30.00', ...remito },
  ...extra,
})

describe('cotejo (solo para mostrar; decide el backend)', () => {
  it('compara toneladas a 2 decimales, como Cotejo.php', () => {
    expect(mismasToneladas('12.5', '12.50')).toBe(true)
    expect(mismasToneladas('12,5', '12.50')).toBe(true)
    expect(mismasToneladas('12.50', '12.51')).toBe(false)
  })

  it('lista cada campo que difiere con sus dos valores legibles', () => {
    expect(diferenciasViaje(viaje())).toEqual([])
    expect(diferenciasViaje(viaje({ volumen_toneladas: '3.00', tipo_madera: { id: 2, nombre: 'aserrable' }, transportista: persona(8, 'Carlos') }))).toEqual([
      { campo: 'volumen', etiqueta: 'Volumen', declarado: '30,00 t', remito: '3,00 t' },
      { campo: 'madera', etiqueta: 'Tipo de madera', declarado: 'Pulpable', remito: 'Aserrable' },
      { campo: 'transportista', etiqueta: 'Transportista', declarado: 'Prueba, Camila', remito: 'Prueba, Carlos' },
    ])
    expect(diferenciasViaje(viaje({}, { remito: null }))).toEqual([])
  })

  it('antigüedad por días de calendario, sin umbrales de urgencia', () => {
    const ahora = new Date(2026, 9, 22, 10, 0)
    expect(antiguedad('2026-10-22 09:00', ahora)).toBe('Hoy')
    expect(antiguedad('2026-10-21 23:59', ahora)).toBe('Ayer')
    expect(antiguedad('2026-10-19 09:00', ahora)).toBe('Hace 3 días')
  })
})
