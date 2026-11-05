import { act, renderHook } from '@testing-library/react'
import { useTema } from './useTema'

afterEach(() => {
  delete document.documentElement.dataset.theme
  delete document.documentElement.dataset.cambioTema
  localStorage.clear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  Reflect.deleteProperty(document, 'startViewTransition')
})

describe('useTema (UIX-014)', () => {
  it('sin View Transitions alterna el tema y lo recuerda', () => {
    const { result } = renderHook(() => useTema())
    expect(result.current.tema).toBe('oscuro')
    act(() => result.current.cambiar(10, 10))
    expect(result.current.tema).toBe('claro')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('indufor:tema')).toBe('claro')
    act(() => result.current.cambiar(10, 10))
    expect(document.documentElement.dataset.theme).toBeUndefined()
    expect(localStorage.getItem('indufor:tema')).toBe('oscuro')
  })

  it('cambia aunque no haya almacenamiento', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('bloqueado') })
    const { result } = renderHook(() => useTema())
    act(() => result.current.cambiar(0, 0))
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('anima desde el punto indicado y quita la marca al terminar', async () => {
    const inicio = vi.fn((hacer: () => void) => { hacer(); return { finished: Promise.resolve() } })
    Object.defineProperty(document, 'startViewTransition', { configurable: true, value: inicio })
    const { result } = renderHook(() => useTema())
    act(() => result.current.cambiar(40, 50))
    expect(inicio).toHaveBeenCalledOnce()
    expect(document.documentElement.style.getPropertyValue('--tema-x')).toBe('40px')
    expect(document.documentElement.dataset.theme).toBe('light')
    await vi.waitFor(() => expect(document.documentElement.dataset.cambioTema).toBeUndefined())
  })

  it('con movimiento reducido cambia sin animar', () => {
    const inicio = vi.fn()
    Object.defineProperty(document, 'startViewTransition', { configurable: true, value: inicio })
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    const { result } = renderHook(() => useTema())
    act(() => result.current.cambiar(0, 0))
    expect(inicio).not.toHaveBeenCalled()
    expect(document.documentElement.dataset.theme).toBe('light')
  })
})
