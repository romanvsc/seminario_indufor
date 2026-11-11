import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { guardarBorrador } from '@/shared/borrador'
import { mockFetch, renderConApp } from '@/test/render'
import { InicioPage } from './InicioPage'

beforeEach(() => localStorage.clear())
afterEach(() => vi.unstubAllGlobals())

const sesion = (permisos: string[], rol = 'Operario') => ({ id: 1, nombre: 'Olga', apellido: 'X', email: 'o@indufor.test', roles: [{ codigo: 'x', nombre: rol }], permisos })
const ahora = () => new Date().toLocaleString('sv-SE').slice(0, 19)
const pendientes = (data: object) => ({ status: 200, body: { data, meta: { generado_at: ahora() } } })
const actividad = (data: object[] = []) => ({ status: 200, body: { data } })

describe('InicioPage (centro de operaciones)', () => {
  it('Administración: título de gestión, tarjetas, alertas por gravedad con contexto y enlaces filtrados', async () => {
    mockFetch({
      'GET /me/pending': pendientes({
        viajes_sin_remito: { cantidad: 2, items: [{ id: 3, fecha: '2026-11-02 08:00', origen: 'Prusia', camionero: 'Pérez, Ana' }] },
        lecturas_sin_exportar: { cantidad: 0, items: [] },
        fallas_abiertas: { cantidad: 0, items: [] },
        matafuegos_vencidos: { cantidad: 1, items: [{ id: 4, nombre: 'HV-PR1', vencimiento: '2026-10-29' }] },
      }),
      'GET /me/activity': actividad([{ id: 1, accion: 'lectura.registrada', entidad_id: '7', fecha: '2026-10-20 10:24', usuario: 'Omar Operario', contexto: 'HV-PR1' }]),
    })
    renderConApp(<InicioPage />, { usuario: sesion(['logistics.remito.create', 'integration.import-costs', 'maintenance.failure.view'], 'Administración') })

    expect(screen.getByRole('heading', { level: 1, name: 'Centro de operaciones' })).toBeInTheDocument()
    expect(screen.getByText('INDUFOR / Administración')).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: 'Viajes sin remito: 2. Documentación pendiente' })).toHaveAttribute('href', '/viajes?estado=PENDIENTE')
    expect(screen.getByRole('link', { name: 'Matafuegos vencidos: 1. Requiere revisión' })).toBeInTheDocument()

    const alertas = screen.getAllByRole('listitem').filter((li) => li.closest('ul'))
    expect(alertas[0]).toHaveTextContent('1 matafuego con la carga vencida')
    expect(alertas[0]).toHaveTextContent('Crítico')
    expect(screen.getByRole('link', { name: /2 viajes esperan remito.*Seguimiento/ })).toHaveAttribute('href', '/viajes?estado=PENDIENTE')
    expect(screen.getByText('2 pendientes')).toBeInTheDocument()

    const accesos = screen.getByRole('navigation', { name: 'Accesos rápidos' })
    expect(within(accesos).getByRole('link', { name: 'Cargar remito' })).toBeInTheDocument()
    expect(within(accesos).queryByRole('link', { name: 'Cargar parte' })).not.toBeInTheDocument()
    expect(await screen.findByText('Lectura registrada')).toBeInTheDocument()
    expect(screen.getByText(/Actualizado a las/)).toBeInTheDocument()
  })

  it('personal de campo: "Mi jornada", borradores del equipo y sin datos de otros roles', async () => {
    guardarBorrador('lectura', 1, { a: 1 })
    mockFetch({ 'GET /me/pending': pendientes({ unidades_sin_lectura_semana: { cantidad: 1, items: [{ id: 9, nombre: 'HV-PM1', frente: 'Papel Misionero' }] } }), 'GET /me/activity': actividad() })
    renderConApp(<InicioPage />, { usuario: sesion(['production.create', 'maintenance.reading.create']) })

    expect(screen.getByRole('heading', { level: 1, name: 'Mi jornada' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Seguir con: Lectura' })).toHaveAttribute('href', '/lecturas/nueva')
    expect(await screen.findByRole('link', { name: /1 unidad sin lectura desde el lunes/ })).toHaveTextContent('HV-PM1')
    expect(screen.queryByText(/remito/i)).not.toBeInTheDocument()
    expect(await screen.findByText('Todavía no hay actividad registrada.')).toBeInTheDocument()
  })

  it('las acciones frecuentes se ordenan por uso en el equipo y la más usada queda primera', async () => {
    localStorage.setItem('indufor:accesos-uso', JSON.stringify({ '/lecturas/nueva': 5 }))
    mockFetch({ 'GET /me/pending': pendientes({}), 'GET /me/activity': actividad() })
    renderConApp(<InicioPage />, { usuario: sesion(['production.create', 'maintenance.reading.create']) })
    const accesos = within(screen.getByRole('navigation', { name: 'Accesos rápidos' })).getAllByRole('link')
    expect(accesos.map((a) => a.textContent)).toEqual(['Cargar lectura', 'Cargar parte'])

    await userEvent.click(accesos[1])
    expect(JSON.parse(localStorage.getItem('indufor:accesos-uso')!)).toEqual({ '/lecturas/nueva': 5, '/produccion/nuevo': 1 })
  })

  it('sin pendientes lo dice; si la consulta falla, avisa sin bloquear los accesos', async () => {
    mockFetch({ 'GET /me/pending': pendientes({ fallas_abiertas: { cantidad: 0, items: [] } }), 'GET /me/activity': actividad() })
    const { unmount } = renderConApp(<InicioPage />, { usuario: sesion(['production.create', 'maintenance.failure.view']) })
    expect(await screen.findByText('✓ No tenés nada pendiente.')).toBeInTheDocument()
    unmount()

    mockFetch({ 'GET /me/pending': { status: 500, body: { error: { code: 'X', message: 'x' } } }, 'GET /me/activity': actividad() })
    renderConApp(<InicioPage />, { usuario: sesion(['production.create']) })
    expect(await screen.findByText(/No se pudieron consultar los pendientes\. Revisá la señal/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Cargar parte' })).toBeInTheDocument()
  })

  it('con datos de una copia vieja (sin señal), los muestra marcados con su hora', async () => {
    mockFetch({ 'GET /me/pending': { status: 200, body: { data: { fallas_abiertas: { cantidad: 1, items: [] } }, meta: { generado_at: '2026-11-03 07:15:00' } } }, 'GET /me/activity': actividad() })
    renderConApp(<InicioPage />, { usuario: sesion(['maintenance.failure.view']) })
    expect(await screen.findByText(/Mostrando datos de las 07:15/)).toBeInTheDocument()
  })
})
