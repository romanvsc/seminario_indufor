import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { useUsuarioActual } from '@/features/auth/api'
import { hoy, useFrentes, type Frente } from '@/features/fronts/api'
import type { Unidad } from '@/features/machinery/api'
import { api, ApiError } from '@/shared/api/client'
import type { Paginado } from '@/shared/api/types'
import { Campo } from '@/shared/components/Campo'
import { ConnectionBadge } from '@/shared/components/ConnectionBadge'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus'
import { useMisAsignacionesVigentes, useRegistrarParte, useSubirFoto, useTiposMadera } from './api'
import { borrarBorrador, guardarBorrador, leerBorrador } from '@/shared/borrador'

const cantidad = z.string().trim().regex(/^$|^\d{1,8}([.,]\d{1,2})?$/, 'Usá solo números, con hasta 2 decimales.')
const esquema = z
  .object({
    clave: z.string(),
    id_frente: z.string().min(1, 'Elegí el frente.'),
    id_unidad: z.string().min(1, 'Elegí la máquina.'),
    tipo_madera: z.string().min(1, 'Elegí pulpable o aserrable.'),
    fecha_registro: z.string().min(1, 'Indicá la fecha.').refine((f) => f <= hoy(), 'La fecha no puede ser posterior a hoy.'),
    cantidad_toneladas: cantidad,
    metros_cubicos: cantidad,
    observaciones: z.string().max(2000),
  })
  .refine((d) => d.cantidad_toneladas !== '' || d.metros_cubicos !== '', { path: ['cantidad_toneladas'], message: 'Indicá toneladas o metros cúbicos.' })

type Borrador = z.infer<typeof esquema>

const numero = (v: string) => (v === '' ? null : v.replace(',', '.'))
const control = 'h-12 w-full rounded-md border border-input bg-card px-3 text-base'

/** Pantalla de campo: parte diario de producción (RF01–RF04). Una columna, poca escritura, borrador local. */
export function ParteNuevoPage() {
  const yo = useUsuarioActual().data
  const asignaciones = useMisAsignacionesVigentes(yo?.id)
  const frentes = useFrentes('activos')
  const tipos = useTiposMadera()
  const unidades = useQuery({
    queryKey: ['machinery', 'opciones'],
    // shortcut: hasta 100 unidades activas; sumar búsqueda si la flota supera ese número
    queryFn: () => api<Paginado<Unidad>>('/machinery?per_page=100').then((r) => r.data),
  })

  if (!yo || !asignaciones.data || !frentes.data || !tipos.data || !unidades.data) {
    return <p role="status" className="p-4">Cargando…</p>
  }
  const misFrentes = frentes.data.data.filter((f) => asignaciones.data.some((a) => a.frente.id === f.id))
  if (misFrentes.length === 0) {
    return <p role="alert" className="p-4">No estás asignado a ningún frente hoy. Pedile a Administración que te asigne para poder cargar producción.</p>
  }
  return <ParteForm idUsuario={yo.id} frentes={misFrentes} unidades={unidades.data} tipos={tipos.data} />
}

