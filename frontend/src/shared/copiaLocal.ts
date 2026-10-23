import { ApiError } from '@/shared/api/client'

/**
 * Última respuesta buena de una consulta, guardada en el equipo para poder ABRIR los formularios de campo sin señal
 * (specs/04 T-04.1, D11). Nunca sirve para confirmar nada: todo envío vuelve a pasar por el backend.
 */
const PREFIJO = 'indufor:copia-'

export async function conCopiaLocal<T>(clave: string, consultar: () => Promise<T>): Promise<T> {
  try {
    const dato = await consultar()
    try {
      localStorage.setItem(PREFIJO + clave, JSON.stringify(dato))
    } catch {
      // sin almacenamiento: la consulta funciona igual, solo no habrá copia sin señal
    }
    return dato
  } catch (e) {
    if (e instanceof ApiError && e.code === 'SIN_CONEXION') {
      const copia = leerCopia<T>(clave)
      if (copia !== undefined) return copia
    }
    throw e
  }
}

function leerCopia<T>(clave: string): T | undefined {
  try {
    const crudo = localStorage.getItem(PREFIJO + clave)
    return crudo === null ? undefined : (JSON.parse(crudo) as T)
  } catch {
    return undefined
  }
}

/** Al cerrar sesión (o si la sesión venció) no queda ninguna copia de datos en el equipo. */
export function borrarCopiasLocales() {
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith(PREFIJO)) localStorage.removeItem(k)
  } catch {
    // sin acceso al almacenamiento: no hay nada que borrar
  }
}
