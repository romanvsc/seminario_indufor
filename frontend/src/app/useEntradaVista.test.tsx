import { act, render, screen, waitFor } from '@testing-library/react'
import { useRef } from 'react'
import { useEntradaVista } from './useEntradaVista'

function Vista({ ruta, lista, extra = false }: { ruta: string; lista: boolean; extra?: boolean }) {
  const main = useRef<HTMLElement>(null)
  useEntradaVista(main, ruta)
  return <main ref={main} className="vista">{lista
    ? <section><h1>Formulario</h1><form>Campos</form>{extra && <p>Actualización</p>}</section>
    : <p role="status">Cargando…</p>}</main>
}

describe('entrada inicial de la vista', () => {
  it.each([0, 300, 600, 850])('espera el contenido durante %i ms y marca solo sus bloques iniciales', async (demora) => {
    vi.useFakeTimers()
    const vista = render(<Vista ruta="/lectura" lista={false} />)
    await act(async () => { vi.advanceTimersByTime(demora) })
    expect(screen.getByRole('status')).not.toHaveAttribute('data-entrada')
    vista.rerender(<Vista ruta="/lectura" lista />)
    await act(async () => {})
    expect(screen.getByRole('heading')).toHaveAttribute('data-entrada')
    expect(screen.getByText('Campos')).toHaveAttribute('data-entrada')
    await act(async () => { vi.advanceTimersByTime(1000) })
    expect(screen.getByText('Campos')).toHaveAttribute('data-entrada')
    vista.rerender(<Vista ruta="/lectura" lista extra />)
    await act(async () => {})
    expect(screen.getByText('Actualización')).not.toHaveAttribute('data-entrada')
    vi.useRealTimers()
  })

  it('vuelve a preparar la entrada al navegar', async () => {
    const vista = render(<Vista ruta="/lectura" lista />)
    expect(screen.getByRole('heading')).toHaveAttribute('data-entrada')
    vista.rerender(<Vista ruta="/viaje" lista={false} />)
    vista.rerender(<Vista ruta="/viaje" lista />)
    await waitFor(() => expect(screen.getByRole('heading')).toHaveAttribute('data-entrada'))
  })

  it('espera el formulario si primero aparece un error de carga recuperable', async () => {
    function Estado({ listo }: { listo: boolean }) {
      const main = useRef<HTMLElement>(null)
      useEntradaVista(main, '/lectura')
      return <main ref={main}>{listo ? <section><h1>Formulario</h1></section> : <div role="alert"><p>Error de carga</p></div>}</main>
    }
    const vista = render(<Estado listo={false} />)
    expect(screen.getByText('Error de carga')).not.toHaveAttribute('data-entrada')
    vista.rerender(<Estado listo />)
    await waitFor(() => expect(screen.getByRole('heading')).toHaveAttribute('data-entrada'))
  })
})
