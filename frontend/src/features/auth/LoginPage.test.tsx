import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { mockFetch, renderConApp } from '@/test/render'
import { LoginPage } from './LoginPage'

afterEach(() => vi.unstubAllGlobals())

const app = (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/" element={<p>Inicio</p>} />
  </Routes>
)

describe('LoginPage', () => {
  it('valida antes de enviar y no llama al backend', async () => {
    const llamadas = mockFetch({})
    renderConApp(app, { ruta: '/login' })
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(await screen.findByText('Ingresá tu email.')).toBeInTheDocument()
    expect(screen.getByText('Ingresá tu contraseña.')).toBeInTheDocument()
    expect(llamadas).toHaveLength(0)
  })

  it('muestra el mensaje del backend cuando las credenciales son inválidas', async () => {
    mockFetch({ 'POST /auth/login': { status: 422, body: { error: { code: 'CREDENCIALES_INVALIDAS', message: 'El email o la contraseña no son correctos.' } } } })
    renderConApp(app, { ruta: '/login' })
    await userEvent.type(screen.getByLabelText('Email'), 'ana@indufor.test')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'mala')
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('El email o la contraseña no son correctos.')
  })

  it('con login correcto entra al inicio', async () => {
    mockFetch({ 'POST /auth/login': { status: 200, body: { data: { id: 1, nombre: 'Ana', apellido: 'G', email: 'ana@indufor.test', roles: [], permisos: [] } } } })
    renderConApp(app, { ruta: '/login' })
    await userEvent.type(screen.getByLabelText('Email'), 'ana@indufor.test')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'segura123')
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(await screen.findByText('Inicio')).toBeInTheDocument()
  })
})
