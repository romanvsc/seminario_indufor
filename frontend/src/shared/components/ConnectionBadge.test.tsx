import { act, render, screen } from '@testing-library/react'
import { ConnectionBadge } from './ConnectionBadge'

function setOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => value })
  window.dispatchEvent(new Event(value ? 'online' : 'offline'))
}

describe('ConnectionBadge', () => {
  it('muestra el estado de conexión con texto y lo actualiza al cambiar', () => {
    setOnline(true)
    render(<ConnectionBadge />)
    expect(screen.getByRole('status')).toHaveTextContent('En línea')

    act(() => setOnline(false))
    expect(screen.getByRole('status')).toHaveTextContent('Sin conexión')
  })
})
