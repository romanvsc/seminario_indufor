import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { useSesionVencida, useUsuarioActual } from '@/features/auth/api'
import { useFrentes, type Frente } from '@/features/fronts/api'
import { useUnidadesOpciones, type Unidad } from '@/features/machinery/api'
import { useTiposMadera } from '@/features/production/api'
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
import { ORIGENES, useDeclararViaje } from './api'

/** Fecha y hora local en el formato de <input type="datetime-local">. */
const ahora = () => new Date().toLocaleString('sv-SE').slice(0, 16).replace(' ', 'T')

const esquema = z.object({
  clave: z.string(),
  id_frente_origen: z.string().min(1, 'Elegí el origen.'),
  id_unidad_camion: z.string().min(1, 'Elegí el camión.'),
  destino: z.string().trim().min(1, 'Indicá el destino.').max(150),
  tipo_madera: z.string().min(1, 'Elegí pulpable o aserrable.'),
  volumen_declarado: z.string().trim().regex(/^\d{1,8}([.,]\d{1,2})?$/, 'Indicá las toneladas con hasta 2 decimales.')
    .refine((v) => Number(v.replace(',', '.')) > 0, 'Las toneladas deben ser mayores que cero.'),
  fecha: z.string().min(1, 'Indicá fecha y hora.').refine((f) => f <= ahora(), 'La fecha no puede ser posterior a ahora.'),
  observaciones: z.string().max(2000),
})
type Borrador = z.infer<typeof esquema>
const control = 'h-12 w-full rounded-md border border-input bg-card px-3 text-base'

/** Pantalla de campo del camionero: declaración digital del viaje (RF05). El viaje nace PENDIENTE. */
export function ViajeNuevoPage() {
  const yo = useUsuarioActual().data
  const frentes = useFrentes('activos')
  const tipos = useTiposMadera()
  const unidades = useUnidadesOpciones()
  if (!yo) return <p role="status" className="p-4">Cargando…</p>
  return (
    <EsperarConsultas consultas={[frentes, tipos, unidades]}>
      {() => <ViajeForm idUsuario={yo.id} origenes={frentes.data!.data.filter((f) => ORIGENES.includes(f.nombre))} unidades={unidades.data!} tipos={tipos.data!} />}
    </EsperarConsultas>
  )
}

