import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

/** Renderiza con React Query y router. `usuario` precarga la sesión (o null = sin sesión). */
export function renderConApp(ui: ReactNode, { usuario = null as unknown, ruta = '/' } = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  qc.setQueryData(['auth', 'me'], usuario)
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[ruta]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}

/** Simula el backend: responde según "METODO /ruta" y registra las llamadas. `status: 0` simula un corte de red. */
export function mockFetch(respuestas: Record<string, { status: number; body?: unknown }>) {
  const llamadas: { metodo: string; url: string; body?: unknown; headers?: Record<string, string> }[] = []
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const metodo = init?.method ?? 'GET'
    const ruta = new URL(url).pathname.replace('/api/v1', '') + new URL(url).search
    llamadas.push({ metodo, url: ruta, body: typeof init?.body === 'string' ? JSON.parse(init.body) : init?.body, headers: init?.headers as Record<string, string> })
    const clave = Object.keys(respuestas).find((k) => `${metodo} ${ruta}`.startsWith(k)) ?? (ruta.startsWith('/sanctum') ? 'csrf' : '')
    const r = respuestas[clave] ?? { status: 204 }
    if (r.status === 0) throw new TypeError('Failed to fetch')
    return new Response(r.status === 204 ? null : JSON.stringify(r.body ?? {}), { status: r.status, headers: { 'Content-Type': 'application/json' } })
  }))
  return llamadas
}
