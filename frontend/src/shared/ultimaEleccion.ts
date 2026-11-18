/**
 * Spec 07 (CA-07.4): última máquina / frente que el usuario eligió en cada formulario, en este equipo.
 * Sirve para precargar el siguiente formulario; siempre queda a la vista y se puede cambiar (I-07.2).
 */
const PREFIJO = 'indufor:ultima-'

export function leerUltimaEleccion(tipo: string, idUsuario: number): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(`${PREFIJO}${tipo}:${idUsuario}`) ?? '{}') as Record<string, string>
  } catch {
    return {}
  }
}

export function recordarEleccion(tipo: string, idUsuario: number, valores: Record<string, string>) {
  try {
    localStorage.setItem(`${PREFIJO}${tipo}:${idUsuario}`, JSON.stringify(valores))
  } catch {
    // sin almacenamiento solo se pierde la comodidad de la precarga
  }
}

/** La elección recordada vale solo si la opción todavía existe (una máquina dada de baja no se precarga). */
export const vigente = (valor: string | undefined, opciones: { id: number }[]) => (valor && opciones.some((o) => String(o.id) === valor) ? valor : '')