function ViajeForm({ idUsuario, origenes, unidades, tipos }: { idUsuario: number; origenes: Frente[]; unidades: Unidad[]; tipos: { id: number; nombre: string }[] }) {
  const navigate = useNavigate()
  const online = useOnlineStatus()
  const declarar = useDeclararViaje()
  const sesionVencida = useSesionVencida()
  const [borradorOk, setBorradorOk] = useState(true)
  const [incierto, setIncierto] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [conflicto, setConflicto] = useState(false)
  const borrador = useRef(leerBorrador<Borrador>('viaje', idUsuario)).current
  const { register, handleSubmit, watch, setError, formState } = useForm<Borrador>({
    resolver: zodResolver(esquema),
    mode: 'onTouched',
    defaultValues: borrador ?? {
      clave: crypto.randomUUID(), id_frente_origen: '', id_unidad_camion: '', destino: '', tipo_madera: '', volumen_declarado: '', fecha: ahora(), observaciones: '',
    },
  })
  const e = formState.errors

  useEffect(() => {
    const s = watch((v) => setBorradorOk(guardarBorrador('viaje', idUsuario, v)))
    return () => s.unsubscribe()
  }, [watch, idUsuario])

  const enviar = handleSubmit(async (d) => {
    setErrorGeneral(null)
    setIncierto(false)
    try {
      const r = await declarar.mutateAsync({
        clave: d.clave,
        datos: {
          id_frente_origen: Number(d.id_frente_origen), id_unidad_camion: Number(d.id_unidad_camion), destino: d.destino.trim(),
          tipo_madera: Number(d.tipo_madera), volumen_declarado: d.volumen_declarado.replace(',', '.'), fecha: d.fecha, observaciones: d.observaciones.trim() || null,
        },
      })
      borrarBorrador('viaje', idUsuario)
      toast.success(r.ya_registrado ? 'Viaje declarado (ya había llegado).' : 'Viaje declarado. Queda pendiente hasta que Administración cargue el remito.')
      navigate('/viajes')
    } catch (err) {
      if (err instanceof ApiError && err.code === 'NO_AUTENTICADO') return sesionVencida()
      const sinRespuesta = err instanceof ApiError && err.code === 'SIN_CONEXION'
      setIncierto(sinRespuesta)
      if (sinRespuesta) return
      if (err instanceof ApiError) for (const [campo, msgs] of Object.entries(err.details)) setError(campo as keyof Borrador, { message: msgs[0] })
      setErrorGeneral(err instanceof ApiError ? err.message : 'No se pudo enviar. El borrador sigue guardado en este equipo.')
      setConflicto(err instanceof ApiError && err.code === 'CLAVE_REUTILIZADA')
    }
  })

  return (
    <section className="mx-auto grid max-w-md gap-5 text-base">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Declarar viaje</h1>
        <ConnectionBadge />
      </div>

      <form onSubmit={enviar} noValidate className="grid gap-5">
        <Campo id="id_frente_origen" label="Origen" error={e.id_frente_origen?.message}>
          <select id="id_frente_origen" className={control} aria-invalid={!!e.id_frente_origen} aria-describedby="id_frente_origen-error" {...register('id_frente_origen')}>
            <option value="">Elegí…</option>
            {origenes.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
          </select>
        </Campo>

        <Campo id="destino" label="Destino" error={e.destino?.message}>
          <Input id="destino" className="h-12 text-base" autoComplete="on" aria-invalid={!!e.destino} aria-describedby="destino-error" {...register('destino')} />
        </Campo>

        <Campo id="id_unidad_camion" label="Camión" error={e.id_unidad_camion?.message}>
          <select id="id_unidad_camion" className={control} aria-invalid={!!e.id_unidad_camion} aria-describedby="id_unidad_camion-error" {...register('id_unidad_camion')}>
            <option value="">Elegí…</option>
            {unidades.map((u) => <option key={u.id} value={u.id}>{u.nombre}{u.dominio_patente ? ` · ${u.dominio_patente}` : ''}</option>)}
          </select>
        </Campo>

        <fieldset aria-describedby="tipo_madera-error" className="grid gap-2">
          <legend className="mb-1 text-sm font-medium">Tipo de madera</legend>
          <div className="grid grid-cols-2 gap-3">
            {tipos.map((t) => (
              <label key={t.id} className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-card px-3 font-medium capitalize has-[:checked]:border-primary has-[:checked]:bg-secondary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring">
                <input type="radio" value={t.id} className="size-5 accent-primary" {...register('tipo_madera')} />
                {t.nombre}
              </label>
            ))}
          </div>
          {e.tipo_madera && <p id="tipo_madera-error" role="alert" className="text-sm text-danger">{e.tipo_madera.message}</p>}
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <Campo id="volumen_declarado" label="Toneladas" error={e.volumen_declarado?.message}>
            <Input id="volumen_declarado" inputMode="decimal" autoComplete="off" className="h-12 text-base" aria-invalid={!!e.volumen_declarado} aria-describedby="volumen_declarado-error" {...register('volumen_declarado')} />
          </Campo>
          <Campo id="fecha" label="Fecha y hora" error={e.fecha?.message}>
            <Input id="fecha" type="datetime-local" max={ahora()} className="h-12 text-base" aria-invalid={!!e.fecha} aria-describedby="fecha-error" {...register('fecha')} />
          </Campo>
        </div>

        <Campo id="observaciones" label="Observaciones (opcional)" error={e.observaciones?.message}>
          <textarea id="observaciones" rows={2} className="w-full rounded-md border border-input bg-card p-3 text-base" {...register('observaciones')} />
        </Campo>

        <div aria-live="polite" className="grid gap-2">
          {errorGeneral && <p role="alert" className="rounded-md border border-danger p-3 text-danger">{errorGeneral}</p>}
          {conflicto && <DescartarBorrador tipo="viaje" idUsuario={idUsuario} verGuardados="/viajes" />}
        </div>
        <EstadoEnvio online={online} enviando={formState.isSubmitting} borradorOk={borradorOk} incierto={incierto} />

        <div className="sticky bottom-0 -mx-4 grid gap-2 border-t border-border bg-background p-4">
          <Button type="submit" className="h-12 text-base" disabled={!online || formState.isSubmitting}>
            {formState.isSubmitting ? '↻ Enviando…' : !online ? 'Sin conexión' : incierto ? 'Reintentar' : 'Declarar viaje'}
          </Button>
          <Button asChild variant="ghost" className="h-11"><Link to="/viajes">Volver a mis viajes</Link></Button>
        </div>
      </form>
    </section>
  )
}
