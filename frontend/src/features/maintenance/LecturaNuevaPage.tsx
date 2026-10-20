import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useUsuarioActual } from '@/features/auth/api'
import type { Unidad } from '@/features/machinery/api'
import { api, ApiError } from '@/shared/api/client'
import type { Paginado } from '@/shared/api/types'
import { borrarBorrador, guardarBorrador, leerBorrador } from '@/shared/borrador'
import { Campo } from '@/shared/components/Campo'
import { ConnectionBadge } from '@/shared/components/ConnectionBadge'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus'
import { UNIDAD_METRICA, useRegistrarLectura, useUltimaLectura } from './api'
import { avisoLectura } from './avisoLectura'

const ahora = () => new Date().toLocaleString('sv-SE').slice(0, 16).replace(' ', 'T')
const control = 'h-12 w-full rounded-md border border-input bg-card px-3 text-base'
type Borrador = { clave: string; id_unidad: string; fecha_lectura: string; valor: string; tiene_falla: boolean; detalle_falla: string }

/** Pantalla de campo: lectura semanal de horómetro o kilometraje (RF09) con falla opcional (RF10). */
export function LecturaNuevaPage() {
  const yo = useUsuarioActual().data
  const unidades = useQuery({
    queryKey: ['machinery', 'opciones'],
    // shortcut: hasta 100 unidades activas; sumar búsqueda si la flota supera ese número
    queryFn: () => api<Paginado<Unidad>>('/machinery?per_page=100').then((r) => r.data),
  })
  if (!yo || !unidades.data) return <p role="status" className="p-4">Cargando…</p>
  return <LecturaForm idUsuario={yo.id} unidades={unidades.data} />
}

