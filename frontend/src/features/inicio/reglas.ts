import type { Pendientes } from './api'

/**
 * Reglas de presentación del inicio: separan lo vencido (crítico) de lo que falló o requiere decisión (atención)
 * y de lo que solo hay que seguir (seguimiento). El backend da cantidades y contexto; acá se decide la gravedad.
 */
export type Nivel = 'critico' | 'atencion' | 'seguimiento'
export type Clave = keyof Pendientes
export type Aviso = { clave: Clave; nivel: Nivel; titulo: string; area: string; contexto: string; ruta: string }
export type Indicador = { clave: Clave; titulo: string; valor: number; subtitulo: string; nivel: Nivel | 'ok'; ruta: string }

const ORDEN: Record<Nivel, number> = { critico: 0, atencion: 1, seguimiento: 2 }
export const fecha = (iso: string) => iso.slice(0, 10).split('-').reverse().slice(0, 2).join('/')
const fechaLarga = (iso: string) => iso.slice(0, 10).split('-').reverse().join('/')
const plural = (n: number, uno: string, varios: string) => (n === 1 ? uno : varios.replace('#', String(n)))
const lista = (nombres: string[], total: number) => nombres.join(', ') + (total > nombres.length ? ` y ${total - nombres.length} más` : '')

export function avisos(p: Pendientes): Aviso[] {
  const a: Aviso[] = []
  const m = p.matafuegos_vencidos
  if (m?.cantidad) {
    a.push({
      clave: 'matafuegos_vencidos', nivel: 'critico', area: 'Seguridad', ruta: '/mantenimiento',
      titulo: plural(m.cantidad, '1 matafuego con la carga vencida', '# matafuegos con la carga vencida'),
      contexto: m.cantidad === 1 && m.items[0] ? `${m.items[0].nombre}, venció el ${fecha(m.items[0].vencimiento)}` : lista(m.items.map((u) => u.nombre), m.cantidad),
    })
  }
  const c = p.consumos_periodo_vencido
  if (c) {
    // D21: el lote vigente distingue "no importado" de "importado con filas con error"
    if (!c.lote) {
      a.push({
        clave: 'consumos_periodo_vencido', nivel: c.plazo_vencido ? 'critico' : 'seguimiento', area: 'Integración', ruta: '/integracion',
        titulo: `Falta importar el consolidado de consumos de ${c.periodo}`,
        contexto: c.plazo_vencido ? `El plazo venció el ${fechaLarga(c.fecha_limite)}` : `Fecha límite: ${fechaLarga(c.fecha_limite)}`,
      })
    } else if (c.lote.estado === 'PARCIAL') {
      a.push({
        clave: 'consumos_periodo_vencido', nivel: 'atencion', area: 'Integración', ruta: '/integracion',
        titulo: `El consolidado de ${c.periodo} se importó incompleto`,
        contexto: `${plural(c.lote.filas_con_error, '1 fila con error', '# filas con error')} · ${plural(c.lote.unidades, '1 unidad importada', '# unidades importadas')}`,
      })
    }
  }
  const f = p.fallas_abiertas
  if (f?.cantidad) {
    const primera = f.items[0]
    a.push({
      clave: 'fallas_abiertas', nivel: 'atencion', area: 'Mantenimiento', ruta: '/mantenimiento',
      titulo: plural(f.cantidad, '1 falla abierta', '# fallas abiertas'),
      contexto: primera ? `${primera.unidad}${primera.frente ? ` (${primera.frente})` : ''}, ${f.cantidad === 1 ? 'desde' : 'la más antigua del'} ${fecha(primera.fecha)}` : 'Sin atender',
    })
  }
  const l = p.lecturas_sin_exportar
  if (l?.cantidad) {
    // RF12: la exportación es automática; si hay pendientes, el envío falló y conviene revisarlo (reintentar es excepcional)
    a.push({
      clave: 'lecturas_sin_exportar', nivel: 'atencion', area: 'Integración', ruta: '/integracion',
      titulo: plural(l.cantidad, '1 lectura sin enviar al sistema de gastos', '# lecturas sin enviar al sistema de gastos'),
      contexto: `Revisar el envío automático${l.items[0] ? ` · la más antigua del ${fecha(l.items[0].fecha)}` : ''}`,
    })
  }
  const s = p.correcciones_abiertas
  if (s?.cantidad) {
    a.push({
      clave: 'correcciones_abiertas', nivel: 'atencion', area: 'Logística', ruta: '/correcciones',
      titulo: plural(s.cantidad, '1 solicitud de corrección abierta', '# solicitudes de corrección abiertas'),
      contexto: s.items[0] ? `Viaje #${s.items[0].viaje}, desde el ${fecha(s.items[0].fecha)}` : 'Remito con diferencias',
    })
  }
  const mc = p.mis_viajes_en_correccion
  if (mc?.cantidad) {
    a.push({
      clave: 'mis_viajes_en_correccion', nivel: 'atencion', area: 'Logística', ruta: '/viajes?estado=CORRECCION_SOLICITADA',
      titulo: plural(mc.cantidad, '1 viaje tuyo con corrección solicitada', '# viajes tuyos con corrección solicitada'),
      contexto: mc.items[0] ? `Viaje #${mc.items[0].id} a ${mc.items[0].destino}` : 'Revisá la diferencia con el remito',
    })
  }
  const v = p.viajes_sin_remito
  if (v?.cantidad) {
    a.push({
      clave: 'viajes_sin_remito', nivel: 'seguimiento', area: 'Logística', ruta: '/viajes?estado=PENDIENTE',
      titulo: plural(v.cantidad, '1 viaje espera remito', '# viajes esperan remito'),
      contexto: v.items[0] ? `${v.cantidad === 1 ? 'Del' : 'El más antiguo, del'} ${fecha(v.items[0].fecha)} desde ${v.items[0].origen}` : 'Validación pendiente',
    })
  }
  const u = p.unidades_sin_lectura_semana
  if (u?.cantidad) {
    a.push({
      clave: 'unidades_sin_lectura_semana', nivel: 'seguimiento', area: 'Mantenimiento', ruta: '/lecturas/nueva',
      titulo: plural(u.cantidad, '1 unidad sin lectura desde el lunes', '# unidades sin lectura desde el lunes'),
      contexto: lista(u.items.map((x) => x.nombre), u.cantidad),
    })
  }
  const mp = p.mis_viajes_pendientes
  if (mp?.cantidad) {
    a.push({
      clave: 'mis_viajes_pendientes', nivel: 'seguimiento', area: 'Logística', ruta: '/viajes?estado=PENDIENTE',
      titulo: plural(mp.cantidad, '1 viaje tuyo espera el remito', '# viajes tuyos esperan el remito'),
      contexto: mp.items[0] ? `Viaje #${mp.items[0].id} a ${mp.items[0].destino}` : 'Validación pendiente',
    })
  }
  return a.sort((x, y) => ORDEN[x.nivel] - ORDEN[y.nivel])
}

