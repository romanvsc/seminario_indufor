import { screen } from '@testing-library/react'
import { mockFetch, renderConApp } from '@/test/render'
import { UsuariosPage } from './UsuariosPage'

afterEach(() => vi.unstubAllGlobals())

const lista = {
  status: 200,
  body: {
    data: [{ id: 7, nombre: 'Juan', apellido: 'Pérez', email: 'juan@indufor.test', telefono_whatsapp: null, estado_activo: true, ultimo_acceso_at: null, roles: [{ codigo: 'camionero', nombre: 'Camionero' }] }],
    meta: { current_page: 1, last_page: 1, per_page: 20, total: 1 },
  },
}
const sesion = (permisos: string[]) => ({ id: 1, nombre: 'Admin', apellido: 'X', email: 'a@indufor.test', roles: [], permisos })

describe('UsuariosPage', () => {
  it('lista usuarios con su rol y estado en texto (no solo color)', async () => {
    mockFetch({ 'GET /users': lista })
    renderConApp(<UsuariosPage />, { usuario: sesion(['users.view']) })
    expect(await screen.findByText('Pérez, Juan')).toBeInTheDocument()
    expect(screen.getByText('Camionero')).toBeInTheDocument()
    expect(screen.getByText('● Activo')).toBeInTheDocument()
  })

  it('oculta las acciones que el usuario no tiene permitidas', async () => {
    mockFetch({ 'GET /users': lista })
    renderConApp(<UsuariosPage />, { usuario: sesion(['users.view']) })
    await screen.findByText('Pérez, Juan')
    expect(screen.queryByRole('button', { name: 'Nuevo usuario' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Deshabilitar' })).not.toBeInTheDocument()
  })

  it('con permisos de gestión muestra alta, edición y baja', async () => {
    mockFetch({ 'GET /users': lista })
    renderConApp(<UsuariosPage />, { usuario: sesion(['users.view', 'users.create', 'users.update', 'users.disable']) })
    await screen.findByText('Pérez, Juan')
    expect(screen.getByRole('button', { name: 'Nuevo usuario' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Deshabilitar' })).toBeInTheDocument()
  })
})
