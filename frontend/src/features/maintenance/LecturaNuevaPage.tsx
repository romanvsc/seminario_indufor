import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useSesionVencida, useUsuarioActual } from '@/features/auth/api'
import { useUnidadesOpciones, type Unidad } from '@/features/machinery/api'
import { ApiError } from '@/shared/api/client'
import { borrarBorrador, guardarBorrador, leerBorrador } from '@/shared/borrador'
import { Campo } from '@/shared/components/Campo'
import { ConnectionBadge } from '@/shared/components/ConnectionBadge'
import { DescartarBorrador } from '@/shared/components/DescartarBorrador'
import { EsperarConsultas } from '@/shared/components/EsperarConsultas'
import { EstadoEnvio } from '@/shared/components/EstadoEnvio'
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
  const unidades = useUnidadesOpciones()
  if (!yo) return <p role="status" className="p-4">Cargando…</p>
  return <EsperarConsultas consultas={[unidades]}>{() => <LecturaForm idUsuario={yo.id} unidades={unidades.data!} />}</EsperarConsultas>
}

function LecturaForm({ idUsuario, unidades }: { idUsuario: number; unidades: Unidad[] }) {
  const navigate = useNavigate()
  const online = useOnlineStatus()
  const registrar = useRegistrarLectura()
  const sesionVencida = useSesionVencida()
  const [borradorOk, setBorradorOk] = useState(true)
  const [incierto, setIncierto] = useState(false)
  const [d, setD] = useState<Borrador>(() => leerBorrador<Borrador>('lectura', idUsuario) ?? {
    clave: crypto.randomUUID(), id_unidad: '', fecha_lectura: ahora(), valor: '', tiene_falla: false, detalle_falla: '',
  })
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [conflicto, setConflicto] = useState(false)
  const ultima = useUltimaLectura(d.id_unidad, d.fecha_lectura)
  // La métrica sale de la unidad elegida: si falla la consulta de referencias, igual se puede cargar
  const metrica = unidades.find((u) => String(u.id) === d.id_unidad)?.tipo.metrica
  const aviso = metrica && ultima.data ? avisoLectura(metrica, d.valor, ultima.data.anterior, d.fecha_lectura, ultima.data.posterior) : null
  const primerRender = useRef(true)

  // Cada cambio queda en el equipo: si se corta la señal o se cierra la app, la lectura no se pierde
  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false
      return
    }
    setBorradorOk(guardarBorrador('lectura', idUsuario, d))
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
    setIncierto(false)
    try {
      const r = await registrar.mutateAsync({
        clave: d.clave,
        datos: {
          id_unidad: Number(d.id_unidad), fecha_lectura: d.fecha_lectura, tiene_falla: d.tiene_falla, detalle_falla: d.tiene_falla ? d.detalle_falla.trim() : null,
          horometro_actual: metrica === 'HOROMETRO' ? valor : null, kilometraje_actual: metrica === 'KILOMETRAJE' && valor !== null ? Number(valor) : null,
        },
      })
      borrarBorrador('lectura', idUsuario)
      toast.success(r.ya_registrado ? 'Lectura guardada (ya había llegado).' : d.tiene_falla ? 'Lectura guardada. La falla quedó avisada a Mantenimiento.' : 'Lectura guardada.')
      navigate('/')
    } catch (e) {
      if (e instanceof ApiError && e.code === 'NO_AUTENTICADO') return sesionVencida()
      const sinRespuesta = e instanceof ApiError && e.code === 'SIN_CONEXION'
      setIncierto(sinRespuesta)
      if (sinRespuesta) return
      if (e instanceof ApiError && Object.keys(e.details).length) {
        setErrores(Object.fromEntries(Object.entries(e.details).map(([k, v]) => [k === 'horometro_actual' || k === 'kilometraje_actual' ? 'valor' : k, v[0]])))
      }
      setErrorGeneral(e instanceof ApiError ? e.message : 'No se pudo enviar. El borrador sigue guardado en este equipo.')
      setConflicto(e instanceof ApiError && e.code === 'CLAVE_REUTILIZADA')
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

        {d.id_unidad && ultima.isPending && <p role="status">Buscando las lecturas de esa fecha…</p>}
        {d.id_unidad && ultima.isError && (
          <p className="rounded-md border border-warning p-3 text-sm">
            ⚠ No se pudo verificar contra las lecturas anteriores; el sistema lo va a validar al enviar.{' '}
            <button type="button" className="underline" onClick={() => ultima.refetch()}>Reintentar</button>
          </p>
        )}
        {metrica && (
          <>
            {ultima.data && (
              <p className="rounded-md border border-border bg-card p-3 text-sm">
                {ultima.data.anterior
                  ? <>Lectura anterior a esa fecha: <strong className="tabular-nums">{ultima.data.anterior.valor} {UNIDAD_METRICA[metrica]}</strong> ({ultima.data.anterior.fecha})</>
                  : 'No hay lecturas anteriores a esa fecha.'}
                {ultima.data.posterior && (
                  <span className="block">Lectura posterior: <strong className="tabular-nums">{ultima.data.posterior.valor} {UNIDAD_METRICA[metrica]}</strong> ({ultima.data.posterior.fecha})</span>
                )}
              </p>
            )}

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
          {conflicto && <DescartarBorrador tipo="lectura" idUsuario={idUsuario} verGuardados="/" />}
        </div>
        <EstadoEnvio online={online} enviando={registrar.isPending} borradorOk={borradorOk} incierto={incierto} />

        <div className="sticky bottom-0 -mx-4 grid gap-2 border-t border-border bg-background p-4">
          <Button type="submit" className="h-12 text-base" disabled={!online || registrar.isPending || aviso?.tipo === 'bloquea'}>
            {registrar.isPending ? '↻ Enviando…' : !online ? 'Sin conexión' : incierto ? 'Reintentar' : 'Enviar lectura'}
          </Button>
          <Button asChild variant="ghost" className="h-11"><Link to="/">Volver</Link></Button>
        </div>
      </form>
    </section>
  )
}
