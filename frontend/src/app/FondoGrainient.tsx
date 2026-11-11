import { lazy, Suspense, useSyncExternalStore } from 'react'
import { useIsMobile } from '@/shared/hooks/use-mobile'

// Carga diferida: el fondo es decoración y no debe demorar la primera pintura
const Grainient = lazy(() => import('@/shared/components/ui/Grainient'))

// Rango angosto a propósito: el texto apoyado sobre el fondo debe cumplir 4,5:1 (docs/design-tokens.md)
const COLORES = {
  oscuro: ['#03170F', '#06241A', '#0B3325'],
  claro: ['#F4F7F4', '#EAF0EB', '#DCEBE1'],
}

function suscribirTema(avisar: () => void) {
  const observador = new MutationObserver(avisar)
  observador.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => observador.disconnect()
}

/** Fondo de la vista (UIX-015): se mueve en PC; en el celular se dibuja una vez, para no gastar batería en el monte. */
export function FondoGrainient() {
  const tema = useSyncExternalStore(suscribirTema, () => (document.documentElement.dataset.theme === 'light' ? 'claro' : 'oscuro'))
  const celular = useIsMobile()
  return (
    <div aria-hidden="true" data-testid="fondo-grainient" className="pointer-events-none sticky top-0 -z-10 -mb-[100svh] h-svh shrink-0 overflow-hidden md:rounded-l-3xl">
      <Suspense fallback={null}>
        <Grainient colors={COLORES[tema]} speed={celular ? 0 : 0.15} dpr={1} grainAmount={0.04} grainAnimated={false} interactive={false} clickSwirl={false} intro={false} />
      </Suspense>
      {/* La pestaña activa de la sidebar es sólida: este velo la une al fondo sin costura */}
      <div className="absolute inset-y-0 left-0 hidden w-12 bg-linear-to-r from-background to-transparent md:block" />
    </div>
  )
}
