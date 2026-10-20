import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockFetch, renderConApp } from '@/test/render'
import { claveBorrador } from '@/shared/borrador'
import { ParteNuevoPage } from './ParteNuevoPage'

const meta = { current_page: 1, last_page: 1, per_page: 100, total: 1 }
const sesion = { id: 1, nombre: 'Enc', apellido: 'X', email: 'e@indufor.test', roles: [], permisos: ['production.create', 'production.view'] }
const frentes = { status: 200, body: { data: [{ id: 1, nombre: 'Papel Misionero', ubicacion: null, modalidad: 'CONSOLIDADA', estado_activo: true }], meta } }
const asignaciones = (n: number) => ({
  status: 200,
  body: { data: n ? [{ id: 4, frente: { id: 1, nombre: 'Papel Misionero' }, usuario: { id: 1, nombre: 'Enc', apellido: 'X' }, fecha_desde: '2026-10-01', fecha_hasta: null }] : [], meta },
})
const unidades = { status: 200, body: { data: [{ id: 9, nombre: 'HV-01', frente: { id: 1, nombre: 'Papel Misionero' }, tipo: { id: 1, nombre: 'Harvester', metrica: 'HOROMETRO' } }], meta } }
const tipos = { status: 200, body: { data: [{ id: 2, nombre: 'aserrable' }, { id: 1, nombre: 'pulpable' }] } }
const backend = (n = 1, extra = {}) => mockFetch({ 'GET /front-assignments': asignaciones(n), 'GET /fronts': frentes, 'GET /machinery': unidades, 'GET /wood-types': tipos, ...extra })

beforeEach(() => localStorage.clear())
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('ParteNuevoPage (pantalla de campo)', () => {
  it('sin asignación vigente explica qué hacer', async () => {
    backend(0)
    renderConApp(<ParteNuevoPage />, { usuario: sesion })
    expect(await screen.findByRole('alert')).toHaveTextContent('No estás asignado a ningún frente hoy')
  })

  it('precarga el único frente asignado, indica la modalidad y valida sin llamar al backend', async () => {
    const llamadas = backend()
    renderConApp(<ParteNuevoPage />, { usuario: sesion })
    expect(await screen.findByLabelText('Frente')).toHaveDisplayValue('Papel Misionero')
    expect(screen.getByText('Carga consolidada del frente (encargado).')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Enviar parte' }))
    expect(await screen.findByText('Elegí la máquina.')).toBeInTheDocument()
    expect(screen.getByText('Elegí pulpable o aserrable.')).toBeInTheDocument()
    expect(screen.getByText('Indicá toneladas o metros cúbicos.')).toBeInTheDocument()
    expect(llamadas.some((l) => l.metodo === 'POST')).toBe(false)
  })

  it('envía el parte con coma decimal convertida y clave de idempotencia, y borra el borrador', async () => {
    const llamadas = backend(1, { 'POST /production': { status: 201, body: { data: { id: 50 } } } })
    renderConApp(<ParteNuevoPage />, { usuario: sesion })
    await userEvent.selectOptions(await screen.findByLabelText('Máquina'), '9')
    await userEvent.click(screen.getByLabelText('pulpable'))
    await userEvent.type(screen.getByLabelText('Toneladas'), '32,5')
    expect(localStorage.getItem(claveBorrador('parte', 1))).toContain('32,5')

    await userEvent.click(screen.getByRole('button', { name: 'Enviar parte' }))
    await vi.waitFor(() => expect(llamadas.find((l) => l.metodo === 'POST')).toBeDefined())
    const post = llamadas.find((l) => l.metodo === 'POST')!
    expect(post.body).toMatchObject({ id_frente: 1, id_unidad: 9, tipo_madera: 1, cantidad_toneladas: '32.5', metros_cubicos: null })
    expect(post.headers?.['Idempotency-Key']).toMatch(/^[0-9a-f-]{36}$/)
    await vi.waitFor(() => expect(localStorage.getItem(claveBorrador('parte', 1))).toBeNull())
  })

  it('recupera el borrador guardado en el equipo', async () => {
    localStorage.setItem(claveBorrador('parte', 1), JSON.stringify({
      clave: 'k', id_frente: '1', id_unidad: '9', tipo_madera: '2', fecha_registro: '2026-10-01', cantidad_toneladas: '', metros_cubicos: '12', observaciones: 'Lluvia',
    }))
    backend()
    renderConApp(<ParteNuevoPage />, { usuario: sesion })
    expect(await screen.findByLabelText('Metros cúbicos')).toHaveValue('12')
    expect(screen.getByLabelText('aserrable')).toBeChecked()
    expect(screen.getByLabelText('Observaciones (opcional)')).toHaveValue('Lluvia')
  })

  it('sin conexión no permite enviar y avisa que el borrador queda en el equipo', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    backend()
    renderConApp(<ParteNuevoPage />, { usuario: sesion })
    expect(await screen.findByRole('button', { name: 'Sin conexión' })).toBeDisabled()
    expect(screen.getByText(/El borrador queda guardado en este equipo/)).toBeInTheDocument()
  })
})