// Tarjetas de la cabecera, en el orden de la referencia; se muestran hasta 4 de las que el rol puede ver
const TARJETAS: { clave: Clave; titulo: string; ruta: string; subtitulo: (n: number) => string; nivel: Nivel }[] = [
  { clave: 'viajes_sin_remito', titulo: 'Viajes sin remito', ruta: '/viajes?estado=PENDIENTE', nivel: 'seguimiento', subtitulo: (n) => (n ? 'Documentación pendiente' : 'Todo cotejado') },
  { clave: 'lecturas_sin_exportar', titulo: 'Lecturas por exportar', ruta: '/integracion', nivel: 'atencion', subtitulo: (n) => (n ? 'Pendientes de envío' : 'Envío al día') },
  { clave: 'fallas_abiertas', titulo: 'Fallas abiertas', ruta: '/mantenimiento', nivel: 'atencion', subtitulo: (n) => (n ? 'En seguimiento' : 'Sin fallas') },
  { clave: 'matafuegos_vencidos', titulo: 'Matafuegos vencidos', ruta: '/mantenimiento', nivel: 'critico', subtitulo: (n) => (n ? 'Requiere revisión' : 'Todos vigentes') },
  { clave: 'unidades_sin_lectura_semana', titulo: 'Sin lectura semanal', ruta: '/lecturas/nueva', nivel: 'seguimiento', subtitulo: (n) => (n ? 'Unidades por leer' : 'Todas leídas') },
  { clave: 'correcciones_abiertas', titulo: 'Correcciones abiertas', ruta: '/correcciones', nivel: 'atencion', subtitulo: (n) => (n ? 'Por resolver' : 'Sin correcciones') },
  { clave: 'mis_viajes_en_correccion', titulo: 'Viajes en corrección', ruta: '/viajes?estado=CORRECCION_SOLICITADA', nivel: 'atencion', subtitulo: (n) => (n ? 'Revisar diferencia' : 'Sin correcciones') },
  { clave: 'mis_viajes_pendientes', titulo: 'Viajes sin remito', ruta: '/viajes?estado=PENDIENTE', nivel: 'seguimiento', subtitulo: (n) => (n ? 'Esperando remito' : 'Todo cotejado') },
]

export function indicadores(p: Pendientes): Indicador[] {
  return TARJETAS.flatMap((t) => {
    const dato = p[t.clave] as { cantidad: number } | undefined
    if (!dato) return []
    return [{ clave: t.clave, titulo: t.titulo, valor: dato.cantidad, subtitulo: t.subtitulo(dato.cantidad), nivel: dato.cantidad ? t.nivel : 'ok' as const, ruta: t.ruta }]
  }).slice(0, 4)
}
