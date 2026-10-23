import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { marcarFotoPendiente } from '@/shared/pendientes'
import { UpdatePrompt } from './UpdatePrompt'

// Reemplaza el mock global de setup.ts: acá hay una versión nueva esperando
const sw = vi.hoisted(() => ({ needRefresh: true, setNeedRefresh: vi.fn(), updateServiceWorker: vi.fn() }))
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({ needRefresh: [sw.needRefresh, sw.setNeedRefresh], offlineReady: [false, vi.fn()], updateServiceWorker: sw.updateServiceWorker }),
}))

describe('UpdatePrompt (PWA)', () => {
  it('con una versión nueva avisa y actualiza solo cuando el usuario lo pide', async () => {
    render(<UpdatePrompt />)
    expect(screen.getByRole('alert')).toHaveTextContent('Hay una nueva versión disponible.')
    expect(sw.updateServiceWorker).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Actualizar' }))
    expect(sw.updateServiceWorker).toHaveBeenCalledWith(true)
  })

  it('T-04.8: con una foto elegida sin enviar avisa que se pierde antes de actualizar', async () => {
    sw.updateServiceWorker.mockClear()
    marcarFotoPendiente(true)
    render(<UpdatePrompt />)
    await userEvent.click(screen.getByRole('button', { name: 'Actualizar' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Tenés una foto elegida sin enviar')
    expect(sw.updateServiceWorker).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Actualizar igual' }))
    expect(sw.updateServiceWorker).toHaveBeenCalledWith(true)
    marcarFotoPendiente(false)
  })

  it('"Más tarde" posterga la actualización para no perder un formulario a medio cargar', async () => {
    render(<UpdatePrompt />)
    await userEvent.click(screen.getByRole('button', { name: 'Más tarde' }))
    expect(sw.setNeedRefresh).toHaveBeenCalledWith(false)
  })
})
