import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { useSesionVencida, useUsuarioActual } from '@/features/auth/api'
import { hoy } from '@/features/fronts/api'
import { useUnidadesOpciones, type Unidad } from '@/features/machinery/api'
import { ApiError } from '@/shared/api/client'
import { borrarBorrador, guardarBorrador, leerBorrador } from '@/shared/borrador'
import { Campo } from '@/shared/components/Campo'
import { ConfirmacionEnvio, type Guardado } from '@/shared/components/ConfirmacionEnvio'
import { ConnectionBadge } from '@/shared/components/ConnectionBadge'
import { EsperarConsultas } from '@/shared/components/EsperarConsultas'
import { EstadoEnvio } from '@/shared/components/EstadoEnvio'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus'
import { ESTADOS_MATAFUEGO, useRegistrarMatafuego, useUnidadesCargables, type EstadoMatafuego } from './api'
import { SinUnidades } from './SinUnidades'

const control = 'h-12 w-full rounded-md border border-input bg-card px-3 text-base'
type Borrador = { clave: string; id_unidad: string; estado_matafuego: EstadoMatafuego | ''; fecha_revision: string; fecha_vencimiento_carga: string; etiqueta_ilegible: boolean }

/** Pantalla de campo: control mensual del matafuego de una unidad (RF11, D15: todas las unidades activas). */
export function MatafuegoNuevoPage() {
  const yo = useUsuarioActual().data
  const unidades = useUnidadesOpciones()
  const [guardado, setGuardado] = useState<Guardado | null>(null)
  const [vuelta, setVuelta] = useState(0)
  if (!yo) return <p role="status" className="p-4">Cargando…</p>
  if (guardado) return <ConfirmacionEnvio guardado={guardado} otro={() => { setGuardado(null); setVuelta(vuelta + 1) }} ver={{ texto: 'Ir al inicio', ruta: '/' }} />
  return <EsperarConsultas consultas={[unidades]}>{() => <MatafuegoForm key={vuelta} onGuardado={setGuardado} idUsuario={yo.id} unidades={unidades.data!} />}</EsperarConsultas>
}

