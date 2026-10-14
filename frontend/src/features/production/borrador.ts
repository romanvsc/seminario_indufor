/**
 * Borrador del parte en el equipo (D11: offline solo guarda borradores; confirmar exige conexión).
 * Nunca se muestra como "guardado": es un pendiente local. Se borra al enviar y al cerrar sesión.
 */
export const PREFIJO_BORRADOR = 'indufor:borrador-parte:'

export type Borrador = {
  clave: string
  id_frente: string
  id_unidad: string
  tipo_madera: string
  fecha_registro: string
  cantidad_toneladas: string
  metros_cubicos: string
  observaciones: string
}

export function leerBorrador(idUsuario: number): Borrador | null {
  try {
    const crudo = localStorage.getItem(PREFIJO_BORRADOR + idUsuario)
    return crudo ? (JSON.parse(crudo) as Borrador) : null
  } catch {
    return null
  }
}

export function guardarBorrador(idUsuario: number, b: Borrador) {
  try {
    localStorage.setItem(PREFIJO_BORRADOR + idUsuario, JSON.stringify(b))
  } catch {
    // almacenamiento lleno o bloqueado: el formulario sigue funcionando sin borrador
  }
}

export function borrarBorradores(idUsuario?: number) {
  try {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith(PREFIJO_BORRADOR + (idUsuario ?? ''))) localStorage.removeItem(k)
    }
  } catch {
    // sin acceso al almacenamiento: no hay nada que borrar
  }
}