function ParteForm({ idUsuario, frentes, unidades, tipos }: { idUsuario: number; frentes: Frente[]; unidades: Unidad[]; tipos: { id: number; nombre: string }[] }) {
  const navigate = useNavigate()
  const online = useOnlineStatus()
  const registrar = useRegistrarParte()
  const subirFoto = useSubirFoto()
  const foto = useRef<HTMLInputElement>(null)
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const borrador = useRef(leerBorrador<Borrador>('parte', idUsuario)).current

  const { register, handleSubmit, watch, setError, formState } = useForm<Borrador>({
    resolver: zodResolver(esquema),
    mode: 'onTouched',
    defaultValues: borrador ?? {
      clave: crypto.randomUUID(),
      id_frente: frentes.length === 1 ? String(frentes[0].id) : '',
      id_unidad: '',
      tipo_madera: '',
      fecha_registro: hoy(),
      cantidad_toneladas: '',
      metros_cubicos: '',
      observaciones: '',
    },
  })
  const e = formState.errors
  const idFrente = watch('id_frente')
  const frente = frentes.find((f) => String(f.id) === idFrente)

  // Cada cambio queda en el equipo: si se corta la señal o se cierra la app, el parte no se pierde
  useEffect(() => {
    const s = watch((v) => guardarBorrador('parte', idUsuario, v))
    return () => s.unsubscribe()
  }, [watch, idUsuario])

  const enviar = handleSubmit(async (d) => {
    setErrorGeneral(null)
    try {
      const parte = await registrar.mutateAsync({
        clave: d.clave,
        datos: {
          id_frente: Number(d.id_frente), id_unidad: Number(d.id_unidad), tipo_madera: Number(d.tipo_madera), fecha_registro: d.fecha_registro,
          cantidad_toneladas: numero(d.cantidad_toneladas), metros_cubicos: numero(d.metros_cubicos), observaciones: d.observaciones.trim() || null,
        },
      })
      borrarBorrador('parte', idUsuario)
      const archivo = foto.current?.files?.[0]
      if (archivo) {
        try {
          await subirFoto.mutateAsync({ id: parte.id, foto: archivo })
        } catch {
          toast.warning('El parte se guardó, pero la foto no se pudo subir. Adjuntala desde el listado.')
          return navigate('/produccion')
        }
      }
      toast.success('Parte guardado.')
      navigate('/produccion')
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.details).length) {
        for (const [campo, msgs] of Object.entries(err.details)) setError(campo as keyof Borrador, { message: msgs[0] })
      }
      setErrorGeneral(err instanceof ApiError ? err.message : 'No se pudo enviar. El borrador sigue guardado en este equipo.')
    }
  })

  const enOtros = unidades.filter((u) => u.frente?.id !== frente?.id)
  const enFrente = unidades.filter((u) => frente && u.frente?.id === frente.id)

  return (
    <section className="mx-auto grid max-w-md gap-5 text-base">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Parte de producción</h1>
        <ConnectionBadge />
      </div>

      <form onSubmit={enviar} noValidate className="grid gap-5">
        <Campo id="id_frente" label="Frente" error={e.id_frente?.message}>
          <select id="id_frente" className={control} aria-invalid={!!e.id_frente} aria-describedby="id_frente-error" {...register('id_frente')}>
            <option value="">Elegí…</option>
            {frentes.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
          </select>
        </Campo>
        {frente && (
          <p className="text-sm text-soft">
            {frente.modalidad === 'CONSOLIDADA' ? 'Carga consolidada del frente (encargado).' : 'Carga individual: quedás como operario productor.'}
          </p>
        )}

        <Campo id="id_unidad" label="Máquina" error={e.id_unidad?.message}>
          <select id="id_unidad" className={control} aria-invalid={!!e.id_unidad} aria-describedby="id_unidad-error" {...register('id_unidad')}>
            <option value="">Elegí…</option>
            {enFrente.length > 0 && <optgroup label="En este frente">{enFrente.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}</optgroup>}
            <optgroup label={enFrente.length > 0 ? 'Otras' : 'Máquinas'}>{enOtros.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}</optgroup>
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

        <Campo id="fecha_registro" label="Jornada" error={e.fecha_registro?.message}>
          <Input id="fecha_registro" type="date" max={hoy()} className="h-12 text-base" aria-invalid={!!e.fecha_registro} aria-describedby="fecha_registro-error" {...register('fecha_registro')} />
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo id="cantidad_toneladas" label="Toneladas" error={e.cantidad_toneladas?.message}>
            <Input id="cantidad_toneladas" inputMode="decimal" autoComplete="off" className="h-12 text-base" aria-invalid={!!e.cantidad_toneladas} aria-describedby="cantidad_toneladas-error" {...register('cantidad_toneladas')} />
          </Campo>
          <Campo id="metros_cubicos" label="Metros cúbicos" error={e.metros_cubicos?.message}>
            <Input id="metros_cubicos" inputMode="decimal" autoComplete="off" className="h-12 text-base" aria-invalid={!!e.metros_cubicos} aria-describedby="metros_cubicos-error" {...register('metros_cubicos')} />
          </Campo>
        </div>
        <p className="-mt-3 text-sm text-soft">Completá al menos una. No se suman ni se convierten entre sí.</p>

        <Campo id="foto" label="Foto de la planilla o el monitor (opcional)">
          <input id="foto" ref={foto} type="file" accept="image/*" capture="environment" className="text-base file:mr-3 file:min-h-11 file:rounded-md file:border file:border-input file:bg-card file:px-3" />
        </Campo>

        <Campo id="observaciones" label="Observaciones (opcional)" error={e.observaciones?.message}>
          <textarea id="observaciones" rows={3} className="w-full rounded-md border border-input bg-card p-3 text-base" placeholder="Clima, detenciones, ausencias…" {...register('observaciones')} />
        </Campo>

        <div aria-live="polite" className="grid gap-2">
          {errorGeneral && <p role="alert" className="rounded-md border border-danger p-3 text-danger">{errorGeneral}</p>}
          {!online && <p className="rounded-md border border-warning p-3">⚠ Sin conexión. El borrador queda guardado en este equipo; enviá cuando vuelva la señal.</p>}
          {online && !registrar.isPending && <p className="text-sm text-soft">○ Borrador en este equipo, todavía sin enviar.</p>}
        </div>

        <div className="sticky bottom-0 -mx-4 grid gap-2 border-t border-border bg-background p-4">
          <Button type="submit" className="h-12 text-base" disabled={!online || formState.isSubmitting}>
            {formState.isSubmitting ? '↻ Enviando…' : !online ? 'Sin conexión' : 'Enviar parte'}
          </Button>
          <Button asChild variant="ghost" className="h-11"><Link to="/produccion">Volver al listado</Link></Button>
        </div>
      </form>
    </section>
  )
}
