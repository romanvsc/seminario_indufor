import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterPanel } from './FilterPanel'
import { PageHeader } from './PageHeader'
import { StatusBadge } from './StatusBadge'

describe('Forest Depth: componentes compartidos', () => {
  it('PageHeader: sin fondo no hay foto; con fondo, la foto es decorativa y el título sigue siendo el h1', () => {
    const { rerender } = render(<PageHeader titulo="Producción forestal" eyebrow="Operación" descripcion="Partes" />)
    expect(screen.getByRole('heading', { level: 1, name: 'Producción forestal' })).toBeInTheDocument()
    expect(screen.queryByTestId('fondo-encabezado')).not.toBeInTheDocument()

    rerender(<PageHeader titulo="Producción forestal" fondo="/header-bosque.webp" accion={<button>Cargar parte</button>} />)
    expect(screen.getByTestId('fondo-encabezado')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('button', { name: 'Cargar parte' })).toBeInTheDocument()
  })

  it('StatusBadge: el estado se lee por el texto, el ícono queda oculto al lector', () => {
    render(<StatusBadge tono="warning" icono={<svg data-testid="icono" />}>Pendiente de remito</StatusBadge>)
    expect(screen.getByText('Pendiente de remito')).toBeInTheDocument()
    expect(screen.getByTestId('icono').parentElement).toHaveAttribute('aria-hidden', 'true')
  })

  it('FilterPanel: quita un filtro y limpia todos; sin activos no ofrece limpiar', async () => {
    const onQuitar = vi.fn()
    const onLimpiar = vi.fn()
    const { rerender } = render(
      <FilterPanel activos={[{ clave: 'frente', texto: 'Frente: Prusia' }]} onQuitar={onQuitar} onLimpiar={onLimpiar}><input aria-label="Frente" /></FilterPanel>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Quitar filtro Frente: Prusia' }))
    expect(onQuitar).toHaveBeenCalledWith('frente')
    await userEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    expect(onLimpiar).toHaveBeenCalled()

    rerender(<FilterPanel activos={[]} onQuitar={onQuitar} onLimpiar={onLimpiar}><input aria-label="Frente" /></FilterPanel>)
    expect(screen.queryByRole('button', { name: 'Limpiar filtros' })).not.toBeInTheDocument()
  })
})
