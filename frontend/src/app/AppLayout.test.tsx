import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { guardarBorrador, leerBorrador } from '@/shared/borrador'
import { mockFetch, renderConApp } from '@/test/render'
import { AppLayout } from './AppLayout'

beforeEach(() => localStorage.clear())
afterEach(() => vi.unstubAllGlobals())

const sesion = { id: 1, nombre: 'Ope', apellido: 'X', email: 'o@indufor.test', roles: [], permisos: [] }

describe('D23: salir con borradores sin enviar', () => {
  it('avisa cuántos hay; "Volver" no cierra la sesión', async () => {
    const llamadas = mockFetch({})
    guardarBorrador('parte', 1, { a: 1 })
    guardarBorrador('lectura', 1, { a: 1 })
    renderConApp(<AppLayout />, { usuario: sesion })
    await userEvent.click(screen.getByRole('button', { name: 'Salir' }))
    expect(await screen.findByText(/Tenés 2 borradores sin enviar en este equipo/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Volver' }))
    expect(llamadas.some((l) => l.url === '/auth/logout')).toBe(false)
    expect(leerBorrador('parte', 1)).not.toBeNull()
  })

  it('"Salir igual" cierra la sesión y borra los borradores', async () => {
    const llamadas = mockFetch({})
    guardarBorrador('viaje', 1, { a: 1 })
    renderConApp(<AppLayout />, { usuario: sesion })
    await userEvent.click(screen.getByRole('button', { name: 'Salir' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Salir igual' }))
    await vi.waitFor(() => expect(llamadas.some((l) => l.url === '/auth/logout')).toBe(true))
    await vi.waitFor(() => expect(leerBorrador('viaje', 1)).toBeNull())
  })

  it('sin borradores sale directo', async () => {
    const llamadas = mockFetch({})
    renderConApp(<AppLayout />, { usuario: sesion })
    await userEvent.click(screen.getByRole('button', { name: 'Salir' }))
    await vi.waitFor(() => expect(llamadas.some((l) => l.url === '/auth/logout')).toBe(true))
    expect(screen.queryByText(/borradores sin enviar/)).not.toBeInTheDocument()
  })
})
