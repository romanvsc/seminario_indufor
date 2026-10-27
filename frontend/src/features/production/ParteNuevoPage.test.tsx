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
  it('CA-02.6: sin asignación en la jornada no oculta el formulario y explica qué hacer', async () => {
    backend(0)
    renderConApp(<ParteNuevoPage />, { usuario: sesion })
    expect(await screen.findByText(/No estabas asignado a ningún frente el/)).toBeInTheDocument()
    expect(screen.getByLabelText('Jornada')).toBeEnabled()
  })

  it('precarga el único frente asignado, indica la modalidad y valida sin llamar al backend', async () => {
    const llamadas = backend()
    renderConApp(<ParteNuevoPage />, { usuario: sesion })
    await vi.waitFor(() => expect(screen.getByLabelText('Frente')).toHaveDisplayValue('Papel Misionero'))
    expect(await screen.findByText('Carga consolidada del frente (encargado).')).toBeInTheDocument()
    // La preselección automática no es un borrador: si no, el inicio y "Salir" avisarían de algo que nadie cargó
    expect(localStorage.getItem(claveBorrador('parte', 1))).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: 'Enviar parte' }))
    expect(await screen.findByText('Elegí la máquina.')).toBeInTheDocument()
    expect(screen.getByText('Elegí pulpable o aserrable.')).toBeInTheDocument()
    expect(screen.getByText('Indicá toneladas o metros cúbicos.')).toBeInTheDocument()
    expect(llamadas.some((l) => l.metodo === 'POST')).toBe(false)
  })

  it('D30: una máquina de otro frente se puede usar, con aviso de dónde figura y dónde queda el parte', async () => {
    const tipo = { id: 1, nombre: 'Harvester', metrica: 'HOROMETRO' }
    const flota = { status: 200, body: { meta, data: [
      { id: 9, nombre: 'HV-01', frente: { id: 1, nombre: 'Papel Misionero' }, tipo },
      { id: 10, nombre: 'HV-07', frente: { id: 2, nombre: 'Prusia' }, tipo },
      { id: 11, nombre: 'SK-01', frente: null, tipo },
    ] } }
    backend(1, { 'GET /machinery': flota })
    renderConApp(<ParteNuevoPage />, { usuario: sesion })
    await vi.waitFor(() => expect(screen.getByLabelText('Frente')).toHaveDisplayValue('Papel Misionero'))

    await userEvent.selectOptions(screen.getByLabelText('Máquina'), '10')
    expect(await screen.findByText(/HV-07 figura en Prusia\. El parte quedará registrado en Papel Misionero/)).toBeInTheDocument()
    expect(screen.getByLabelText('Máquina')).toHaveAccessibleDescription(/HV-07 figura en Prusia/)

    await userEvent.selectOptions(screen.getByLabelText('Máquina'), '9')
    expect(screen.queryByText(/figura en/)).not.toBeInTheDocument()
    await userEvent.selectOptions(screen.getByLabelText('Máquina'), '11') // sin frente: no hay conflicto que avisar
    expect(screen.queryByText(/figura en/)).not.toBeInTheDocument()
  })

  it('CA-02.4 / CA-02.5: los frentes se piden por la jornada elegida y el que ya no corresponde se limpia con aviso', async () => {
    const llamadas = mockFetch({
      'GET /front-assignments?usuario=1&fecha=2026-10-10': asignaciones(1),
      'GET /front-assignments': asignaciones(0),
      'GET /fronts': frentes, 'GET /machinery': unidades, 'GET /wood-types': tipos,
    })
    renderConApp(<ParteNuevoPage />, { usuario: sesion })
    const jornada = await screen.findByLabelText('Jornada')
    await userEvent.clear(jornada)
    await userEvent.type(jornada, '2026-10-10')
    await vi.waitFor(() => expect(screen.getByLabelText('Frente')).toHaveDisplayValue('Papel Misionero'))
    expect(llamadas.some((l) => l.url.includes('fecha=2026-10-10'))).toBe(true)

    await userEvent.clear(jornada)
    await userEvent.type(jornada, '2026-10-20')
    expect(await screen.findByText(/no estabas asignado a Papel Misionero/)).toBeInTheDocument()
    expect(screen.getByLabelText('Frente')).toHaveValue('')
  })

  it('envía el parte con coma decimal convertida y clave de idempotencia, y borra el borrador', async () => {
    const guardado = {
      id: 50, fecha_registro: '2026-10-14', frente: { id: 1, nombre: 'Papel Misionero', modalidad: 'CONSOLIDADA' }, unidad: { id: 9, nombre: 'HV-01' },
      tipo_madera: { id: 1, nombre: 'pulpable' }, cantidad_toneladas: '32.50', metros_cubicos: null, registrado_por: { id: 1, nombre: 'Enc', apellido: 'X' },
      operario: null, tiene_foto: false, observaciones: null,
    }
    const llamadas = backend(1, { 'POST /production': { status: 201, body: { data: guardado, ya_registrado: false } } })
    renderConApp(<ParteNuevoPage />, { usuario: sesion })
    await vi.waitFor(() => expect(screen.getByLabelText('Frente')).toHaveDisplayValue('Papel Misionero'))
    await userEvent.selectOptions(screen.getByLabelText('Máquina'), '9')
    await userEvent.click(screen.getByLabelText('pulpable'))
    await userEvent.type(screen.getByLabelText('Toneladas'), '32,5')
    expect(localStorage.getItem(claveBorrador('parte', 1))).toContain('32,5')

    await userEvent.click(screen.getByRole('button', { name: 'Enviar parte' }))
    await vi.waitFor(() => expect(llamadas.find((l) => l.metodo === 'POST')).toBeDefined())
    const post = llamadas.find((l) => l.metodo === 'POST')!
    expect(post.body).toMatchObject({ id_frente: 1, id_unidad: 9, tipo_madera: 1, cantidad_toneladas: '32.5', metros_cubicos: null })
    expect(post.headers?.['Idempotency-Key']).toMatch(/^[0-9a-f-]{36}$/)
    await vi.waitFor(() => expect(localStorage.getItem(claveBorrador('parte', 1))).toBeNull())

    // CA-07.5: la constancia queda en pantalla con número y datos, hasta que se elige qué hacer
    expect(await screen.findByRole('heading', { name: '✓ Parte guardado.' })).toBeInTheDocument()
    expect(screen.getByText(/N\.º 50/)).toBeInTheDocument()
    expect(screen.getByText('14/10/2026 · Papel Misionero · HV-01 · pulpable · 32.50 t')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver mis partes' })).toHaveAttribute('href', '/produccion')

    // CA-07.4: "Cargar otro" abre un formulario limpio con la última máquina precargada (y editable)
    await userEvent.click(screen.getByRole('button', { name: 'Cargar otro' }))
    expect(await screen.findByLabelText('Máquina')).toHaveValue('9')
    expect(screen.getByLabelText('Toneladas')).toHaveValue('')
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
