/**
 * Cliente HTTP único (ADR-001): cookie de sesión de Sanctum + CSRF, y errores en el formato de ADR-002.
 */
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: Record<string, string[]>

  constructor(status: number, code: string, message: string, details: Record<string, string[]> = {}) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

function cookie(name: string): string | undefined {
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined
}

async function pedirCsrf(): Promise<void> {
  await fetch(`${API_URL}/sanctum/csrf-cookie`, { credentials: 'include' })
}

type Opciones = { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: unknown }

export async function api<T>(path: string, { method = 'GET', body }: Opciones = {}, reintento = true): Promise<T> {
  if (method !== 'GET' && !cookie('XSRF-TOKEN')) await pedirCsrf()

  let res: Response
  try {
    res = await fetch(`${API_URL}/api/v1${path}`, {
      method,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        'X-XSRF-TOKEN': cookie('XSRF-TOKEN') ?? '',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'SIN_CONEXION', 'No hay conexión con el servidor. Revisá tu señal e intentá de nuevo.')
  }

  // CSRF vencido: se renueva una sola vez
  if (res.status === 419 && reintento) {
    await pedirCsrf()
    return api<T>(path, { method, body }, false)
  }
  if (res.status === 204) return undefined as T

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const e = data?.error
    throw new ApiError(res.status, e?.code ?? 'ERROR_DESCONOCIDO', e?.message ?? 'Ocurrió un error inesperado.', e?.details ?? {})
  }
  return data as T
}
