import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FiltroAutocompletable } from './FiltroAutocompletable'

function Ejemplo() {
  const [valor, setValor] = useState('')
  return <><label htmlFor="unidad">Unidad</label><FiltroAutocompletable id="unidad" value={valor} onChange={setValor}>
    <option value="">Todas</option><option value="1">Camión Azul</option><option value="2">Tractor</option>
  </FiltroAutocompletable><button onClick={() => setValor('')}>Limpiar</button><output>{valor}</output></>
}

describe('FiltroAutocompletable', () => {
  it('filtra sin distinguir tildes, selecciona con teclado y permite limpiar', async () => {
    const user = userEvent.setup()
    render(<Ejemplo />)
    const campo = screen.getByRole('combobox', { name: 'Unidad' })
    await user.click(campo)
    await user.type(await screen.findByLabelText('Buscar opciones'), 'camion')
    expect(screen.getByRole('option', { name: 'Camión Azul' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Tractor' })).not.toBeInTheDocument()
    await user.keyboard('{Enter}')
    expect(screen.getByText('1', { selector: 'output' })).toBeInTheDocument()
    expect(campo).toHaveTextContent('Camión Azul')
    await vi.waitFor(() => expect(campo).toHaveFocus())
    await user.click(screen.getByRole('button', { name: 'Limpiar' }))
    expect(campo).toHaveTextContent('Todas')
  })

  it('descarta la búsqueda al escapar y comunica ausencia de resultados', async () => {
    const user = userEvent.setup()
    render(<Ejemplo />)
    const campo = screen.getByRole('combobox', { name: 'Unidad' })
    await user.click(campo)
    await user.type(await screen.findByLabelText('Buscar opciones'), 'inexistente')
    expect(screen.getByText('Sin opciones coincidentes')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(campo).toHaveTextContent('Todas')
    expect(screen.getByText('', { selector: 'output' })).toBeInTheDocument()
    await user.click(campo)
    expect(await screen.findByLabelText('Buscar opciones')).toHaveValue('')
  })

  it('informa carga y error de las opciones', async () => {
    const { rerender } = render(<FiltroAutocompletable id="f" value="" onChange={() => {}} cargando><option value="">Todos</option></FiltroAutocompletable>)
    await userEvent.click(screen.getByRole('combobox'))
    expect(await screen.findByRole('status')).toHaveTextContent('Cargando opciones')
    rerender(<FiltroAutocompletable id="f" value="" onChange={() => {}} error><option value="">Todos</option></FiltroAutocompletable>)
    expect(screen.getByRole('status')).toHaveTextContent('No se pudieron cargar las opciones')
  })
})
