import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockFetch, renderConApp } from '@/test/render'
import { MisLecturasPage } from './MisLecturasPage'

afterEach(() => vi.unstubAllGlobals())

const meta = { current_page: 1, last_page: 1, per_page: 20, total: 1 }
const persona = { id: 3, nombre: 'Olga', apellido: 'Operaria' }
const lectura = { id: 1, fecha_lectura: '2026-10-20 08:00', unidad: { id: 9, nombre: 'HV-01', metrica: 'HOROMETRO', frente: 'Prusia' }, horometro_actual: '1250.50', kilometraje_actual: null, operario: persona, tiene_falla: true, detalle_falla: 'Display roto', atencion: null }
const sesion = (permisos: string[]) => ({ id: 1, nombre: 'A', apellido: 'X', email: 'a@indufor.test', roles: [], permisos })
const api = (data: unknown[]) => ({
  'GET /maintenance/readings': { status: 200, body: { data, meta } },
  'GET /machinery': { status: 200, body: { data: [], meta } },
  'GET /fronts': { status: 200, body: { data: [{ id: 4, nombre: 'Prusia' }], meta } },
})

describe('MisLecturasPage (UIX-007)', () => {
  it('los filtros viajan al backend y la lista vacía lo dice según los filtros', async () => {
    const llamadas = mockFetch(api([]))
    renderConApp(<MisLecturasPage />, { usuario: sesion(['maintenance.reading.view']) })
    expect(await screen.findByText('Todavía no hay lecturas.')).toBeInTheDocument()
    await userEvent.click(screen.getByLabelText('Estado'))
    await userEvent.click(screen.getByRole('option', { name: 'Falla abierta' }))
    await userEvent.click(screen.getByLabelText('Frente de la unidad'))
    await userEvent.click(await screen.findByRole('option', { name: 'Prusia' }))
    await vi.waitFor(() => expect(llamadas.some((l) => l.url.includes('falla=abierta') && l.url.includes('frente=4'))).toBe(true))
    expect(await screen.findByText('No hay lecturas con esos filtros.')).toBeInTheDocument()
  })

  it('muestra el frente y la falla abierta; enlaza al historial solo con permiso para verlo', async () => {
    mockFetch(api([lectura]))
    const { unmount } = renderConApp(<MisLecturasPage />, { usuario: sesion(['maintenance.reading.view', 'maintenance.failure.view']) })
    expect(await screen.findByRole('link', { name: 'HV-01' })).toHaveAttribute('href', '/mantenimiento/unidad/9')
    expect(screen.getByText('⚠ Abierta')).toBeInTheDocument()
    expect(screen.getByText('Display roto')).toBeInTheDocument()
    expect(screen.getByText('Prusia', { selector: 'span' })).toBeInTheDocument()
    unmount()

    renderConApp(<MisLecturasPage />, { usuario: sesion(['maintenance.reading.view']) })
    expect(await screen.findByText('HV-01')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'HV-01' })).not.toBeInTheDocument()
  })
})
