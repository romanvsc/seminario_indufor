import { avisos, indicadores } from './reglas'

const nada = { cantidad: 0, items: [] }
const consumos = (extra: object) => ({ periodo: '2026-10', fecha_limite: '2026-11-15', plazo_vencido: false, lote: null, ...extra })

describe('reglas del inicio: gravedad real de cada pendiente', () => {
  it('lo vencido es crítico, lo que falló es atención y lo que solo se sigue es seguimiento; en ese orden', () => {
    const a = avisos({
      viajes_sin_remito: { cantidad: 1, items: [{ id: 3, fecha: '2026-11-02 08:00', origen: 'Prusia', camionero: 'Pérez, Ana' }] },
      fallas_abiertas: { cantidad: 1, items: [{ id: 9, fecha: '2026-11-01 07:30', unidad: 'SK-BP1', frente: 'Bosques del Plata', detalle: 'Display' }] },
      matafuegos_vencidos: { cantidad: 1, items: [{ id: 4, nombre: 'HV-PR1', vencimiento: '2026-10-29' }] },
    })
    expect(a.map((x) => [x.clave, x.nivel])).toEqual([['matafuegos_vencidos', 'critico'], ['fallas_abiertas', 'atencion'], ['viajes_sin_remito', 'seguimiento']])
    expect(a[0]).toMatchObject({ titulo: '1 matafuego con la carga vencida', area: 'Seguridad', contexto: 'HV-PR1, venció el 29/10' })
    expect(a[1].contexto).toBe('SK-BP1 (Bosques del Plata), desde 01/11')
    expect(a[2]).toMatchObject({ ruta: '/viajes?estado=PENDIENTE', contexto: 'Del 02/11 desde Prusia' })
  })

  it('el consolidado distingue no importado en plazo, plazo vencido e importado con errores (lote vigente); el lote completo no avisa', () => {
    expect(avisos({ consumos_periodo_vencido: consumos({}) })[0]).toMatchObject({ nivel: 'seguimiento', contexto: 'Fecha límite: 15/11/2026' })
    expect(avisos({ consumos_periodo_vencido: consumos({ plazo_vencido: true }) })[0]).toMatchObject({ nivel: 'critico', contexto: 'El plazo venció el 15/11/2026' })
    const parcial = { id: 1, estado: 'PARCIAL' as const, archivo: 'x.csv', fecha: '2026-11-02 10:00', unidades: 4, filas_con_error: 2 }
    expect(avisos({ consumos_periodo_vencido: consumos({ lote: parcial }) })[0]).toMatchObject({
      nivel: 'atencion', titulo: 'El consolidado de 2026-10 se importó incompleto', contexto: '2 filas con error · 4 unidades importadas',
    })
    expect(avisos({ consumos_periodo_vencido: consumos({ lote: { ...parcial, estado: 'OK', filas_con_error: 0 } }) })).toEqual([])
  })

  it('las lecturas sin enviar se presentan como revisión del envío automático, no como tarea habitual', () => {
    const [a] = avisos({ lecturas_sin_exportar: { cantidad: 3, items: [{ id: 1, fecha: '2026-10-30 08:00', unidad: 'HV-01' }] } })
    expect(a).toMatchObject({ nivel: 'atencion', titulo: '3 lecturas sin enviar al sistema de gastos', contexto: 'Revisar el envío automático · la más antigua del 30/10' })
  })

  it('sin pendientes no hay avisos, y las tarjetas muestran solo lo que el rol puede ver, en cero como "ok"', () => {
    const p = { viajes_sin_remito: nada, lecturas_sin_exportar: { cantidad: 3, items: [] }, fallas_abiertas: nada, matafuegos_vencidos: nada, correcciones_abiertas: nada }
    expect(avisos({ viajes_sin_remito: nada, fallas_abiertas: nada })).toEqual([])
    const t = indicadores(p)
    expect(t.map((x) => x.clave)).toEqual(['viajes_sin_remito', 'lecturas_sin_exportar', 'fallas_abiertas', 'matafuegos_vencidos'])
    expect(t[0]).toMatchObject({ valor: 0, nivel: 'ok', subtitulo: 'Todo cotejado' })
    expect(t[1]).toMatchObject({ valor: 3, nivel: 'atencion', subtitulo: 'Pendientes de envío' })
    expect(indicadores({ unidades_sin_lectura_semana: { cantidad: 2, items: [] } }).map((x) => x.titulo)).toEqual(['Sin lectura semanal'])
  })
})
