import type { Metrica } from '@/features/machinery/api'

/**
 * Aviso en tiempo real del formulario (RNF05). No reemplaza el rechazo del backend: lo adelanta.
 * `anterior` y `posterior` son las lecturas con valor vecinas a la fecha ingresada (D08, specs/02):
 * una carga atrasada se compara contra las de esa fecha, no contra la última.
 * - `bloquea`: menor que la anterior o mayor que la posterior; el backend la va a rechazar.
 * - `advierte`: posible error de tipeo; se puede enviar igual.
 */
export function avisoLectura(
  metrica: Metrica,
  valorTexto: string,
  anterior: { valor: string; fecha: string } | null,
  fechaNueva: string,
  posterior: { valor: string; fecha: string } | null = null,
): { tipo: 'bloquea' | 'advierte'; texto: string } | null {
  const valor = Number(valorTexto.replace(',', '.'))
  if (valorTexto.trim() === '' || Number.isNaN(valor)) return null
  const u = metrica === 'HOROMETRO' ? 'h' : 'km'
  if (anterior && valor < Number(anterior.valor)) {
    return { tipo: 'bloquea', texto: `Es menor que la lectura anterior (${anterior.valor} ${u}, ${anterior.fecha}). Revisá si los números están invertidos.` }
  }
  if (posterior && valor > Number(posterior.valor)) {
    return { tipo: 'bloquea', texto: `Ya hay una lectura posterior de ${posterior.valor} ${u} (${posterior.fecha}); esta no puede ser mayor. Revisá el número o la fecha.` }
  }
  if (!anterior) return null
  const previo = Number(anterior.valor)

  const [d, m, resto] = anterior.fecha.split('/')
  const [a, hora] = resto.split(' ')
  const horas = (new Date(fechaNueva).getTime() - new Date(`${a}-${m}-${d}T${hora}`).getTime()) / 3_600_000
  const aumento = valor - previo
  // Un horómetro no puede sumar más horas que las transcurridas; 1500 km por día es un tope generoso para un vehículo
  const tope = metrica === 'HOROMETRO' ? horas : (horas / 24) * 1500
  if (horas > 0 && aumento > tope) {
    return { tipo: 'advierte', texto: `Subió ${aumento.toLocaleString('es-AR')} ${u} desde la lectura anterior, más de lo posible en ese tiempo. Revisá el número antes de enviar.` }
  }
  return null
}
