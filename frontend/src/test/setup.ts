import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// El registro del Service Worker no existe en jsdom: se simula sin actualización pendiente.
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({ needRefresh: [false, vi.fn()], offlineReady: [false, vi.fn()], updateServiceWorker: vi.fn() }),
}))

// jsdom no implementa ResizeObserver (lo usan los componentes de Radix)
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} }

// jsdom no implementa matchMedia (lo usa useIsMobile de la sidebar); el ancho sale de window.innerWidth
if (typeof window !== 'undefined') window.matchMedia ??= ((query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia

// jsdom no implementa scrollIntoView (lo usa cmdk en FiltroAutocompletable)
if (typeof Element !== 'undefined') Element.prototype.scrollIntoView ??= () => {}