function MatafuegoForm({ idUsuario, unidades, onGuardado }: { idUsuario: number; unidades: Unidad[]; onGuardado: (g: Guardado) => void }) {
  const online = useOnlineStatus()
  const registrar = useRegistrarMatafuego()
  const sesionVencida = useSesionVencida()
  // Borrador en el equipo (specs/04 T-04.7): cerrar o actualizar la app no pierde lo cargado
  const [d, setD] = useState<Borrador>(() => leerBorrador<Borrador>('matafuego', idUsuario) ?? {
    clave: crypto.randomUUID(), id_unidad: '', estado_matafuego: '', fecha_revision: hoy(), fecha_vencimiento_carga: '', etiqueta_ilegible: false,
  })
  const opciones = useUnidadesCargables(unidades, idUsuario, d.fecha_revision, d.id_unidad)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [borradorOk, setBorradorOk] = useState(true)
  const [incierto, setIncierto] = useState(false)
  // Solo se guarda si el usuario cambió algo: con el estado inicial no hay borrador (ni con StrictMode, que repite efectos)
  const inicial = useRef(d)

  useEffect(() => {
    if (d === inicial.current) return
    setBorradorOk(guardarBorrador('matafuego', idUsuario, d))
  }, [d, idUsuario])

  // D24: con FALTANTE no hay etiqueta; la etiqueta ilegible solo aplica a DESCARGADO y DANADO
  const faltante = d.estado_matafuego === 'FALTANTE'
  const admiteIlegible = d.estado_matafuego === 'DESCARGADO' || d.estado_matafuego === 'DANADO'
  const pideVencimiento = d.estado_matafuego !== '' && !faltante && !(admiteIlegible && d.etiqueta_ilegible)

  const enviar = async (ev: FormEvent) => {
    ev.preventDefault()
    const faltan: Record<string, string> = {}
    if (!d.id_unidad) faltan.id_unidad = 'Elegí la unidad.'
    if (!d.estado_matafuego) faltan.estado_matafuego = 'Elegí el estado del matafuego.'
    if (pideVencimiento && !d.fecha_vencimiento_carga) {
      faltan.fecha_vencimiento_carga = admiteIlegible
        ? 'Indicá el vencimiento de la carga o marcá que la etiqueta no se puede leer.'
        : 'Indicá el vencimiento de la carga (figura en la etiqueta).'
    }
    setErrores(faltan)
    if (Object.keys(faltan).length) return
    setIncierto(false)
    try {
      const r = await registrar.mutateAsync({
        clave: d.clave,
        datos: {
          id_unidad: Number(d.id_unidad), estado_matafuego: d.estado_matafuego, fecha_revision: d.fecha_revision,
          fecha_vencimiento_carga: pideVencimiento ? d.fecha_vencimiento_carga : null,
          etiqueta_ilegible: admiteIlegible && d.etiqueta_ilegible,
        },
      })
      borrarBorrador('matafuego', idUsuario)
      const c = r.data
      onGuardado({
        titulo: r.ya_registrado ? 'Control guardado (ya había llegado).' : 'Control guardado.', numero: c.id,
        detalle: [c.fecha_revision.split('-').reverse().join('/'), c.unidad.nombre, ESTADOS_MATAFUEGO[c.estado],
          c.fecha_vencimiento_carga ? `vence ${c.fecha_vencimiento_carga.split('-').reverse().join('/')}` : c.etiqueta_ilegible ? 'etiqueta ilegible' : null],
        aviso: c.fecha_vencimiento_carga && c.fecha_vencimiento_carga < hoy() ? 'Atención: la carga está vencida. Mantenimiento lo ve en el panel.' : undefined,
      })
    } catch (e) {
      if (e instanceof ApiError && e.code === 'NO_AUTENTICADO') return sesionVencida()
      setIncierto(e instanceof ApiError && e.code === 'SIN_CONEXION')
      if (e instanceof ApiError && Object.keys(e.details).length) setErrores(Object.fromEntries(Object.entries(e.details).map(([k, v]) => [k, v[0]])))
      else if (!(e instanceof ApiError && e.code === 'SIN_CONEXION')) toast.error(e instanceof ApiError ? e.message : 'No se pudo enviar.')
    }
  }

  return (
    <section className="mx-auto grid max-w-md gap-5 text-base">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Control de matafuego</h1>
        <ConnectionBadge />
      </div>
      <form onSubmit={enviar} noValidate className="grid gap-5">
        <Campo id="id_unidad" label="Unidad" error={errores.id_unidad}>
          <select id="id_unidad" className={control} aria-describedby="id_unidad-error" value={d.id_unidad} onChange={(e) => setD({ ...d, id_unidad: e.target.value })}>
            <option value="">Elegí…</option>
            {opciones.map((u) => <option key={u.id} value={u.id}>{u.nombre} · {u.tipo.nombre}</option>)}
          </select>
          {opciones.length === 0 && <SinUnidades />}
        </Campo>

        <fieldset aria-describedby="estado_matafuego-error" className="grid gap-2">
          <legend className="mb-1 text-sm font-medium">Estado</legend>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(ESTADOS_MATAFUEGO).map(([v, t]) => (
              <label key={v} className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-card px-3 font-medium has-[:checked]:border-primary has-[:checked]:bg-secondary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring">
                <input type="radio" name="estado_matafuego" value={v} className="size-5 accent-primary" checked={d.estado_matafuego === v}
                  onChange={() => setD({ ...d, estado_matafuego: v as EstadoMatafuego })} />
                {t}
              </label>
            ))}
          </div>
          {errores.estado_matafuego && <p id="estado_matafuego-error" role="alert" className="text-sm text-danger">{errores.estado_matafuego}</p>}
        </fieldset>

        <Campo id="fecha_revision" label="Fecha de revisión" error={errores.fecha_revision}>
          <Input id="fecha_revision" type="date" max={hoy()} className="h-12 text-base" aria-describedby="fecha_revision-error" value={d.fecha_revision} onChange={(e) => setD({ ...d, fecha_revision: e.target.value })} />
        </Campo>

        {faltante && <p className="rounded-md border border-border bg-card p-3 text-sm">Si falta el matafuego no hay etiqueta: no hace falta el vencimiento. Mantenimiento lo va a ver como alerta.</p>}
        {admiteIlegible && (
          <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-md border border-input bg-card px-3">
            <input type="checkbox" className="size-5 accent-primary" checked={d.etiqueta_ilegible} onChange={(e) => setD({ ...d, etiqueta_ilegible: e.target.checked })} />
            No se puede leer la etiqueta
          </label>
        )}
        {pideVencimiento && (
          <Campo id="fecha_vencimiento_carga" label="Vence la carga" error={errores.fecha_vencimiento_carga}>
            <Input id="fecha_vencimiento_carga" type="date" className="h-12 text-base" aria-describedby="fecha_vencimiento_carga-error" value={d.fecha_vencimiento_carga} onChange={(e) => setD({ ...d, fecha_vencimiento_carga: e.target.value })} />
          </Campo>
        )}
        {pideVencimiento && d.fecha_vencimiento_carga && d.fecha_vencimiento_carga < hoy() && <p className="rounded-md border border-warning p-3 text-sm">⚠ La carga ya está vencida. Se va a marcar en el panel de Mantenimiento.</p>}

        <EstadoEnvio online={online} enviando={registrar.isPending} borradorOk={borradorOk} incierto={incierto} />

        <div className="sticky bottom-0 -mx-4 grid gap-2 border-t border-border bg-background p-4">
          <Button type="submit" className="h-12 text-base" disabled={!online || registrar.isPending}>
            {registrar.isPending ? '↻ Enviando…' : !online ? 'Sin conexión' : incierto ? 'Reintentar' : 'Enviar control'}
          </Button>
          <Button asChild variant="ghost" className="h-11"><Link to="/">Volver</Link></Button>
        </div>
      </form>
    </section>
  )
}
