import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { ApiError } from '@/shared/api/client'
import { leerBorrador } from '@/shared/borrador'
import { conCopiaLocal } from '@/shared/copiaLocal'
import { mockFetch, renderConApp } from '@/test/render'
import { LecturaNuevaPage } from './LecturaNuevaPage'
import { MatafuegoNuevoPage } from './MatafuegoNuevoPage'

beforeEach(() => localStorage.clear())
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const meta = { current_page: 1, last_page: 1, per_page: 100, total: 1 }
const sesion = { id: 1, nombre: 'Ope', apellido: 'X', email: 'o@indufor.test', roles: [], permisos: ['maintenance.reading.create', 'maintenance.extinguisher.create'] }
const unidades = { status: 200, body: { data: [{ id: 9, nombre: 'HV-01', frente: null, tipo: { id: 1, nombre: 'Harvester', metrica: 'HOROMETRO' } }], meta } }
const ultima = { status: 200, body: { data: { metrica: 'HOROMETRO', anterior: null, posterior: null } } }
const claveDe = (l?: { headers?: Record<string, string> }) => l?.headers?.['Idempotency-Key']

async function cargarLectura() {
  await userEvent.selectOptions(await screen.findByLabelText('Unidad'), '9')
  await userEvent.type(await screen.findByLabelText('Horómetro (horas)'), '1300')
}

describe('specs/04: conectividad en los formularios de campo', () => {
  it('T-04.2: si no cargan las opciones avisa y permite reintentar (no queda "Cargando…")', async () => {
    mockFetch({ 'GET /machinery': { status: 500, body: { error: { code: 'ERROR_INTERNO', message: 'x' } } } })
    renderConApp(<LecturaNuevaPage />, { usuario: sesion })
    expect(await screen.findByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
    mockFetch({ 'GET /machinery': unidades })
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByLabelText('Unidad')).toBeInTheDocument()
  })

  it('T-04.1: sin señal abre el formulario con la última copia de las opciones', async () => {
    await conCopiaLocal('unidades', async () => unidades.body.data)
    mockFetch({ 'GET /machinery': { status: 0 } })
    renderConApp(<LecturaNuevaPage />, { usuario: sesion })
    expect(await screen.findByRole('option', { name: 'HV-01 · Harvester' })).toBeInTheDocument()
  })

  it('sin copia guardada no inventa datos: propaga el error de conexión', async () => {
    await expect(conCopiaLocal('nada', () => Promise.reject(new ApiError(0, 'SIN_CONEXION', 'sin señal')))).rejects.toThrow('sin señal')
  })

  it('T-04.3: si el borrador no se puede guardar en el equipo, lo dice', async () => {
    mockFetch({ 'GET /machinery': unidades, 'GET /maintenance/units/9/last-reading': ultima })
    renderConApp(<LecturaNuevaPage />, { usuario: sesion })
    await screen.findByLabelText('Unidad')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    await cargarLectura()
    expect(await screen.findByText(/No se pudo guardar el borrador en este equipo/)).toBeInTheDocument()
  })

  it('T-04.4: corte durante el envío → "no sabemos si llegó"; reintentar usa la misma clave', async () => {
    const primero = mockFetch({ 'GET /machinery': unidades, 'GET /maintenance/units/9/last-reading': ultima, 'POST /maintenance/readings': { status: 0 } })
    renderConApp(<LecturaNuevaPage />, { usuario: sesion })
    await cargarLectura()
    await userEvent.click(screen.getByRole('button', { name: 'Enviar lectura' }))
    expect(await screen.findByText(/No sabemos si llegó/)).toBeInTheDocument()
    expect(leerBorrador('lectura', 1)).not.toBeNull()

    const segundo = mockFetch({ 'POST /maintenance/readings': { status: 200, body: { data: { id: 1 }, ya_registrado: true } } })
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    await vi.waitFor(() => expect(leerBorrador('lectura', 1)).toBeNull())
    expect(claveDe(segundo.find((l) => l.metodo === 'POST'))).toBe(claveDe(primero.find((l) => l.metodo === 'POST')))
  })

  it('T-04.6: sesión vencida al enviar → va al login y el borrador queda', async () => {
    mockFetch({
      'GET /machinery': unidades, 'GET /maintenance/units/9/last-reading': ultima,
      'POST /maintenance/readings': { status: 401, body: { error: { code: 'NO_AUTENTICADO', message: 'Tenés que iniciar sesión.' } } },
    })
    renderConApp(
      <Routes>
        <Route path="/login" element={<p>Pantalla de login</p>} />
        <Route path="/lecturas/nueva" element={<RequireAuth><LecturaNuevaPage /></RequireAuth>} />
      </Routes>,
      { usuario: sesion, ruta: '/lecturas/nueva' },
    )
    await cargarLectura()
    await userEvent.click(screen.getByRole('button', { name: 'Enviar lectura' }))
    expect(await screen.findByText('Pantalla de login')).toBeInTheDocument()
    expect(leerBorrador<{ valor: string }>('lectura', 1)?.valor).toBe('1300')
  })
})

