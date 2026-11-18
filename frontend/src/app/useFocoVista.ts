import { useEffect, useRef, type RefObject } from 'react'

/**
 * Al cambiar de ruta lleva el foco al h1 de la vista nueva (WCAG 2.4.3), sin mover el scroll, y lo espera si la vista
 * todavía carga. No actúa en la primera carga ni le saca el foco a quien ya lo tomó: la vista, un diálogo o el usuario.
 */
export function useFocoVista(vista: RefObject<HTMLElement | null>, ruta: string) {
  const anterior = useRef(ruta)
  useEffect(() => {
    if (anterior.current === ruta) return
    anterior.current = ruta
    const main = vista.current
    if (!main) return
    const inicial = document.activeElement
    const enfocar = () => {
      const h1 = main.querySelector('h1')
      if (!h1) return
      observador.disconnect()
      const activo = document.activeElement
      const libre = activo === document.body || (activo === inicial && !main.contains(activo) && !activo?.closest('[role="dialog"]'))
      if (libre) h1.focus({ preventScroll: true })
    }
    const observador = new MutationObserver(enfocar)
    observador.observe(main, { childList: true, subtree: true })
    enfocar()
    return () => observador.disconnect()
  }, [vista, ruta])
}
