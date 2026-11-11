import { screen, within } from '@testing-library/react'
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

describe('Auditoría 2026-10-27: salir solo con confirmación del servidor', () => {
  it('sin señal no se finge la salida: la sesión y los borradores quedan, con aviso y reintento', async () => {
    mockFetch({ 'POST /auth/logout': { status: 0 } })
    guardarBorrador('parte', 1, { a: 1 })
    renderConApp(<AppLayout />, { usuario: sesion })
    await userEvent.click(screen.getByRole('button', { name: 'Salir' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Salir igual' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/No se pudo cerrar la sesión.*sigue abierta en este equipo/)
    expect(screen.getByText('Ope X')).toBeInTheDocument()
    expect(leerBorrador('parte', 1)).not.toBeNull()

    // Vuelve la señal: el reintento cierra de verdad
    const llamadas = mockFetch({})
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    await vi.waitFor(() => expect(llamadas.some((l) => l.url === '/auth/logout')).toBe(true))
    await vi.waitFor(() => expect(screen.queryByText('Ope X')).not.toBeInTheDocument())
    expect(leerBorrador('parte', 1)).toBeNull()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('un error del servidor tampoco cierra la sesión local', async () => {
    mockFetch({ 'POST /auth/logout': { status: 500, body: { error: { code: 'ERROR_INTERNO', message: 'x' } } } })
    renderConApp(<AppLayout />, { usuario: sesion })
    await userEvent.click(screen.getByRole('button', { name: 'Salir' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/No se pudo cerrar la sesión/)
    expect(screen.getByText('Ope X')).toBeInTheDocument()
  })

  it('si la sesión ya había vencido en el servidor (401), sale igual', async () => {
    mockFetch({ 'POST /auth/logout': { status: 401, body: { error: { code: 'NO_AUTENTICADO', message: 'x' } } } })
    guardarBorrador('viaje', 1, { a: 1 })
    renderConApp(<AppLayout />, { usuario: sesion })
    await userEvent.click(screen.getByRole('button', { name: 'Salir' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Salir igual' }))
    await vi.waitFor(() => expect(screen.queryByText('Ope X')).not.toBeInTheDocument())
    expect(leerBorrador('viaje', 1)).toBeNull()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('Sidebar (navegación principal)', () => {
  const conPermisos = (permisos: string[]) => ({ ...sesion, permisos })

  it('muestra solo los enlaces que permiten los permisos, agrupados por sección', () => {
    mockFetch({})
    renderConApp(<AppLayout />, { usuario: conPermisos(['production.view', 'maintenance.reading.create', 'fronts.view']) })
    const nav = screen.getByRole('navigation', { name: 'Principal' })
    for (const nombre of ['Inicio', 'Cargar lectura', 'Producción', 'Frentes']) expect(within(nav).getByRole('link', { name: nombre })).toBeInTheDocument()
    for (const nombre of ['Dashboard', 'Usuarios', 'Viajes', 'Mantenimiento']) expect(within(nav).queryByRole('link', { name: nombre })).not.toBeInTheDocument()
    expect(within(nav).getByText('Campo')).toBeInTheDocument()
    expect(within(nav).queryByText('Gestión')).toBeInTheDocument()
  })

  it('plegada conserva el nombre de cada enlace para lectores de pantalla y se recuerda en el equipo', async () => {
    mockFetch({})
    const { unmount } = renderConApp(<AppLayout />, { usuario: conPermisos(['production.view']) })
    await userEvent.click(screen.getByRole('button', { name: 'Plegar menú' }))
    expect(screen.getByRole('button', { name: 'Desplegar menú' })).toHaveAttribute('aria-expanded', 'false')
    const produccion = within(screen.getByRole('navigation', { name: 'Principal' })).getByRole('link', { name: 'Producción' })
    expect(within(produccion).getByText('Producción')).toBeInTheDocument()
    expect(localStorage.getItem('indufor:sidebar-plegada')).toBe('1')
    unmount()

    renderConApp(<AppLayout />, { usuario: conPermisos(['production.view']) })
    expect(screen.getByRole('button', { name: 'Desplegar menú' })).toBeInTheDocument()
  })

  it('en el celular "Menú" abre el panel; tocar un enlace o Escape lo cierra', async () => {
    vi.stubGlobal('innerWidth', 390)
    mockFetch({})
    renderConApp(<AppLayout />, { usuario: conPermisos(['production.view']) })
    const menu = await screen.findByRole('button', { name: 'Menú' })
    expect(menu).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('navigation', { name: 'Principal' })).not.toBeInTheDocument()

    await userEvent.click(menu)
    expect(menu).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(within(await screen.findByRole('navigation', { name: 'Principal' })).getByRole('link', { name: 'Producción' }))
    expect(menu).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(menu)
    await userEvent.keyboard('{Escape}')
    expect(menu).toHaveAttribute('aria-expanded', 'false')
    await vi.waitFor(() => expect(menu).toHaveFocus())
  })
})
