import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockFetch, renderConApp } from '@/test/render'
import { PanelPage } from './PanelPage'

afterEach(() => vi.unstubAllGlobals())

const sesion = (permisos: string[]) => ({ id: 1, nombre: 'Ana', apellido: 'X', email: 'a@test', roles: [], permisos })
const GERENCIA = ['maintenance.failure.view']
const MANTENIMIENTO = ['maintenance.failure.view', 'maintenance.failure.manage']
const ADMINISTRACION = ['maintenance.failure.view', 'maintenance.reading.create', 'maintenance.extinguisher.create']
const unidad = (id: number, nombre: string, frente: string, extra = {}) => ({
  unidad: { id, nombre, tipo: 'Máquina', metrica: 'HOROMETRO', frente }, ultima_lectura: null,
  ultima_carga_sin_valor: null, lectura_semana: true, fallas_abiertas: 0,
  matafuego: { estado: 'OK', revision: '2026-11-01', vencimiento: '2027-01-01', etiqueta_ilegible: false, control_del_mes: true, vencido: false, por_vencer: false }, ...extra,
})
const unidades = [unidad(1, 'HV-01', 'Prusia', { lectura_semana: false, fallas_abiertas: 1 }), unidad(2, 'SK-02', 'Bosques', { matafuego: null }), unidad(3, 'HV-03', 'Prusia')]
const meta = { current_page: 1, last_page: 1, per_page: 50, total: 1 }
const falla = { id: 10, unidad: { id: 1, nombre: 'HV-01', frente: 'Prusia' }, fecha_lectura: '2026-11-01 08:00', detalle_falla: 'Fuga de aceite', operario: { nombre: 'Ana', apellido: 'López' } }
const respuestas = { 'GET /maintenance/panel': { status: 200, body: { data: unidades } }, 'GET /maintenance/failures': { status: 200, body: { data: [falla], meta } } }
const pestana = (nombre: RegExp) => screen.getByRole('tab', { name: nombre })

