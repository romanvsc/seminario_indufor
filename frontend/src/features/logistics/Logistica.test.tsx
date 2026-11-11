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
    const llamadas = mockFetch({
      'GET /logistics/trips': { status: 200, body: { data: [viaje()], meta } }, 'GET /users': camioneros,
      'GET /logistics/trucks': { status: 200, body: { data: [{ id: 9, nombre: 'Camión 1', dominio_patente: 'AB123CD' }] } },
    })
    renderConApp(<ViajesPage />, { usuario: sesion(['logistics.trip.view-all', 'users.view']) })
    await userEvent.type(await screen.findByLabelText('N.º de remito'), 'E2E-0002')
    await vi.waitFor(() => expect(llamadas.some((l) => l.url.includes('remito=E2E-0002'))).toBe(true))
    // UIX-001: las opciones salen de /logistics/trucks (unidades con viajes), no de toda la maquinaria
    await userEvent.click(screen.getByLabelText('Camión'))
    expect(await screen.findByRole('option', { name: 'Camión 1 · AB123CD' })).toBeInTheDocument()
    expect(llamadas.some((l) => l.url.includes('/machinery'))).toBe(false)
    await userEvent.click(screen.getByLabelText('Camionero'))
    await userEvent.click(await screen.findByRole('option', { name: 'Prueba, Carlos' }))
    await vi.waitFor(() => expect(llamadas.some((l) => l.url.includes('camionero=8') && l.url.includes('remito=E2E-0002'))).toBe(true))
  })

  it('UIX-001: la búsqueda por remito consulta una vez al dejar de tipear, no por cada tecla', async () => {
    const llamadas = mockFetch({ 'GET /logistics/trips': { status: 200, body: { data: [viaje()], meta } } })
    renderConApp(<ViajesPage />, { usuario: sesion(['logistics.trip.view-own']) })
    await userEvent.type(await screen.findByLabelText('N.º de remito'), 'A-0001')
    await vi.waitFor(() => expect(llamadas.some((l) => l.url.includes('remito=A-0001'))).toBe(true))
    expect(llamadas.filter((l) => l.url.includes('remito=')).map((l) => l.url)).toHaveLength(1)
  })

  it('UIX-001: titula la pestaña, rotula el celular y no pierde el foco al cerrar el diálogo', async () => {
    mockFetch({ 'GET /logistics/trips': { status: 200, body: { data: [viaje()], meta } }, 'GET /wood-types': tipos, 'GET /users': camioneros })
    renderConApp(<ViajesPage />, { usuario: sesion(['logistics.trip.view-all', 'logistics.remito.create']) })
    const boton = await screen.findByRole('button', { name: 'Cargar remito' })
    expect(document.title).toBe('Viajes — INDUFOR')
    expect(screen.getByText('30,00 t').closest('td')).toHaveAttribute('data-label', 'Declarado')
    expect(screen.getByText('Camión 1').closest('td')).toHaveAttribute('data-label', 'Camión / camionero')

    await userEvent.click(boton)
    const d = await screen.findByRole('dialog')
    expect(d).toHaveAccessibleDescription(/^19\/10\/2026 08:30 · Papel Misionero/)
    await userEvent.click(within(d).getByRole('button', { name: 'Cancelar' }))
    await vi.waitFor(() => expect(boton).toHaveFocus())
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

  const conLista = (extra: Record<string, { status: number; body?: unknown }> = {}, data: unknown[] = [solicitud]) =>
    mockFetch({ 'GET /logistics/corrections': { status: 200, body: { data, meta } }, 'GET /wood-types': tipos, 'GET /users': camioneros, ...extra })

  it('UIX-016: sin solicitudes muestra un estado vacío con enlace a los viajes pendientes de remito', async () => {
    conLista({}, [])
    renderConApp(<CorreccionesPage />, { usuario: sesion(['logistics.correction.manage']) })
    expect(await screen.findByRole('heading', { name: 'No hay solicitudes pendientes' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver viajes pendientes de remito' })).toHaveAttribute('href', '/viajes?estado=PENDIENTE')
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('UIX-016: destaca la diferencia, muestra antigüedad y responsable, y en PENDIENTE la acción principal es Tomar', async () => {
    conLista({}, [{ ...solicitud, estado: 'PENDIENTE' }, { ...solicitud, id: 12, responsable: { id: 1, nombre: 'A', apellido: 'X' } }])
    renderConApp(<CorreccionesPage />, { usuario: sesion(['logistics.correction.manage']) })
    const [pendiente, enRevision] = Array.from((await screen.findByRole('list', { name: 'Solicitudes abiertas' })).children) as HTMLElement[]
    expect(within(pendiente).getByText('1 diferencia con el remito')).toBeInTheDocument()
    expect(within(pendiente).getByText('30,00 t')).toBeInTheDocument()
    expect(within(pendiente).getByText('3,00 t')).toBeInTheDocument()
    expect(within(pendiente).getByText(/solicitada el 19\/10\/2026 09:00/)).toBeInTheDocument()
    expect(within(pendiente).getByText('Sin responsable')).toBeInTheDocument()
    // La siguiente acción según el estado; Corregir sigue disponible porque el backend lo permite en ambos
    expect(within(pendiente).getByRole('button', { name: 'Tomar' })).toHaveAccessibleDescription('Viaje #3 · Remito N.º A-0001')
    expect(within(pendiente).getByRole('button', { name: 'Corregir' })).toHaveAttribute('data-variant', 'outline')
    expect(within(enRevision).queryByRole('button', { name: 'Tomar' })).not.toBeInTheDocument()
    expect(within(enRevision).getByText('Vos')).toBeInTheDocument()
    expect(screen.getByText(`${meta.total} en total · las más antiguas primero`)).toBeInTheDocument()
  })

  it('exige motivo y algún cambio, marca lo modificado y envía solo el dato corregido para recotejar', async () => {
    const llamadas = conLista({
      'POST /logistics/corrections/11/resolve': { status: 200, body: { data: solicitud.viaje, cotejo: { coincide: true, diferencias: [] } } },
    })
    renderConApp(<CorreccionesPage />, { usuario: sesion(['logistics.correction.manage']) })
    await userEvent.click(await screen.findByRole('button', { name: 'Corregir' }))
    const d = await screen.findByRole('dialog')
    const toneladas = within(d).getByRole('group', { name: /Toneladas/ })
    expect(within(toneladas).getByText('Difiere')).toBeInTheDocument()

    await userEvent.click(within(d).getByRole('button', { name: 'Corregir y recotejar' }))
    expect(await within(d).findByText(/Explicá el motivo/)).toBeInTheDocument()
    expect(within(d).getByText(/Cambiá al menos un dato/)).toHaveAttribute('role', 'alert')
    expect(within(d).getByLabelText('Motivo de la corrección')).toHaveAttribute('aria-invalid', 'true')
    expect(llamadas.some((l) => l.metodo === 'POST')).toBe(false)

    await userEvent.clear(within(d).getByLabelText('Toneladas del remito'))
    await userEvent.type(within(d).getByLabelText('Toneladas del remito'), '30')
    expect(within(toneladas).getByText('Coincide')).toBeInTheDocument()
    expect(within(toneladas).getByText('Modificado')).toBeInTheDocument()
    expect(within(toneladas).getByText('Antes: 3,00 t')).toBeInTheDocument()
    await userEvent.type(within(d).getByLabelText('Motivo de la corrección'), 'Error de tipeo')
    await userEvent.click(within(d).getByRole('button', { name: 'Corregir y recotejar' }))

    await vi.waitFor(() => expect(llamadas.find((l) => l.metodo === 'POST')?.body).toEqual({
      motivo: 'Error de tipeo', viaje: {}, remito: { volumen_toneladas_remito: '30' },
    }))
    // El resultado queda en el diálogo y el foco va a su título
    const titulo = await within(d).findByRole('heading', { name: 'Diferencias resueltas' })
    await vi.waitFor(() => expect(titulo).toHaveFocus())
    expect(within(d).getByText(/quedó validado/)).toBeInTheDocument()
  })

  it('UIX-016: si el recotejo no coincide, muestra las diferencias que quedan y la nueva solicitud', async () => {
    const quedan = 'Tipo de madera: declarado pulpable, remito aserrable.'
    conLista({ 'POST /logistics/corrections/11/resolve': { status: 200, body: { data: solicitud.viaje, cotejo: { coincide: false, diferencias: [quedan] } } } })
    renderConApp(<main><CorreccionesPage /></main>, { usuario: sesion(['logistics.correction.manage']) })
    await userEvent.click(await screen.findByRole('button', { name: 'Corregir' }))
    const d = await screen.findByRole('dialog')
    await userEvent.clear(within(d).getByLabelText('Toneladas del remito'))
    await userEvent.type(within(d).getByLabelText('Toneladas del remito'), '30')
    await userEvent.type(within(d).getByLabelText('Motivo de la corrección'), 'Error de tipeo')
    await userEvent.click(within(d).getByRole('button', { name: 'Corregir y recotejar' }))

    expect(await within(d).findByRole('heading', { name: 'Siguen diferencias' })).toBeInTheDocument()
    expect(within(d).getByText(quedan)).toBeInTheDocument()
    expect(within(d).getByText(/Se abrió una nueva solicitud/)).toBeInTheDocument()
    expect(within(d).queryByRole('button', { name: 'Corregir y recotejar' })).not.toBeInTheDocument()
    // La solicitud resuelta sale de la bandeja: el foco va al título de la vista
    await userEvent.click(within(d).getByRole('button', { name: 'Cerrar' }))
    await vi.waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveFocus())
  })

  it('UIX-016: al cancelar, el foco vuelve al botón Corregir', async () => {
    conLista()
    renderConApp(<main><CorreccionesPage /></main>, { usuario: sesion(['logistics.correction.manage']) })
    const boton = await screen.findByRole('button', { name: 'Corregir' })
    await userEvent.click(boton)
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancelar' }))
    await vi.waitFor(() => expect(boton).toHaveFocus())
  })

  it('UIX-016: un error del servidor se muestra en su campo', async () => {
    conLista({ 'POST /logistics/corrections/11/resolve': { status: 422, body: { error: { code: 'VALIDATION', message: 'Datos inválidos', details: { 'remito.volumen_toneladas_remito': ['Debe ser mayor a 0.'] } } } } })
    renderConApp(<CorreccionesPage />, { usuario: sesion(['logistics.correction.manage']) })
    await userEvent.click(await screen.findByRole('button', { name: 'Corregir' }))
    const d = await screen.findByRole('dialog')
    await userEvent.clear(within(d).getByLabelText('Toneladas del remito'))
    await userEvent.type(within(d).getByLabelText('Toneladas del remito'), '0')
    await userEvent.type(within(d).getByLabelText('Motivo de la corrección'), 'Error de tipeo')
    await userEvent.click(within(d).getByRole('button', { name: 'Corregir y recotejar' }))
    expect(await within(d).findByText('Debe ser mayor a 0.')).toBeInTheDocument()
    expect(within(d).getByLabelText('Toneladas del remito')).toHaveAccessibleDescription('Debe ser mayor a 0.')
  })

  it('CA-08.3: las solicitudes de la segunda página se pueden ver', async () => {
    const pagina = (n: number, id: number) => ({ status: 200, body: { data: [{ ...solicitud, id, viaje: { ...solicitud.viaje, id: n * 100 } }], meta: { current_page: n, last_page: 2, per_page: 50, total: 51 } } })
    const llamadas = mockFetch({ 'GET /logistics/corrections?page=2': pagina(2, 12), 'GET /logistics/corrections?page=1': pagina(1, 11) })
    renderConApp(<CorreccionesPage />, { usuario: sesion(['logistics.correction.manage']) })
    expect(await screen.findByRole('heading', { name: /^Viaje #100/ })).toBeInTheDocument()
    expect(screen.getByText(/Página 1 de 2 · 51 en total/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(await screen.findByRole('heading', { name: /^Viaje #200/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
    expect(llamadas.some((l) => l.url === '/logistics/corrections?page=2')).toBe(true)
  })
})
