/**
 * Borradores de formularios de campo en el equipo (D11: offline solo guarda borradores; confirmar exige conexión).
 * Nunca se muestran como "guardado": son pendientes locales. Se borran al enviar y al cerrar sesión.
 */
const PREFIJO = 'indufor:borrador-'

export const claveBorrador = (tipo: string, idUsuario: number) => `${PREFIJO}${tipo}:${idUsuario}`

export function leerBorrador<T>(tipo: string, idUsuario: number): T | null {
  try {
    const crudo = localStorage.getItem(claveBorrador(tipo, idUsuario))
    return crudo ? (JSON.parse(crudo) as T) : null
  } catch {
    return null
  }
}

export function guardarBorrador(tipo: string, idUsuario: number, valor: unknown) {
  try {
    localStorage.setItem(claveBorrador(tipo, idUsuario), JSON.stringify(valor))
  } catch {
    // almacenamiento lleno o bloqueado: el formulario sigue funcionando sin borrador
  }
}

export function borrarBorrador(tipo: string, idUsuario: number) {
  try {
    localStorage.removeItem(claveBorrador(tipo, idUsuario))
  } catch {
    // sin acceso al almacenamiento: no hay nada que borrar
  }
}

/** Al cerrar sesión: ningún borrador de ningún usuario queda en el equipo. */
export function borrarTodosLosBorradores() {
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith(PREFIJO)) localStorage.removeItem(k)
  } catch {
    // sin acceso al almacenamiento: no hay nada que borrar
  }
}