describe('Panel de Mantenimiento (UIX-048: bandeja por rol)', () => {
  it('Mantenimiento abre en Fallas y atiende con una nota; las fallas no se repiten en otra sección', async () => {
    const llamadas = mockFetch({ ...respuestas, 'POST /maintenance/failures/10/attend': { status: 200, body: { data: falla } } })
    renderConApp(<PanelPage />, { usuario: sesion(MANTENIMIENTO) })
    expect(await screen.findByText('Fuga de aceite')).toBeInTheDocument()
    expect(pestana(/^Fallas 1/)).toHaveAttribute('aria-selected', 'true')
    expect(await screen.findByRole('tab', { name: /^Lecturas faltantes 1/ })).toBeInTheDocument()
    expect(pestana(/^Matafuegos 1/)).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Marcar atendida' }))
    await userEvent.type(screen.getByLabelText('Qué se hizo'), 'Se reparó la fuga')
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    await vi.waitFor(() => expect(llamadas.some((x) => x.metodo === 'POST' && x.url.includes('/failures/10/attend') && (x.body as { nota: string }).nota === 'Se reparó la fuga')).toBe(true))
  })

  it('Administración abre en Lecturas faltantes y cada fila lleva al formulario con la unidad elegida', async () => {
    mockFetch(respuestas)
    renderConApp(<PanelPage />, { usuario: sesion(ADMINISTRACION) })
    expect(await screen.findByRole('link', { name: 'Cargar lectura de HV-01' })).toHaveAttribute('href', '/lecturas/nueva?unidad=1')
    expect(pestana(/^Lecturas faltantes/)).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByRole('link', { name: /SK-02/ })).not.toBeInTheDocument()
    await userEvent.click(pestana(/^Matafuegos/))
    expect(screen.getByRole('link', { name: 'Registrar control de SK-02' })).toHaveAttribute('href', '/matafuegos/nuevo?unidad=2')
    expect(screen.queryByRole('link', { name: /HV-03/ })).not.toBeInTheDocument()
    await userEvent.click(pestana(/^Fallas/))
    expect(await screen.findByText('Fuga de aceite')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Marcar atendida' })).not.toBeInTheDocument()
  })

  it('quien solo consulta abre en Toda la flota, sin acciones, y combina búsqueda, frente y limpieza', async () => {
    mockFetch(respuestas)
    renderConApp(<PanelPage />, { usuario: sesion(GERENCIA) })
    expect(await screen.findByRole('link', { name: /HV-01.*ver historial/i })).toHaveAttribute('href', '/mantenimiento/unidad/1')
    expect(pestana(/^Toda la flota/)).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByRole('link', { name: /^Cargar lectura/ })).not.toBeInTheDocument()
    await userEvent.click(screen.getByLabelText('Frente'))
    await userEvent.click(screen.getByRole('option', { name: 'Bosques' }))
    expect(screen.queryByRole('link', { name: /HV-01/ })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    await userEvent.type(screen.getByLabelText('Buscar unidad'), 'sk-02')
    expect(screen.getByRole('link', { name: /SK-02/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /HV-01/ })).not.toBeInTheDocument()
    await userEvent.click(pestana(/^Lecturas faltantes/))
    expect(screen.getByText('No hay unidades con esos filtros.')).toBeInTheDocument()
  })

  it('abre en la pestaña pedida y enfocado cuando llega desde una alerta de Inicio (UIX-023)', async () => {
    mockFetch(respuestas)
    renderConApp(<PanelPage />, { usuario: sesion(MANTENIMIENTO), ruta: '/mantenimiento?situacion=matafuegos#pendientes' })
    expect(await screen.findByRole('link', { name: /SK-02/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /HV-01/ })).not.toBeInTheDocument()
    expect(pestana(/^Matafuegos/)).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('region', { name: 'Pendientes de mantenimiento' })).toHaveFocus()
  })

  it('explica errores recuperables y advierte el límite de la flota', async () => {
    mockFetch({ 'GET /maintenance/panel': { status: 200, body: { data: Array.from({ length: 200 }, (_, i) => unidad(i, `U-${i}`, 'Prusia')) } }, 'GET /maintenance/failures': { status: 500, body: { message: 'Error' } } })
    renderConApp(<PanelPage />, { usuario: sesion(MANTENIMIENTO) })
    expect(await screen.findByText(/podrían estar incompletos/i)).toBeInTheDocument()
    expect(await screen.findByText('No se pudieron cargar las fallas.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('muestra estados vacíos, errores de flota y accesos solo con permiso', async () => {
    mockFetch({ 'GET /maintenance/panel': { status: 500, body: { message: 'Error' } }, 'GET /maintenance/failures': { status: 200, body: { data: [], meta: { ...meta, total: 0 } } } })
    renderConApp(<PanelPage />, { usuario: sesion(['maintenance.failure.view', 'maintenance.reading.create']) })
    expect(await screen.findByText('No se pudo cargar el estado de la flota.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Cargar lectura' })).toHaveAttribute('href', '/lecturas/nueva')
    expect(screen.queryByRole('link', { name: 'Control de matafuego' })).not.toBeInTheDocument()
    await userEvent.click(pestana(/^Fallas/))
    expect(await screen.findByText('No hay fallas abiertas.')).toBeInTheDocument()
  })

  it('conserva la explicación de vencimiento, faltante y control mensual (UIX-045)', async () => {
    const vencido = { estado: 'OK', revision: '2026-10-01', vencimiento: '2026-10-29', etiqueta_ilegible: false, control_del_mes: false, vencido: true, por_vencer: false }
    const faltante = { estado: 'FALTANTE', revision: '2026-11-01', vencimiento: null, etiqueta_ilegible: false, control_del_mes: true, vencido: false, por_vencer: false }
    const descargado = { ...vencido, estado: 'DESCARGADO', control_del_mes: true }
    mockFetch({ 'GET /maintenance/panel': { status: 200, body: { data: [unidad(1, 'HV-01', 'Prusia', { matafuego: vencido }), unidad(2, 'HV-02', 'Prusia', { matafuego: faltante }), unidad(3, 'HV-03', 'Prusia', { matafuego: descargado })] } }, 'GET /maintenance/failures': { status: 200, body: { data: [], meta: { ...meta, total: 0 } } } })
    renderConApp(<PanelPage />, { usuario: sesion(GERENCIA) })
    expect(await screen.findByText('Venció el 29/10/2026 · el equipo está en buen estado, falta recargarlo')).toBeInTheDocument()
    expect(screen.getByText('Venció el 29/10/2026 · además está descargado')).toBeInTheDocument()
    expect(screen.queryByText(/estado del matafuego/)).not.toBeInTheDocument()
    expect(screen.getByText(/Sin control este mes/)).toBeInTheDocument()
    expect(screen.getByText(/Falta el matafuego/)).toBeInTheDocument()
    await userEvent.click(pestana(/^Matafuegos 3/))
    expect(screen.getByText('3 de 3 unidades')).toBeInTheDocument()
  })

  it('UIX-029: lo urgente primero en la flota y en Matafuegos, con el desglose de pendientes', async () => {
    const vencido = { estado: 'OK', revision: '2026-11-01', vencimiento: '2026-10-01', etiqueta_ilegible: false, control_del_mes: true, vencido: true, por_vencer: false }
    const flota = [unidad(1, 'HV-01', 'Prusia'), unidad(2, 'SK-02', 'Bosques', { matafuego: null }), unidad(3, 'HV-03', 'Prusia', { matafuego: vencido })]
    mockFetch({ 'GET /maintenance/panel': { status: 200, body: { data: flota } }, 'GET /maintenance/failures': { status: 200, body: { data: [], meta: { ...meta, total: 0 } } } })
    renderConApp(<PanelPage />, { usuario: sesion(GERENCIA) })
    await screen.findByRole('link', { name: /HV-03/ })
    const orden = () => within(screen.getByRole('tabpanel')).getAllByRole('link', { name: /ver historial/i }).map((l) => l.textContent)
    expect(orden()).toEqual(['HV-03Ver historial ', 'SK-02Ver historial ', 'HV-01Ver historial '])
    await userEvent.click(pestana(/^Matafuegos 2/))
    expect(screen.getByText('1 con carga vencida o faltante · 1 sin control del mes')).toBeInTheDocument()
    expect(orden()).toEqual(['HV-03Ver historial ', 'SK-02Ver historial '])
  })
})
