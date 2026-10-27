import { screen, within } from '@testing-library/react'
import { Route, Routes } from 'react-router'
import { mockFetch, renderConApp } from '@/test/render'
import { HistorialUnidadPage } from './HistorialUnidadPage'

afterEach(() => vi.unstubAllGlobals())

const meta = { current_page: 1, last_page: 1, per_page: 20, total: 2 }
const persona = { id: 3, nombre: 'Olga', apellido: 'Operaria' }
const unidad = { id: 9, nombre: 'HV-01', metrica: 'HOROMETRO', frente: 'Prusia' }
const lecturas = [
  { id: 1, fecha_lectura: '2026-10-20 08:00', unidad, horometro_actual: '1250.50', kilometraje_actual: null, operario: persona, tiene_falla: false, detalle_falla: null, atencion: null },
  { id: 2, fecha_lectura: '2026-10-21 08:00', unidad, horometro_actual: null, kilometraje_actual: null, operario: persona, tiene_falla: true, detalle_falla: 'Display roto',
    atencion: { fecha: '2026-10-21 15:00', por: { id: 5, nombre: 'Mara', apellido: 'Mantenimiento' }, nota: 'Se cambió el display' } },
]
const controles = { data: [{ id: 7, unidad: { id: 9, nombre: 'HV-01' }, operario: persona, estado: 'FALTANTE', fecha_revision: '2026-10-21', fecha_vencimiento_carga: null, etiqueta_ilegible: false }],
  current_page: 1, last_page: 1, per_page: 50, total: 1 }

describe('HistorialUnidadPage (spec 08, CA-08.7)', () => {
  it('muestra lecturas, la falla atendida con su nota y los controles de matafuego de la unidad', async () => {
    const llamadas = mockFetch({
      'GET /machinery/9': { status: 200, body: { data: { id: 9, nombre: 'HV-01', dominio_patente: null, tipo: { id: 1, nombre: 'Harvester', metrica: 'HOROMETRO' }, frente: { id: 2, nombre: 'Prusia' } } } },
      'GET /maintenance/readings': { status: 200, body: { data: lecturas, meta } },
      'GET /maintenance/extinguishers': { status: 200, body: controles },
    })
    renderConApp(<Routes><Route path="/mantenimiento/unidad/:id" element={<HistorialUnidadPage />} /></Routes>, { ruta: '/mantenimiento/unidad/9' })

    expect(await screen.findByRole('heading', { name: 'Historial de HV-01' })).toBeInTheDocument()
    expect(await screen.findByText('1250.50 h')).toBeInTheDocument()
    expect(screen.getByText(/Atendida el 21\/10\/2026 15:00 por Mantenimiento: Se cambió el display/)).toBeInTheDocument()
    const filaControl = (await screen.findByText('Faltante')).closest('tr')!
    expect(within(filaControl).getByText('21/10/2026')).toBeInTheDocument()
    expect(llamadas.some((l) => l.url.startsWith('/maintenance/readings?') && l.url.includes('unidad=9'))).toBe(true)
    expect(llamadas.some((l) => l.url.startsWith('/maintenance/extinguishers?') && l.url.includes('unidad=9'))).toBe(true)
  })
})
