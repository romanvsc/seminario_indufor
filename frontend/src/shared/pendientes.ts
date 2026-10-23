/**
 * Lo que la app no puede guardar en el borrador (la foto elegida) y se perdería al recargar.
 * UpdatePrompt lo consulta antes de actualizar a una versión nueva (specs/04 T-04.8).
 */
let fotoPendiente = false

export const marcarFotoPendiente = (hay: boolean) => {
  fotoPendiente = hay
}

export const hayFotoPendiente = () => fotoPendiente