describe('specs/06 (D24): matafuego según estado', () => {
  const post = { 'POST /maintenance/extinguishers': { status: 201, body: { data: { id: 1 }, ya_registrado: false } } }

  it('FALTANTE no pide vencimiento y lo envía vacío', async () => {
    const llamadas = mockFetch({ 'GET /machinery': unidades, ...post })
    renderConApp(<MatafuegoNuevoPage />, { usuario: sesion })
    await userEvent.selectOptions(await screen.findByLabelText('Unidad'), '9')
    await userEvent.click(screen.getByLabelText('Faltante'))
    expect(screen.queryByLabelText('Vence la carga')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Enviar control' }))
    await vi.waitFor(() => expect(llamadas.find((l) => l.metodo === 'POST')?.body).toMatchObject({
      estado_matafuego: 'FALTANTE', fecha_vencimiento_carga: null, etiqueta_ilegible: false,
    }))
  })

  it('OK exige vencimiento; DESCARGADO con etiqueta ilegible lo envía sin fecha', async () => {
    const llamadas = mockFetch({ 'GET /machinery': unidades, ...post })
    renderConApp(<MatafuegoNuevoPage />, { usuario: sesion })
    await userEvent.selectOptions(await screen.findByLabelText('Unidad'), '9')
    await userEvent.click(screen.getByLabelText('OK'))
    expect(screen.queryByLabelText('No se puede leer la etiqueta')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Enviar control' }))
    expect(await screen.findByText('Indicá el vencimiento de la carga (figura en la etiqueta).')).toBeInTheDocument()
    expect(llamadas.some((l) => l.metodo === 'POST')).toBe(false)

    await userEvent.click(screen.getByLabelText('Descargado'))
    await userEvent.click(screen.getByLabelText('No se puede leer la etiqueta'))
    expect(screen.queryByLabelText('Vence la carga')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Enviar control' }))
    await vi.waitFor(() => expect(llamadas.find((l) => l.metodo === 'POST')?.body).toMatchObject({
      estado_matafuego: 'DESCARGADO', fecha_vencimiento_carga: null, etiqueta_ilegible: true,
    }))
  })

  it('T-04.7: lo cargado queda como borrador y se recupera al volver a la pantalla', async () => {
    mockFetch({ 'GET /machinery': unidades })
    const { unmount } = renderConApp(<MatafuegoNuevoPage />, { usuario: sesion })
    await userEvent.selectOptions(await screen.findByLabelText('Unidad'), '9')
    await userEvent.click(screen.getByLabelText('Dañado'))
    unmount()
    renderConApp(<MatafuegoNuevoPage />, { usuario: sesion })
    expect(await screen.findByLabelText('Dañado')).toBeChecked()
  })
})
