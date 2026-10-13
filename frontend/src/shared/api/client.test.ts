import { mockFetch } from '@/test/render'
import { api, ApiError } from './client'

afterEach(() => vi.unstubAllGlobals())

describe('cliente HTTP', () => {
  it('convierte el error de la API (ADR-002) en ApiError con código y detalles', async () => {
    mockFetch({ 'POST /users': { status: 422, body: { error: { code: 'VALIDACION', message: 'Datos inválidos', details: { email: ['Ya existe'] } } } } })
    const err = await api('/users', { method: 'POST', body: {} }).catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err).toMatchObject({ status: 422, code: 'VALIDACION', details: { email: ['Ya existe'] } })
  })

  it('renueva el CSRF y reintenta una sola vez si la sesión CSRF venció (419)', async () => {
    document.cookie = 'XSRF-TOKEN=viejo'
    let primera = true
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.endsWith('/sanctum/csrf-cookie')) return new Response(null, { status: 204 })
      if (primera) { primera = false; return new Response('{}', { status: 419 }) }
      return new Response('{"data":1}', { status: 200 })
    }))
    await expect(api('/users', { method: 'POST', body: {} })).resolves.toEqual({ data: 1 })
    const urls = vi.mocked(fetch).mock.calls.map(([u]) => String(u))
    expect(urls.filter((u) => u.endsWith('/sanctum/csrf-cookie'))).toHaveLength(1)
  })

  it('sin red informa SIN_CONEXION en lugar de un error técnico', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    await expect(api('/auth/me')).rejects.toMatchObject({ code: 'SIN_CONEXION', status: 0 })
  })
})
