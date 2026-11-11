import { useState } from 'react'
import { flushSync } from 'react-dom'

export type Tema = 'oscuro' | 'claro'

const CLAVE = 'indufor:tema'
const COLOR_BARRA: Record<Tema, string> = { oscuro: '#03170F', claro: '#F4F7F4' }

function aplicar(tema: Tema) {
  const raiz = document.documentElement
  if (tema === 'claro') raiz.dataset.theme = 'light'
  else delete raiz.dataset.theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLOR_BARRA[tema])
}

/** Tema de la app (UIX-014). `public/tema.js` lo aplica antes de pintar; acá se cambia con un círculo que crece desde (x, y). */
export function useTema() {
  const [tema, setTema] = useState<Tema>(() => (document.documentElement.dataset.theme === 'light' ? 'claro' : 'oscuro'))

  const cambiar = (x: number, y: number) => {
    const nuevo: Tema = tema === 'claro' ? 'oscuro' : 'claro'
    try {
      localStorage.setItem(CLAVE, nuevo)
    } catch {
      // sin almacenamiento solo se pierde recordar la preferencia
    }
    const hacer = () => {
      flushSync(() => setTema(nuevo))
      aplicar(nuevo)
    }
    const raiz = document.documentElement
    if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      hacer()
      return
    }
    raiz.style.setProperty('--tema-x', `${x}px`)
    raiz.style.setProperty('--tema-y', `${y}px`)
    raiz.style.setProperty('--tema-radio', `${Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))}px`)
    raiz.dataset.cambioTema = ''
    void document.startViewTransition(hacer).finished.finally(() => delete raiz.dataset.cambioTema)
  }

  return { tema, cambiar }
}
