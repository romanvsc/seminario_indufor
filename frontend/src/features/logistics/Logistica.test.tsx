import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockFetch, renderConApp } from '@/test/render'
import { CorreccionesPage } from './CorreccionesPage'
import { ViajesPage } from './ViajesPage'

afterEach(() => vi.unstubAllGlobals())

const meta = { current_page: 1, last_page: 1, per_page: 20, total: 1 }
const persona = (id: number, nombre: string) => ({ id, nombre, apellido: 'Prueba' })
const viaje = (extra = {}) => ({
  id: 3, fecha: '2026-10-19 08:30', estado: 'PENDIENTE', origen: { id: 1, nombre: 'Papel Misionero' }, destino: 'Planta',
  camion: { id: 9, nombre: 'Camión 1', dominio_patente: null }, camionero: persona(7, 'Camila'), tipo_madera: { id: 1, nombre: 'pulpable' },
  volumen_declarado: '30.00', observaciones: null, remito: null, solicitud_abierta: null, ...extra,
})
const tipos = { status: 200, body: { data: [{ id: 2, nombre: 'aserrable' }, { id: 1, nombre: 'pulpable' }] } }
const camioneros = { status: 200, body: { data: [persona(7, 'Camila'), persona(8, 'Carlos')], meta } }
const sesion = (permisos: string[]) => ({ id: 1, nombre: 'A', apellido: 'X', email: 'a@indufor.test', roles: [], permisos })

describe('ViajesPage', () => {
  it('CA-08.5: busca por remito y el filtro viaja al backend; camión y camionero solo para quien ve todo', async () => {
    const llamadas = mockFetch({ 'GET /logistics/trips': { status: 200, body: { data: [viaje()], meta } }, 'GET /machinery': { status: 200, body: { data: [], meta } }, 'GET /users': camioneros })
    renderConApp(<ViajesPage />, { usuario: sesion(['logistics.trip.view-all', 'users.view']) })
    await userEvent.type(await screen.findByLabelText('N.º de remito'), 'E2E-0002')
    await vi.waitFor(() => expect(llamadas.some((l) => l.url.includes('remito=E2E-0002'))).toBe(true))
    expect(screen.getByLabelText('Camión')).toBeInTheDocument()
    await userEvent.selectOptions(screen.getByLabelText('Camionero'), await screen.findByRole('option', { name: 'Prueba, Carlos' }))
    await vi.waitFor(() => expect(llamadas.some((l) => l.url.includes('camionero=8') && l.url.includes('remito=E2E-0002'))).toBe(true))
  })

  it('CA-08.6: el camionero solo busca por remito entre los suyos (sin filtros de camión ni camionero)', async () => {
    mockFetch({ 'GET /logistics/trips': { status: 200, body: { data: [viaje()], meta } } })
    renderConApp(<ViajesPage />, { usuario: sesion(['logistics.trip.view-own']) })
    expect(await screen.findByLabelText('N.º de remito')).toBeInTheDocument()
    expect(screen.queryByLabelText('Camión')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Camionero')).not.toBeInTheDocument()
  })

  it('el camionero ve el estado en texto y no puede cargar remitos', async () => {
    mockFetch({ 'GET /logistics/trips': { status: 200, body: { data: [viaje()], meta } } })
    renderConApp(<ViajesPage />, { usuario: sesion(['logistics.trip.view-own', 'logistics.trip.create']) })
    expect(await screen.findByText('○ Pendiente de remito')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Declarar viaje' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cargar remito' })).not.toBeInTheDocument()
  })

  it('Administración carga el remito sin datos precargados del viaje y recibe el resultado del cotejo', async () => {
    const llamadas = mockFetch({
      'GET /logistics/trips': { status: 200, body: { data: [viaje()], meta } }, 'GET /wood-types': tipos, 'GET /users': camioneros,
      'POST /logistics/remitos': { status: 201, body: { data: viaje({ estado: 'VALIDADO' }), cotejo: { coincide: true, diferencias: [] } } },
    })
    renderConApp(<ViajesPage />, { usuario: sesion(['logistics.trip.view-all', 'logistics.remito.create']) })
    await userEvent.click(await screen.findByRole('button', { name: 'Cargar remito' }))
    const d = await screen.findByRole('dialog')
    // D05: nada se copia de la declaración; si no, el cotejo nunca detectaría diferencias
    expect(within(d).getByLabelText('Toneladas')).toHaveValue('')
    expect(within(d).getByLabelText('Transportista según el remito')).toHaveValue('')

    await userEvent.type(within(d).getByLabelText('Número de remito'), 'A-0001')
    await within(d).findByRole('option', { name: 'Prueba, Carlos' })
    await userEvent.selectOptions(within(d).getByLabelText('Transportista según el remito'), '8')
    await userEvent.selectOptions(within(d).getByLabelText('Tipo de madera'), '1')
    await userEvent.type(within(d).getByLabelText('Toneladas'), '30,5')
    await userEvent.click(within(d).getByRole('button', { name: 'Cargar y cotejar' }))

    await vi.waitFor(() => expect(llamadas.find((l) => l.metodo === 'POST')?.body).toMatchObject({
      numero_remito: 'A-0001', id_viaje: 3, id_transportista: 8, tipo_madera_remito: 1, volumen_toneladas_remito: '30.5',
    }))
  })
})

