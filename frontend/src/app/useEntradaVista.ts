import { useLayoutEffect, type RefObject } from 'react'

/** Anima los bloques presentes cuando aparece el contenido inicial, una sola vez por ruta. */
export function useEntradaVista(vista: RefObject<HTMLElement | null>, ruta: string) {
  useLayoutEffect(() => {
    const main = vista.current
    if (!main) return
    let bloques: Element[] = []
    const preparar = () => {
      const pagina = main.firstElementChild
      if (!pagina || pagina.matches('[role="status"], [role="alert"]') || pagina.children.length === 0) return
      bloques = Array.from(pagina.children)
      bloques.forEach((bloque) => bloque.setAttribute('data-entrada', ''))
      observador.disconnect()
    }
    const observador = new MutationObserver(preparar)
    observador.observe(main, { childList: true, subtree: true })
    preparar()
    return () => {
      observador.disconnect()
      bloques.forEach((bloque) => bloque.removeAttribute('data-entrada'))
    }
  }, [vista, ruta])
}