function LecturaForm({ idUsuario, unidades }: { idUsuario: number; unidades: Unidad[] }) {
  const navigate = useNavigate()
  const online = useOnlineStatus()
  const registrar = useRegistrarLectura()
  const [d, setD] = useState<Borrador>(() => leerBorrador<Borrador>('lectura', idUsuario) ?? {
    clave: crypto.randomUUID(), id_unidad: '', fecha_lectura: ahora(), valor: '', tiene_falla: false, detalle_falla: '',
  })
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const ultima = useUltimaLectura(d.id_unidad)
  const metrica = ultima.data?.metrica
  const aviso = metrica ? avisoLectura(metrica, d.valor, ultima.data?.anterior ?? null, d.fecha_lectura) : null
  const primerRender = useRef(true)

  // Cada cambio queda en el equipo: si se corta la señal o se cierra la app, la lectura no se pierde
  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false
      return
    }
    guardarBorrador('lectura', idUsuario, d)
  }, [d, idUsuario])
  const cambiar = (c: Partial<Borrador>) => setD({ ...d, ...c })

  const enviar = async (ev: FormEvent) => {
    ev.preventDefault()
    setErrorGeneral(null)
    const faltan: Record<string, string> = {}
    if (!d.id_unidad) faltan.id_unidad = 'Elegí la unidad.'
    if (d.valor.trim() === '' && !d.tiene_falla) faltan.valor = metrica === 'KILOMETRAJE' ? 'Indicá el kilometraje.' : 'Indicá la lectura del horómetro.'
    if (d.valor.trim() !== '' && !(metrica === 'KILOMETRAJE' ? /^\d{1,10}$/ : /^\d{1,10}([.,]\d{1,2})?$/).test(d.valor.trim())) {
      faltan.valor = metrica === 'KILOMETRAJE' ? 'Kilómetros enteros, sin puntos.' : 'Usá solo números, con hasta 2 decimales.'
    }
    if (d.tiene_falla && !d.detalle_falla.trim()) faltan.detalle_falla = 'Describí la falla para que Mantenimiento pueda atenderla.'
    if (aviso?.tipo === 'bloquea') faltan.valor = aviso.texto
    setErrores(faltan)
    if (Object.keys(faltan).length) return

    const valor = d.valor.trim() === '' ? null : d.valor.trim().replace(',', '.')
    try {
      await registrar.mutateAsync({
        clave: d.clave,
        datos: {
          id_unidad: Number(d.id_unidad), fecha_lectura: d.fecha_lectura, tiene_falla: d.tiene_falla, detalle_falla: d.tiene_falla ? d.detalle_falla.trim() : null,
          horometro_actual: metrica === 'HOROMETRO' ? valor : null, kilometraje_actual: metrica === 'KILOMETRAJE' && valor !== null ? Number(valor) : null,
        },
      })
      borrarBorrador('lectura', idUsuario)
      toast.success(d.tiene_falla ? 'Lectura guardada. La falla quedó avisada a Mantenimiento.' : 'Lectura guardada.')
      navigate('/')
    } catch (e) {
      if (e instanceof ApiError && Object.keys(e.details).length) {
        setErrores(Object.fromEntries(Object.entries(e.details).map(([k, v]) => [k === 'horometro_actual' || k === 'kilometraje_actual' ? 'valor' : k, v[0]])))
      }
      setErrorGeneral(e instanceof ApiError ? e.message : 'No se pudo enviar. El borrador sigue guardado en este equipo.')
    }
  }

  return (
    <section className="mx-auto grid max-w-md gap-5 text-base">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Lectura semanal</h1>
        <ConnectionBadge />
      </div>

      <form onSubmit={enviar} noValidate className="grid gap-5">
        <Campo id="id_unidad" label="Unidad" error={errores.id_unidad}>
          <select id="id_unidad" className={control} aria-describedby="id_unidad-error" value={d.id_unidad} onChange={(e) => cambiar({ id_unidad: e.target.value, valor: '' })}>
            <option value="">Elegí…</option>
            {unidades.map((u) => <option key={u.id} value={u.id}>{u.nombre} · {u.tipo.nombre}</option>)}
          </select>
        </Campo>

        {d.id_unidad && ultima.isPending && <p role="status">Buscando la última lectura…</p>}
        {metrica && (
          <>
            <p className="rounded-md border border-border bg-card p-3 text-sm">
              {ultima.data?.anterior
                ? <>Última lectura: <strong className="tabular-nums">{ultima.data.anterior.valor} {UNIDAD_METRICA[metrica]}</strong> ({ultima.data.anterior.fecha})</>
                : 'Es la primera lectura de esta unidad.'}
            </p>

            <Campo id="valor" label={metrica === 'HOROMETRO' ? 'Horómetro (horas)' : 'Kilometraje (km)'} error={errores.valor}>
              <Input id="valor" inputMode={metrica === 'HOROMETRO' ? 'decimal' : 'numeric'} autoComplete="off" className="h-12 text-lg tabular-nums"
                aria-invalid={!!errores.valor || aviso?.tipo === 'bloquea'} aria-describedby="valor-error valor-aviso"
                value={d.valor} onChange={(e) => cambiar({ valor: e.target.value })} />
            </Campo>
            <div aria-live="assertive" id="valor-aviso">
              {aviso && !errores.valor && (
                <p className={`rounded-md border p-3 text-sm ${aviso.tipo === 'bloquea' ? 'border-danger text-danger' : 'border-warning'}`}>⚠ {aviso.texto}</p>
              )}
            </div>
          </>
        )}

        <Campo id="fecha_lectura" label="Fecha y hora de la lectura" error={errores.fecha_lectura}>
          <Input id="fecha_lectura" type="datetime-local" max={ahora()} className="h-12 text-base" aria-describedby="fecha_lectura-error" value={d.fecha_lectura} onChange={(e) => cambiar({ fecha_lectura: e.target.value })} />
        </Campo>

        <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-md border border-input bg-card px-3 has-[:checked]:border-danger">
          <input type="checkbox" className="size-5 accent-primary" checked={d.tiene_falla} onChange={(e) => cambiar({ tiene_falla: e.target.checked })} />
          Hay una falla en el instrumento o la máquina
        </label>
        {d.tiene_falla && (
          <Campo id="detalle_falla" label="¿Qué falla?" error={errores.detalle_falla}>
            <textarea id="detalle_falla" rows={3} className="w-full rounded-md border border-input bg-card p-3 text-base" aria-describedby="detalle_falla-error"
              placeholder="Ej.: el display del horómetro no enciende" value={d.detalle_falla} onChange={(e) => cambiar({ detalle_falla: e.target.value })} />
            <span className="text-sm text-soft">Si el instrumento no funciona, podés dejar la lectura vacía.</span>
          </Campo>
        )}

        <div aria-live="polite" className="grid gap-2">
          {errorGeneral && <p role="alert" className="rounded-md border border-danger p-3 text-danger">{errorGeneral}</p>}
          {!online && <p className="rounded-md border border-warning p-3">⚠ Sin conexión. El borrador queda guardado en este equipo; enviá cuando vuelva la señal.</p>}
        </div>

        <div className="sticky bottom-0 -mx-4 grid gap-2 border-t border-border bg-background p-4">
          <Button type="submit" className="h-12 text-base" disabled={!online || registrar.isPending || aviso?.tipo === 'bloquea'}>
            {registrar.isPending ? '↻ Enviando…' : !online ? 'Sin conexión' : 'Enviar lectura'}
          </Button>
          <Button asChild variant="ghost" className="h-11"><Link to="/">Volver</Link></Button>
        </div>
      </form>
    </section>
  )
}
