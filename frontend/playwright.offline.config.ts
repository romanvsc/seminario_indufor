import { defineConfig } from '@playwright/test'
import base from './playwright.config.ts'

// specs/04 CA-04.1: abrir la app sin señal necesita el service worker, que solo existe en el build de producción
const [backend] = [base.webServer].flat()
export default defineConfig({
  ...base,
  testIgnore: undefined,
  testMatch: 'sdd-offline.spec.ts',
  webServer: [
    backend!,
    {
      command: 'npx vite build && npx vite preview --port 5174 --strictPort',
      url: 'http://localhost:5174',
      reuseExistingServer: false,
      timeout: 180_000,
      env: { VITE_API_URL: 'http://localhost:8001' },
    },
  ],
})
