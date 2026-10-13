import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockFetch, renderConApp } from '@/test/render'
import { FrentesPage } from './FrentesPage'

afterEach(() => vi.unstubAllGlobals())

const meta = { current_page: 1, last_page: 1, per_page: 100, total: 1 }
const frentes = { status: 200, body: { data: [{ id: 3, nombre: 'Prusia', ubicacion: null, modalidad: 'INDIVIDUAL', estado_activo: true }], meta } }
const asignaciones = {
  status: 200,
  body: { data: [{ id: 9, frente: { id: 3, nombre: 'Prusia' }, usuario: { id: 7, nombre: 'Juan', apellido: 'Pérez' }, fecha_desde: '2026-10-01', fecha_hasta: null }], meta },
}
const usuarios = { status: 200, body: { data: [{ id: 8, nombre: 'Ana', apellido: 'Gómez', roles: [] }], meta } }
const sesion = (permisos: string[]) => ({ id: 1, nombre: 'Admin', apellido: 'X', email: 'a@indufor.test', roles: [], permisos })

describe('FrentesPage', () => {
  it('lista frentes con modalidad y estado en texto, sin acciones de gestión para quien solo consulta', async () => {
    mockFetch({ 'GET /fronts': frentes })
    renderConApp(<FrentesPage />, { usuario: sesion(['fronts.view']) })
    expect(await screen.findByText('Prusia')).toBeInTheDocument()
    expect(screen.getByText('Individual')).toBeInTheDocument()
    expect(screen.getByText('● Activo')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Nuevo frente' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Deshabilitar' })).not.toBeInTheDocument()
  })

  it('con fronts.manage muestra alta, edición y baja', async () => {
    mockFetch({ 'GET /fronts': frentes })
    renderConApp(<FrentesPage />, { usuario: sesion(['fronts.view', 'fronts.manage']) })
    await screen.findByText('Prusia')
    expect(screen.getByRole('button', { name: 'Nuevo frente' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Deshabilitar' })).toBeInTheDocument()
  })

  it('muestra el historial de asignaciones; quien solo consulta no puede asignar', async () => {
    mockFetch({ 'GET /fronts': frentes, 'GET /front-assignments': asignaciones })
    renderConApp(<FrentesPage />, { usuario: sesion(['fronts.view']) })
    await userEvent.click(await screen.findByRole('button', { name: 'Asignaciones' }))
    const dialogo = await screen.findByRole('dialog')
    expect(await within(dialogo).findByText('Pérez, Juan')).toBeInTheDocument()
    expect(within(dialogo).getByText('● Sin fecha de fin')).toBeInTheDocument()
    expect(within(dialogo).queryByRole('button', { name: 'Asignar' })).not.toBeInTheDocument()
    expect(within(dialogo).queryByRole('button', { name: 'Finalizar' })).not.toBeInTheDocument()
  })

  it('asignar exige usuario y envía frente, usuario y fechas al backend', async () => {
    const llamadas = mockFetch({
      'GET /fronts': frentes,
      'GET /front-assignments': asignaciones,
      'GET /users': usuarios,
      'POST /front-assignments': { status: 201, body: { data: {} } },
    })
    renderConApp(<FrentesPage />, { usuario: sesion(['fronts.view', 'fronts.assign-users']) })
    await userEvent.click(await screen.findByRole('button', { name: 'Asignaciones' }))
    const dialogo = await screen.findByRole('dialog')

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Asignar' }))
    expect(await within(dialogo).findByText('Elegí un usuario.')).toBeInTheDocument()
    expect(llamadas.some((l) => l.metodo === 'POST')).toBe(false)

    await within(dialogo).findByRole('option', { name: 'Gómez, Ana' })
    await userEvent.selectOptions(within(dialogo).getByLabelText('Usuario'), '8')
    await userEvent.clear(within(dialogo).getByLabelText('Desde'))
    await userEvent.type(within(dialogo).getByLabelText('Desde'), '2026-10-13')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Asignar' }))

    await vi.waitFor(() => expect(llamadas.find((l) => l.metodo === 'POST')?.body).toEqual({ id_frente: 3, id_usuario: 8, fecha_desde: '2026-10-13', fecha_hasta: null }))
  })
})
