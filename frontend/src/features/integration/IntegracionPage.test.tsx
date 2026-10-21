import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockFetch, renderConApp } from '@/test/render'
import { IntegracionPage } from './IntegracionPage'

afterEach(() => vi.unstubAllGlobals())

const sesion = { id: 1, nombre: 'A', apellido: 'X', email: 'a@indufor.test', roles: [], permisos: ['integration.view-history', 'integration.import-costs', 'integration.export-readings'] }
const lotes = { status: 200, body: { data: [], pendientes_exportacion: 2 } }

describe('IntegracionPage', () => {
  it('muestra las lecturas pendientes de envío y permite reintentar', async () => {
    mockFetch({ 'GET /integrations/batches': lotes, 'GET /integrations/consumptions': { status: 200, body: { data: [], totales: { litros: '0', costo_total: '0' } } } })
    renderConApp(<IntegracionPage />, { usuario: sesion })
    expect(await screen.findByText('⚠ 2 lecturas pendientes de envío')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar envío' })).toBeEnabled()
  })

  it('si el período ya está importado, ofrece reemplazarlo pidiendo el motivo', async () => {
    const llamadas = mockFetch({
      'GET /integrations/batches': lotes,
      'GET /integrations/consumptions': { status: 200, body: { data: [], totales: { litros: '0', costo_total: '0' } } },
      'POST /integrations/imports': { status: 422, body: { error: { code: 'PERIODO_YA_IMPORTADO', message: 'El período 2026-09 ya tiene un consolidado importado.', details: {} } } },
    })
    renderConApp(<IntegracionPage />, { usuario: sesion })
    await userEvent.upload(screen.getByLabelText('Archivo CSV'), new File(['periodo,codigo_unidad,litros,costo_total,referencia_externa\n'], 'c.csv', { type: 'text/csv' }))
    await userEvent.click(screen.getByRole('button', { name: 'Importar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('ya tiene un consolidado importado')
    expect(screen.getByLabelText('Reemplazar el consolidado ya importado de este período')).toBeChecked()
    expect(screen.getByLabelText('Motivo del reemplazo')).toBeInTheDocument()
    const post = llamadas.find((l) => l.metodo === 'POST')!.body as FormData
    expect(post.get('reemplazar')).toBe('0')
    expect((post.get('archivo') as File).name).toBe('c.csv')
  })
})
