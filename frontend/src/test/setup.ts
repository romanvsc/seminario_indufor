import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// El registro del Service Worker no existe en jsdom: se simula sin actualización pendiente.
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({ needRefresh: [false, vi.fn()], offlineReady: [false, vi.fn()], updateServiceWorker: vi.fn() }),
}))

// jsdom no implementa ResizeObserver (lo usan los componentes de Radix)
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} }
