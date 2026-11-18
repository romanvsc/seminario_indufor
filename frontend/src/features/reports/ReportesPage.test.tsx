import { screen, within } from '@testing-library/react'
import { mockFetch, renderConApp } from '@/test/render'
import { ReportesPage } from './ReportesPage'

afterEach(() => vi.unstubAllGlobals())

const sesion = { id: 1, nombre: 'Ana', apellido: 'X', email: 'a@indufor.test', roles: [], permisos: ['reports.financial'] }
const indicadores = { lecturas: 2, fallas_reportadas: 1, fallas_abiertas: 0, solicitudes_abiertas: 0, unidades_activas: 5, unidades_sin_lectura_semana: 5, matafuegos_vencidos: 1 }

describe('ReportesPage: consolidado mensual (UIX-031)', () => {
  it('sin lote importado no muestra un total en cero y separa la situación actual del período', async () => {
    mockFetch({
      'GET /reports/monthly': { status: 200, body: { data: {
        periodo: '2026-10', desde: '2026-10-01', hasta: '2026-10-31', es_periodo_vencido: false, fecha_limite: '2026-11-15', lote_vigente: null,
        produccion: [], viajes: [], operativo: indicadores, consumos: [], total_consumos: { litros: '0.00', costo_total: '0.00' },
      } } },
    })
    renderConApp(<ReportesPage />, { usuario: sesion, ruta: '/reportes?pestana=mensual' })
    expect(await screen.findByText(/Sin datos importados: el total aparece/)).toBeInTheDocument()
    expect(screen.queryByText(/^Total:/)).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Situación actual' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'En el período' })).toBeInTheDocument()
  })
})

describe('ReportesPage: jerarquía y navegación (UIX-032)', () => {
  const operativo = { status: 200, body: { data: { viajes: [], indicadores } } }

  it('con un solo reporte no hay pestañas: queda el título del reporte', async () => {
    mockFetch({ 'GET /reports/operational': operativo })
    renderConApp(<ReportesPage />, { usuario: { ...sesion, permisos: ['reports.operational'] } })
    expect(await screen.findByRole('heading', { level: 2, name: 'Operativo' })).toBeInTheDocument()
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Reporte')).not.toBeInTheDocument()
  })

  it('con varios, el selector «Reporte» los lista todos y el título sigue a la pestaña activa', async () => {
    const fila = { id_frente: 1, frente: 'Prusia', tipo_madera: 'aserrable', toneladas: '12.00', metros_cubicos: null, partes: 1 }
    mockFetch({
      'GET /reports/operational': operativo,
      'GET /reports/production/fortnight': { status: 200, body: { data: { periodo: '2026-11', quincena: 1, desde: '2026-11-01', hasta: '2026-11-15', en_curso: false, por_frente: [fila], detalle: [] } } },
    })
    renderConApp(<ReportesPage />, { usuario: { ...sesion, permisos: ['reports.production', 'reports.operational'] }, ruta: '/reportes?pestana=quincenal' })
    expect(await screen.findByRole('heading', { level: 2, name: 'Quincenal' })).toBeInTheDocument()
    expect(within(screen.getByLabelText('Reporte')).getAllByRole('option').map((o) => o.textContent)).toEqual(['Quincenal', 'Producción histórica', 'Operativo'])
    // Apilada: el frente titula la tarjeta (sin etiqueta) y el m³ sin medición no ocupa una línea
    const celda = (await screen.findByText('Prusia')).closest('td')!
    expect(celda).not.toHaveAttribute('data-label')
    expect(within(celda.closest('tr')!).getByText('—').closest('td')).toHaveAttribute('data-apilada', 'oculta')
  })
})
