import { render, screen, waitFor } from '@testing-library/react'
import { useRef } from 'react'
import { useFocoVista } from './useFocoVista'

function Vista({ ruta, lista = true, campo = false, dialogo = false }: { ruta: string; lista?: boolean; campo?: boolean; dialogo?: boolean }) {
  const main = useRef<HTMLElement>(null)
  useFocoVista(main, ruta)
  return (
    <>
      <a href="/otra">Enlace del menú</a>
      <main ref={main}>
        {lista ? <h1 tabIndex={-1}>{ruta}</h1> : <p role="status">Cargando…</p>}
        {campo && <input aria-label="Campo" autoFocus />}
      </main>
      {dialogo && <div role="dialog"><button autoFocus>Cerrar</button></div>}
    </>
  )
}

describe('foco al cambiar de vista', () => {
  it('no mueve el foco en la primera carga', () => {
    render(<Vista ruta="/a" />)
    expect(document.body).toHaveFocus()
  })

  it('enfoca el h1 de la vista nueva sin mover el scroll', () => {
    const vista = render(<Vista ruta="/a" />)
    const focus = vi.spyOn(HTMLElement.prototype, 'focus')
    vista.rerender(<Vista ruta="/b" />)
    expect(screen.getByRole('heading', { name: '/b' })).toHaveFocus()
    expect(focus).toHaveBeenCalledWith({ preventScroll: true })
    focus.mockRestore()
  })

  it('también lo saca del enlace del menú que disparó la navegación', () => {
    const vista = render(<Vista ruta="/a" />)
    screen.getByRole('link').focus()
    vista.rerender(<Vista ruta="/b" />)
    expect(screen.getByRole('heading')).toHaveFocus()
  })

  it('espera el h1 si la vista todavía carga', async () => {
    const vista = render(<Vista ruta="/a" />)
    vista.rerender(<Vista ruta="/b" lista={false} />)
    expect(document.body).toHaveFocus()
    vista.rerender(<Vista ruta="/b" />)
    await waitFor(() => expect(screen.getByRole('heading')).toHaveFocus())
  })

  it('no le saca el foco a quien se movió mientras la vista cargaba', async () => {
    const vista = render(<Vista ruta="/a" />)
    vista.rerender(<Vista ruta="/b" lista={false} />)
    screen.getByRole('link').focus()
    vista.rerender(<Vista ruta="/b" />)
    await new Promise((r) => setTimeout(r))
    expect(screen.getByRole('link')).toHaveFocus()
  })

  it('respeta un campo de la vista que ya tomó el foco', () => {
    const vista = render(<Vista ruta="/a" />)
    vista.rerender(<Vista ruta="/b" campo />)
    expect(screen.getByRole('textbox')).toHaveFocus()
  })

  it('respeta un diálogo abierto al llegar a la vista', () => {
    const vista = render(<Vista ruta="/a" />)
    vista.rerender(<Vista ruta="/b" dialogo />)
    expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveFocus()
  })

  it('no vuelve a enfocar si la ruta no cambió', () => {
    const vista = render(<Vista ruta="/a" />)
    vista.rerender(<Vista ruta="/b" />)
    screen.getByRole('link').focus()
    vista.rerender(<Vista ruta="/b" lista />)
    expect(screen.getByRole('link')).toHaveFocus()
  })
})
