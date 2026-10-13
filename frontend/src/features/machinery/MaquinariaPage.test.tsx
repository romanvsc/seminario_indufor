import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockFetch, renderConApp } from '@/test/render'
import { MaquinariaPage } from './MaquinariaPage'

afterEach(() => vi.unstubAllGlobals())

const meta = { current_page: 1, last_page: 1, per_page: 20, total: 1 }
const tipos = { status: 200, body: { data: [{ id: 2, nombre: 'Camión', metrica: 'KILOMETRAJE', estado_activo: true }], meta } }
const unidades = {
  status: 200,
  body: {
    data: [{
      id: 5, nombre: 'Camión 1', dominio_patente: 'AB123CD', marca_modelo: 'Scania R450', estado_activo: true,
      tipo: { id: 2, nombre: 'Camión', metrica: 'KILOMETRAJE' }, frente: { id: 3, nombre: 'Prusia' }, usuario: null,
    }],
    meta,
  },
}
const frentes = { status: 200, body: { data: [{ id: 3, nombre: 'Prusia', ubicacion: null, modalidad: 'INDIVIDUAL', estado_activo: true }], meta } }
const usuarios = { status: 200, body: { data: [], meta } }
const sesion = (permisos: string[]) => ({ id: 1, nombre: 'Admin', apellido: 'X', email: 'a@indufor.test', roles: [], permisos })

describe('MaquinariaPage', () => {
  it('lista unidades con tipo, métrica, frente y patente; sin gestión para quien solo consulta', async () => {
    mockFetch({ 'GET /machinery-types': tipos, 'GET /machinery': unidades })
    renderConApp(<MaquinariaPage />, { usuario: sesion(['machinery.view']) })
    expect(await screen.findByText('Camión 1')).toBeInTheDocument()
    expect(screen.getByText('Scania R450 · AB123CD')).toBeInTheDocument()
    expect(screen.getByText('Kilometraje')).toBeInTheDocument()
    expect(screen.getByText('Prusia')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Nueva unidad' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
  })

  it('al editar, el formulario muestra el tipo y frente actuales y envía ids numéricos', async () => {
    const llamadas = mockFetch({
      'GET /machinery-types': tipos, 'GET /machinery': unidades, 'GET /fronts': frentes, 'GET /users': usuarios,
      'PUT /machinery/5': { status: 200, body: { data: {} } },
    })
    renderConApp(<MaquinariaPage />, { usuario: sesion(['machinery.view', 'machinery.manage', 'users.view']) })
    await userEvent.click(await screen.findByRole('button', { name: 'Editar' }))
    const dialogo = await screen.findByRole('dialog')

    expect(await within(dialogo).findByLabelText('Tipo')).toHaveDisplayValue('Camión (Kilometraje)')
    expect(within(dialogo).getByLabelText('Frente actual (opcional)')).toHaveDisplayValue('Prusia')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Guardar' }))

    await vi.waitFor(() => expect(llamadas.find((l) => l.metodo === 'PUT')?.body).toEqual({
      nombre: 'Camión 1', dominio_patente: 'AB123CD', marca_modelo: 'Scania R450', id_tipo_maquinaria: 2, id_frente_actual: 3, id_usuario: null,
    }))
  })
})
