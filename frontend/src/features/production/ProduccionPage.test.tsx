import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockFetch, renderConApp } from '@/test/render'
import { ProduccionPage } from './ProduccionPage'

afterEach(() => vi.unstubAllGlobals())

const meta = { current_page: 1, last_page: 1, per_page: 20, total: 2 }
const persona = (id: number, nombre: string) => ({ id, nombre, apellido: 'X' })
const parte = (id: number, autor: number) => ({
  id, fecha_registro: '2026-10-14', frente: { id: 1, nombre: 'Papel Misionero', modalidad: 'CONSOLIDADA' }, unidad: { id: 9, nombre: 'HV-01' },
  tipo_madera: { id: 1, nombre: 'pulpable' }, cantidad_toneladas: '32.50', metros_cubicos: null, registrado_por: persona(autor, autor === 1 ? 'Enc' : 'Otro'),
  operario: null, tiene_foto: true, observaciones: null,
})
const sesion = { id: 1, nombre: 'Enc', apellido: 'X', email: 'e@indufor.test', roles: [], permisos: ['production.view', 'production.create', 'production.update-own'] }
const backend = (extra = {}) => mockFetch({
  'GET /production': { status: 200, body: { data: [parte(5, 1), parte(6, 2)], meta } },
  'GET /fronts': { status: 200, body: { data: [{ id: 1, nombre: 'Papel Misionero', ubicacion: null, modalidad: 'CONSOLIDADA', estado_activo: true }], meta } },
  'GET /front-assignments': { status: 200, body: { data: [{ id: 4, frente: { id: 1, nombre: 'Papel Misionero' }, usuario: persona(1, 'Enc'), fecha_desde: '2026-10-01', fecha_hasta: null }], meta } },
  'GET /machinery': { status: 200, body: { data: [{ id: 9, nombre: 'HV-01', frente: { id: 1, nombre: 'Papel Misionero' }, tipo: { id: 1, nombre: 'Harvester', metrica: 'HOROMETRO' } }], meta } },
  'GET /wood-types': { status: 200, body: { data: [{ id: 1, nombre: 'pulpable' }, { id: 2, nombre: 'aserrable' }] } },
  ...extra,
})

async function abrirCorreccion() {
  await userEvent.click(await screen.findByRole('button', { name: /Corregir el parte del 14\/10\/2026/ }))
  const dialogo = await screen.findByRole('dialog')
  await within(dialogo).findByLabelText('Toneladas')
  return dialogo
}

describe('ProduccionPage: corrección de partes (spec 03)', () => {
  it('CA-03.2: "Corregir" aparece solo en los partes propios', async () => {
    backend()
    renderConApp(<ProduccionPage />, { usuario: sesion })
    expect(await screen.findAllByRole('button', { name: /Corregir el parte/ })).toHaveLength(1)
  })

  it('CA-03.1: manda solo lo que cambió, con el motivo (D25)', async () => {
    const llamadas = backend({ 'PUT /production/5': { status: 200, body: { data: parte(5, 1) } } })
    renderConApp(<ProduccionPage />, { usuario: sesion })
    const dialogo = await abrirCorreccion()

    const toneladas = within(dialogo).getByLabelText('Toneladas')
    await userEvent.clear(toneladas)
    await userEvent.type(toneladas, '30,00')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Guardar corrección' }))
    expect(await within(dialogo).findByText(/Contá en pocas palabras por qué corregís/)).toBeInTheDocument()
    expect(llamadas.some((l) => l.metodo === 'PUT')).toBe(false)

    await userEvent.type(within(dialogo).getByLabelText('Motivo de la corrección'), 'Toneladas mal transcriptas')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Guardar corrección' }))
    await vi.waitFor(() => expect(llamadas.find((l) => l.metodo === 'PUT')?.body).toEqual({ cantidad_toneladas: '30.00', motivo: 'Toneladas mal transcriptas' }))
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('CA-03.4: sin cambios no manda nada y lo dice', async () => {
    const llamadas = backend()
    renderConApp(<ProduccionPage />, { usuario: sesion })
    const dialogo = await abrirCorreccion()
    await userEvent.type(within(dialogo).getByLabelText('Motivo de la corrección'), 'Revisión sin cambios')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Guardar corrección' }))
    expect(await within(dialogo).findByText('No hay cambios para guardar.')).toBeInTheDocument()
    expect(llamadas.some((l) => l.metodo === 'PUT')).toBe(false)
  })

  it('CA-03.3: el rechazo del backend queda junto al campo y lo editado se conserva', async () => {
    const mensaje = 'No estabas asignado a este frente en la fecha del parte.'
    backend({ 'PUT /production/5': { status: 422, body: { error: { code: 'SIN_ASIGNACION', message: mensaje, details: { id_frente: [mensaje] } } } } })
    renderConApp(<ProduccionPage />, { usuario: sesion })
    const dialogo = await abrirCorreccion()
    const jornada = within(dialogo).getByLabelText('Jornada')
    await userEvent.clear(jornada)
    await userEvent.type(jornada, '2026-09-20')
    await userEvent.type(within(dialogo).getByLabelText('Motivo de la corrección'), 'La jornada era otra')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Guardar corrección' }))

    expect(await within(dialogo).findByLabelText('Frente')).toHaveAccessibleDescription(mensaje)
    expect(within(dialogo).getByLabelText('Jornada')).toHaveValue('2026-09-20')
    expect(within(dialogo).getByLabelText('Motivo de la corrección')).toHaveValue('La jornada era otra')
  })
})

describe('ProduccionPage: filtros RF16 en la URL (spec 08)', () => {
  const gerencia = { ...sesion, permisos: ['production.view-all', 'users.view'] }
  const operarios = { status: 200, body: { data: [persona(4, 'Olga')], meta: { ...meta, total: 1 } } }

  it('CA-08.4: filtra por máquina y operario, y los filtros quedan en la URL', async () => {
    const llamadas = backend({ 'GET /users': operarios })
    renderConApp(<ProduccionPage />, { usuario: gerencia })
    await userEvent.selectOptions(await screen.findByLabelText('Máquina'), await screen.findByRole('option', { name: 'HV-01' }))
    await userEvent.selectOptions(screen.getByLabelText('Operario'), await screen.findByRole('option', { name: 'X, Olga' }))
    await vi.waitFor(() => expect(llamadas.some((l) => l.url.startsWith('/production?') && l.url.includes('unidad=9') && l.url.includes('operario=4'))).toBe(true))
  })

  it('CA-08.4: al volver con los filtros en la URL, se aplican', async () => {
    const llamadas = backend({ 'GET /users': operarios })
    renderConApp(<ProduccionPage />, { usuario: gerencia, ruta: '/produccion?unidad=9&desde=2026-10-01' })
    await vi.waitFor(() => expect(llamadas.some((l) => l.url.startsWith('/production?') && l.url.includes('unidad=9') && l.url.includes('desde=2026-10-01'))).toBe(true))
    expect(await screen.findByLabelText('Desde')).toHaveValue('2026-10-01')
  })

  it('sin users.view no se ofrece el filtro por operario', async () => {
    backend()
    renderConApp(<ProduccionPage />, { usuario: sesion })
    expect(await screen.findByLabelText('Máquina')).toBeInTheDocument()
    expect(screen.queryByLabelText('Operario')).not.toBeInTheDocument()
  })
})
