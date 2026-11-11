import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockFetch, renderConApp } from '@/test/render'
import { LecturaNuevaPage } from './LecturaNuevaPage'

beforeEach(() => localStorage.clear())
afterEach(() => vi.unstubAllGlobals())

const meta = { current_page: 1, last_page: 1, per_page: 100, total: 1 }
const sesion = { id: 1, nombre: 'Ope', apellido: 'X', email: 'o@indufor.test', roles: [], permisos: ['maintenance.reading.create'] }
const unidades = { status: 200, body: { data: [{ id: 9, nombre: 'HV-01', frente: null, tipo: { id: 1, nombre: 'Harvester', metrica: 'HOROMETRO' } }], meta } }
const ultima = { status: 200, body: { data: { metrica: 'HOROMETRO', anterior: { valor: '1250.00', fecha: '13/10/2026 08:00' }, posterior: null } } }

describe('LecturaNuevaPage (RNF05 en el formulario)', () => {
  it('muestra la lectura anterior y bloquea una menor antes de enviar', async () => {
    const llamadas = mockFetch({ 'GET /machinery': unidades, 'GET /maintenance/units/9/last-reading': ultima })
    renderConApp(<LecturaNuevaPage />, { usuario: sesion })
    await userEvent.selectOptions(await screen.findByLabelText('Unidad'), '9')
    expect(await screen.findByText('1250.00 h')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Horómetro (horas)'), '1205')
    expect(await screen.findByText(/Es menor que la lectura anterior \(1250.00 h/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enviar lectura' })).toBeDisabled()
    expect(llamadas.some((l) => l.metodo === 'POST')).toBe(false)
  })

  it('envía el horómetro con la falla y su detalle', async () => {
    const llamadas = mockFetch({
      'GET /machinery': unidades, 'GET /maintenance/units/9/last-reading': ultima,
      'POST /maintenance/readings': { status: 201, body: { data: { id: 1 } } },
    })
    renderConApp(<LecturaNuevaPage />, { usuario: sesion })
    await userEvent.selectOptions(await screen.findByLabelText('Unidad'), '9')
    await userEvent.type(await screen.findByLabelText('Horómetro (horas)'), '1260,5')
    await userEvent.click(screen.getByLabelText('Hay una falla en el instrumento o la máquina'))
    await userEvent.click(screen.getByRole('button', { name: 'Enviar lectura' }))
    expect(await screen.findByText('Describí la falla para que Mantenimiento pueda atenderla.')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('¿Qué falla?'), 'Pierde aceite')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar lectura' }))
    await vi.waitFor(() => expect(llamadas.find((l) => l.metodo === 'POST')?.body).toMatchObject({
      id_unidad: 9, horometro_actual: '1260.5', kilometraje_actual: null, tiene_falla: true, detalle_falla: 'Pierde aceite',
    }))
  })

  it('specs/02: la consulta de referencias lleva la fecha ingresada', async () => {
    const llamadas = mockFetch({ 'GET /machinery': unidades, 'GET /maintenance/units/9/last-reading': ultima })
    renderConApp(<LecturaNuevaPage />, { usuario: sesion })
    await userEvent.selectOptions(await screen.findByLabelText('Unidad'), '9')
    await screen.findByText('1250.00 h')
    const fecha = screen.getByLabelText('Fecha y hora de la lectura')
    await userEvent.clear(fecha)
    await userEvent.type(fecha, '2026-10-20T08:00')
    await vi.waitFor(() => expect(llamadas.some((l) => l.url.includes('last-reading?fecha=2026-10-20T08%3A00'))).toBe(true))
  })

  it('specs/02: si falla la consulta de referencias se puede cargar igual y se avisa que valida el sistema', async () => {
    mockFetch({ 'GET /machinery': unidades, 'GET /maintenance/units/9/last-reading': { status: 500, body: { error: { code: 'ERROR_INTERNO', message: 'x' } } } })
    renderConApp(<LecturaNuevaPage />, { usuario: sesion })
    await userEvent.selectOptions(await screen.findByLabelText('Unidad'), '9')
    expect(await screen.findByText(/No se pudo verificar contra las lecturas anteriores/)).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Horómetro (horas)'), '1')
    expect(screen.getByRole('button', { name: 'Enviar lectura' })).toBeEnabled()
  })

  it('D28: ofrece solo las unidades de su frente en esa fecha y las que tiene a cargo', async () => {
    const tipo = { id: 1, nombre: 'Harvester', metrica: 'HOROMETRO' }
    const flota = { status: 200, body: { meta, data: [
      { id: 9, nombre: 'HV-01', frente: { id: 2, nombre: 'Prusia' }, usuario: null, tipo },
      { id: 10, nombre: 'HV-02', frente: { id: 3, nombre: 'Papel Misionero' }, usuario: null, tipo },
      { id: 11, nombre: 'CT-01', frente: null, usuario: { id: 1, nombre: 'Ope', apellido: 'X' }, tipo },
    ] } }
    const asignaciones = { status: 200, body: { meta, data: [{ id: 1, frente: { id: 2, nombre: 'Prusia' }, usuario: { id: 1 }, fecha_desde: '2026-10-01', fecha_hasta: null }] } }
    const llamadas = mockFetch({ 'GET /machinery': flota, 'GET /front-assignments': asignaciones })
    renderConApp(<LecturaNuevaPage />, { usuario: sesion })
    expect(await screen.findByRole('option', { name: /HV-01/ })).toBeInTheDocument()
    await vi.waitFor(() => expect(screen.queryByRole('option', { name: /HV-02/ })).not.toBeInTheDocument())
    expect(screen.getByRole('option', { name: /CT-01/ })).toBeInTheDocument()
    expect(llamadas.some((l) => /front-assignments\?usuario=1&fecha=\d{4}-\d{2}-\d{2}/.test(l.url))).toBe(true)
  })

  it('D28: si el backend rechaza por SIN_ASIGNACION, el motivo queda junto a la unidad', async () => {
    const mensaje = 'No estabas asignado al frente de esta unidad en esa fecha ni sos su responsable.'
    mockFetch({
      'GET /machinery': unidades, 'GET /maintenance/units/9/last-reading': ultima,
      'POST /maintenance/readings': { status: 422, body: { error: { code: 'SIN_ASIGNACION', message: mensaje, details: { id_unidad: [mensaje] } } } },
    })
    renderConApp(<LecturaNuevaPage />, { usuario: sesion })
    await userEvent.selectOptions(await screen.findByLabelText('Unidad'), '9')
    await userEvent.type(await screen.findByLabelText('Horómetro (horas)'), '1300')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar lectura' }))
    expect(await screen.findByLabelText('Unidad')).toHaveAccessibleDescription(new RegExp(mensaje))
  })
})
