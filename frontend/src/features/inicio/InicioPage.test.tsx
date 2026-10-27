import { screen } from '@testing-library/react'
import { guardarBorrador } from '@/shared/borrador'
import { mockFetch, renderConApp } from '@/test/render'
import { InicioPage } from './InicioPage'

beforeEach(() => localStorage.clear())
afterEach(() => vi.unstubAllGlobals())

const sesion = (permisos: string[]) => ({ id: 1, nombre: 'Olga', apellido: 'X', email: 'o@indufor.test', roles: [{ codigo: 'x', nombre: 'Rol' }], permisos })

describe('InicioPage (spec 07, D26)', () => {
  it('CA-07.1: el operario ve sus borradores sin enviar, sus accesos y lo que tiene pendiente', async () => {
    guardarBorrador('lectura', 1, { a: 1 })
    mockFetch({ 'GET /me/pending': { status: 200, body: { data: { unidades_sin_lectura_semana: 2 } } } })
    renderConApp(<InicioPage />, { usuario: sesion(['production.create', 'maintenance.reading.create', 'maintenance.extinguisher.create']) })

    expect(screen.getByRole('heading', { name: 'Hola, Olga' })).toBeInTheDocument()
    expect(screen.getByText(/Tenés 1 borrador sin enviar/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Seguir con: Lectura' })).toHaveAttribute('href', '/lecturas/nueva')
    const accesos = screen.getByRole('navigation', { name: 'Accesos rápidos' })
    expect(accesos).toHaveTextContent('Cargar parte')
    expect(accesos).not.toHaveTextContent('Declarar viaje')
    expect(await screen.findByRole('link', { name: /2 unidades sin lectura desde el lunes/ })).toHaveAttribute('href', '/lecturas/nueva')
  })

  it('CA-07.2: el camionero ve su viaje con corrección solicitada', async () => {
    mockFetch({ 'GET /me/pending': { status: 200, body: { data: { mis_viajes_pendientes: 0, mis_viajes_en_correccion: 1 } } } })
    renderConApp(<InicioPage />, { usuario: sesion(['logistics.trip.create']) })
    expect(await screen.findByRole('link', { name: /1 viaje tuyo con corrección solicitada/ })).toHaveAttribute('href', '/viajes?estado=CORRECCION_SOLICITADA')
  })

  it('CA-07.3: Administración ve los viajes que esperan remito, con el listado ya filtrado', async () => {
    mockFetch({ 'GET /me/pending': { status: 200, body: { data: {
      viajes_sin_remito: 2, correcciones_abiertas: 0, lecturas_sin_exportar: 0, consumos_periodo_vencido: { periodo: '2026-09', importado: false }, fallas_abiertas: 0, matafuegos_vencidos: 0,
    } } } })
    renderConApp(<InicioPage />, { usuario: sesion(['logistics.remito.create', 'integration.import-costs']) })
    expect(await screen.findByRole('link', { name: /2 viajes esperan remito/ })).toHaveAttribute('href', '/viajes?estado=PENDIENTE')
    expect(screen.getByRole('link', { name: /Falta importar el consolidado de consumos de 2026-09/ })).toBeInTheDocument()
    expect(screen.queryByText(/correcci/)).not.toBeInTheDocument()
  })

  it('sin pendientes lo dice; si la consulta falla, no bloquea los accesos', async () => {
    mockFetch({ 'GET /me/pending': { status: 200, body: { data: { unidades_sin_lectura_semana: 0 } } } })
    const { unmount } = renderConApp(<InicioPage />, { usuario: sesion(['production.create']) })
    expect(await screen.findByText('✓ No tenés nada pendiente.')).toBeInTheDocument()
    unmount()

    mockFetch({ 'GET /me/pending': { status: 0 } })
    renderConApp(<InicioPage />, { usuario: sesion(['production.create']) })
    expect(await screen.findByText(/No se pudieron consultar los pendientes/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Cargar parte' })).toBeInTheDocument()
  })
})
