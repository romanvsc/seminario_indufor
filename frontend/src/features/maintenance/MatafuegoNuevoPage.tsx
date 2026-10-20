import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { hoy } from '@/features/fronts/api'
import type { Unidad } from '@/features/machinery/api'
import { api, ApiError } from '@/shared/api/client'
import type { Paginado } from '@/shared/api/types'
import { Campo } from '@/shared/components/Campo'
import { ConnectionBadge } from '@/shared/components/ConnectionBadge'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus'
import { ESTADOS_MATAFUEGO, useRegistrarMatafuego, type EstadoMatafuego } from './api'

const control = 'h-12 w-full rounded-md border border-input bg-card px-3 text-base'

/** Pantalla de campo: control mensual del matafuego de una unidad (RF11, D15: todas las unidades activas). */
export function MatafuegoNuevoPage() {
  const navigate = useNavigate()
  const online = useOnlineStatus()
  const registrar = useRegistrarMatafuego()
  const unidades = useQuery({
    queryKey: ['machinery', 'opciones'],
    // shortcut: hasta 100 unidades activas; sumar búsqueda si la flota supera ese número
    queryFn: () => api<Paginado<Unidad>>('/machinery?per_page=100').then((r) => r.data),
  })
  const [d, setD] = useState({ id_unidad: '', estado_matafuego: '' as EstadoMatafuego | '', fecha_revision: hoy(), fecha_vencimiento_carga: '' })
  const [errores, setErrores] = useState<Record<string, string>>({})

  const enviar = async (ev: FormEvent) => {
    ev.preventDefault()
    const faltan: Record<string, string> = {}
    if (!d.id_unidad) faltan.id_unidad = 'Elegí la unidad.'
    if (!d.estado_matafuego) faltan.estado_matafuego = 'Elegí el estado del matafuego.'
    if (!d.fecha_vencimiento_carga) faltan.fecha_vencimiento_carga = 'Indicá el vencimiento de la carga (figura en la etiqueta).'
    setErrores(faltan)
    if (Object.keys(faltan).length) return
    try {
      await registrar.mutateAsync({ ...d, id_unidad: Number(d.id_unidad) })
      toast.success(d.fecha_vencimiento_carga < hoy() ? 'Control guardado. Atención: la carga está vencida.' : 'Control guardado.')
      navigate('/')
    } catch (e) {
      if (e instanceof ApiError && Object.keys(e.details).length) setErrores(Object.fromEntries(Object.entries(e.details).map(([k, v]) => [k, v[0]])))
      else toast.error(e instanceof ApiError ? e.message : 'No se pudo enviar.')
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
            {unidades.data?.map((u) => <option key={u.id} value={u.id}>{u.nombre} · {u.tipo.nombre}</option>)}
          </select>
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

        <div className="grid grid-cols-2 gap-3">
          <Campo id="fecha_revision" label="Fecha de revisión" error={errores.fecha_revision}>
            <Input id="fecha_revision" type="date" max={hoy()} className="h-12 text-base" aria-describedby="fecha_revision-error" value={d.fecha_revision} onChange={(e) => setD({ ...d, fecha_revision: e.target.value })} />
          </Campo>
          <Campo id="fecha_vencimiento_carga" label="Vence la carga" error={errores.fecha_vencimiento_carga}>
            <Input id="fecha_vencimiento_carga" type="date" className="h-12 text-base" aria-describedby="fecha_vencimiento_carga-error" value={d.fecha_vencimiento_carga} onChange={(e) => setD({ ...d, fecha_vencimiento_carga: e.target.value })} />
          </Campo>
        </div>
        {d.fecha_vencimiento_carga && d.fecha_vencimiento_carga < hoy() && <p className="rounded-md border border-warning p-3 text-sm">⚠ La carga ya está vencida. Se va a marcar en el panel de Mantenimiento.</p>}
        {!online && <p className="rounded-md border border-warning p-3">⚠ Sin conexión. Enviá cuando vuelva la señal.</p>}

        <div className="sticky bottom-0 -mx-4 grid gap-2 border-t border-border bg-background p-4">
          <Button type="submit" className="h-12 text-base" disabled={!online || registrar.isPending}>{registrar.isPending ? '↻ Enviando…' : !online ? 'Sin conexión' : 'Enviar control'}</Button>
          <Button asChild variant="ghost" className="h-11"><Link to="/">Volver</Link></Button>
        </div>
      </form>
    </section>
  )
}