describe('CorreccionesPage', () => {
  const solicitud = {
    id: 11, estado: 'EN_REVISION', fecha_solicitud: '2026-10-19 09:00', detalle: 'Volumen: declarado 30.00 t, remito 3.00 t.', responsable: null,
    viaje: viaje({
      estado: 'CORRECCION_SOLICITADA',
      remito: { numero: 'A-0001', fecha: '2026-10-19', transportista: persona(7, 'Camila'), tipo_madera: { id: 1, nombre: 'pulpable' }, volumen_toneladas: '3.00' },
    }),
  }

  it('exige motivo y envía solo el dato corregido para recotejar', async () => {
    const llamadas = mockFetch({
      'GET /logistics/corrections': { status: 200, body: { data: [solicitud], meta } }, 'GET /wood-types': tipos, 'GET /users': camioneros,
      'POST /logistics/corrections/11/resolve': { status: 200, body: { data: solicitud.viaje, cotejo: { coincide: true, diferencias: [] } } },
    })
    renderConApp(<CorreccionesPage />, { usuario: sesion(['logistics.correction.manage']) })
    expect(await screen.findByText('Volumen: declarado 30.00 t, remito 3.00 t.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Corregir' }))
    const d = await screen.findByRole('dialog')

    await userEvent.click(within(d).getByRole('button', { name: 'Corregir y recotejar' }))
    expect(await within(d).findByText(/Explicá el motivo/)).toBeInTheDocument()
    expect(llamadas.some((l) => l.metodo === 'POST')).toBe(false)

    await userEvent.clear(within(d).getByLabelText('Toneladas del remito'))
    await userEvent.type(within(d).getByLabelText('Toneladas del remito'), '30')
    await userEvent.type(within(d).getByLabelText('Motivo de la corrección'), 'Error de tipeo')
    await userEvent.click(within(d).getByRole('button', { name: 'Corregir y recotejar' }))

    await vi.waitFor(() => expect(llamadas.find((l) => l.metodo === 'POST')?.body).toEqual({
      motivo: 'Error de tipeo', viaje: {}, remito: { volumen_toneladas_remito: '30' },
    }))
  })

  it('CA-08.3: las solicitudes de la segunda página se pueden ver', async () => {
    const pagina = (n: number, id: number) => ({ status: 200, body: { data: [{ ...solicitud, id, detalle: `Solicitud de la página ${n}` }], meta: { current_page: n, last_page: 2, per_page: 50, total: 51 } } })
    const llamadas = mockFetch({ 'GET /logistics/corrections?page=2': pagina(2, 12), 'GET /logistics/corrections?page=1': pagina(1, 11) })
    renderConApp(<CorreccionesPage />, { usuario: sesion(['logistics.correction.manage']) })
    expect(await screen.findByText('Solicitud de la página 1')).toBeInTheDocument()
    expect(screen.getByText(/Página 1 de 2 · 51 en total/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(await screen.findByText('Solicitud de la página 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
    expect(llamadas.some((l) => l.url === '/logistics/corrections?page=2')).toBe(true)
  })
})
