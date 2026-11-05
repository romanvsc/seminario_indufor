import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockFetch, renderConApp } from '@/test/render'
import { PanelPage } from './PanelPage'

afterEach(() => vi.unstubAllGlobals())

const sesion = (permisos: string[]) => ({ id: 1, nombre: 'Ana', apellido: 'X', email: 'a@test', roles: [], permisos })
const unidad = (id: number, nombre: string, frente: string, extra = {}) => ({
  unidad: { id, nombre, tipo: 'Máquina', metrica: 'HOROMETRO', frente }, ultima_lectura: null,
  ultima_carga_sin_valor: null, lectura_semana: true, fallas_abiertas: 0,
  matafuego: { estado: 'OK', revision: '2026-11-01', vencimiento: '2027-01-01', etiqueta_ilegible: false, control_del_mes: true, vencido: false, por_vencer: false }, ...extra,
})
const unidades = [unidad(1, 'HV-01', 'Prusia', { lectura_semana: false, fallas_abiertas: 1 }), unidad(2, 'SK-02', 'Bosques', { matafuego: null }), unidad(3, 'HV-03', 'Prusia')]
const meta = { current_page: 1, last_page: 1, per_page: 50, total: 1 }
const falla = { id: 10, unidad: { id: 1, nombre: 'HV-01', frente: 'Prusia' }, fecha_lectura: '2026-11-01 08:00', detalle_falla: 'Fuga de aceite', operario: { nombre: 'Ana', apellido: 'López' } }

describe('Panel de Mantenimiento', () => {
  it('muestra conteos reales y combina filtros con búsqueda y limpieza', async () => {
    mockFetch({ 'GET /maintenance/panel': { status: 200, body: { data: unidades } }, 'GET /maintenance/failures': { status: 200, body: { data: [falla], meta } } })
    renderConApp(<PanelPage />, { usuario: sesion(['maintenance.failure.view']) })
    expect(await screen.findByRole('button', { name: /1.*sin lectura semanal/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /1.*matafuegos con pendientes/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /fallas abiertas.*ver fallas/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /HV-01.*ver historial/i })).toHaveAttribute('href', '/mantenimiento/unidad/1')
    await userEvent.click(screen.getByRole('button', { name: /1.*sin lectura semanal/i }))
    expect(screen.getByRole('region', { name: 'Estado de la flota' })).toHaveFocus()
    expect(screen.getByRole('link', { name: /HV-01/ })).toHaveAttribute('href', '/mantenimiento/unidad/1')
    expect(screen.queryByRole('link', { name: /SK-02/ })).not.toBeInTheDocument()
    await userEvent.click(screen.getByLabelText('Frente'))
    await userEvent.click(screen.getByRole('option', { name: 'Bosques' }))
    expect(screen.getByText('No hay unidades con esos filtros.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    await userEvent.type(screen.getByLabelText('Buscar unidad'), 'sk-02')
    expect(screen.getByRole('link', { name: /SK-02/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /HV-01/ })).not.toBeInTheDocument()
  })

  it('permite atender solo con permiso y envía la nota', async () => {
    const llamadas = mockFetch({ 'GET /maintenance/panel': { status: 200, body: { data: unidades } }, 'GET /maintenance/failures': { status: 200, body: { data: [falla], meta } }, 'POST /maintenance/failures/10/attend': { status: 200, body: { data: falla } } })
    const { unmount } = renderConApp(<PanelPage />, { usuario: sesion(['maintenance.failure.view']) })
    expect(await screen.findByText('Fuga de aceite')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Marcar atendida' })).not.toBeInTheDocument()
    unmount()
    renderConApp(<PanelPage />, { usuario: sesion(['maintenance.failure.view', 'maintenance.failure.manage']) })
    await userEvent.click(await screen.findByRole('button', { name: 'Marcar atendida' }))
    await userEvent.type(screen.getByLabelText('Qué se hizo'), 'Se reparó la fuga')
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    await vi.waitFor(() => expect(llamadas.some((x) => x.metodo === 'POST' && x.url.includes('/failures/10/attend') && (x.body as { nota: string }).nota === 'Se reparó la fuga')).toBe(true))
  })

  it('explica errores recuperables y advierte el límite de la flota', async () => {
    mockFetch({ 'GET /maintenance/panel': { status: 200, body: { data: Array.from({ length: 200 }, (_, i) => unidad(i, `U-${i}`, 'Prusia')) } }, 'GET /maintenance/failures': { status: 500, body: { message: 'Error' } } })
    renderConApp(<PanelPage />, { usuario: sesion(['maintenance.failure.view']) })
    expect(await screen.findByText(/podrían estar incompletos/i)).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Fallas abiertas' })).getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('muestra el estado vacío, errores de flota y accesos solo con permiso', async () => {
    mockFetch({ 'GET /maintenance/panel': { status: 500, body: { message: 'Error' } }, 'GET /maintenance/failures': { status: 200, body: { data: [], meta: { ...meta, total: 0 } } } })
    renderConApp(<PanelPage />, { usuario: sesion(['maintenance.failure.view', 'maintenance.reading.create']) })
    expect(await screen.findByText('No hay fallas abiertas.')).toBeInTheDocument()
    expect(await screen.findByText('No se pudo cargar el estado de la flota.')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Estado de la flota' })).getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Cargar lectura' })).toHaveAttribute('href', '/lecturas/nueva')
    expect(screen.queryByRole('link', { name: 'Control de matafuego' })).not.toBeInTheDocument()
  })

  it('conserva la explicación de vencimiento, faltante y control mensual', async () => {
    const vencido = { estado: 'OK', revision: '2026-10-01', vencimiento: '2026-10-29', etiqueta_ilegible: false, control_del_mes: false, vencido: true, por_vencer: false }
    const faltante = { estado: 'FALTANTE', revision: '2026-11-01', vencimiento: null, etiqueta_ilegible: false, control_del_mes: true, vencido: false, por_vencer: false }
    mockFetch({ 'GET /maintenance/panel': { status: 200, body: { data: [unidad(1, 'HV-01', 'Prusia', { matafuego: vencido }), unidad(2, 'HV-02', 'Prusia', { matafuego: faltante })] } }, 'GET /maintenance/failures': { status: 200, body: { data: [], meta: { ...meta, total: 0 } } } })
    renderConApp(<PanelPage />, { usuario: sesion(['maintenance.failure.view']) })
    expect(await screen.findByText(/Venció el 29\/10\/2026/)).toBeInTheDocument()
    expect(screen.getByText(/Sin control este mes/)).toBeInTheDocument()
    expect(screen.getByText(/Falta el matafuego/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /2.*matafuegos con pendientes/i }))
    expect(screen.getByText('2 de 2 unidades')).toBeInTheDocument()
  })
})
