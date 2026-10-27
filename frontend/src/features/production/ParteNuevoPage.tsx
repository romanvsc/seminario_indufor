import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { z } from 'zod'
import { useSesionVencida, useUsuarioActual } from '@/features/auth/api'
import { hoy, useFrentes, type Frente } from '@/features/fronts/api'
import { useUnidadesOpciones, type Unidad } from '@/features/machinery/api'
import { ApiError } from '@/shared/api/client'
import { Campo } from '@/shared/components/Campo'
import { ConfirmacionEnvio, type Guardado } from '@/shared/components/ConfirmacionEnvio'
import { ConnectionBadge } from '@/shared/components/ConnectionBadge'
import { DescartarBorrador } from '@/shared/components/DescartarBorrador'
import { EsperarConsultas } from '@/shared/components/EsperarConsultas'
import { EstadoEnvio } from '@/shared/components/EstadoEnvio'
import { marcarFotoPendiente } from '@/shared/pendientes'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus'
import { useMisAsignaciones, useRegistrarParte, useSubirFoto, useTiposMadera } from './api'
import { camposParte, conMagnitud, numero, SIN_MAGNITUD } from './validaciones'
import { borrarBorrador, guardarBorrador, leerBorrador } from '@/shared/borrador'
import { leerUltimaEleccion, recordarEleccion, vigente } from '@/shared/ultimaEleccion'

const esquema = z.object({ clave: z.string(), ...camposParte }).refine(conMagnitud, SIN_MAGNITUD)

type Borrador = z.infer<typeof esquema>

const control = 'h-12 w-full rounded-md border border-input bg-card px-3 text-base'

/** Pantalla de campo: parte diario de producción (RF01–RF04). Una columna, poca escritura, borrador local. */
export function ParteNuevoPage() {
  const yo = useUsuarioActual().data
  const frentes = useFrentes('activos')
  const tipos = useTiposMadera()
  const unidades = useUnidadesOpciones()
  const [guardado, setGuardado] = useState<Guardado | null>(null)
  const [vuelta, setVuelta] = useState(0)

  if (!yo) return <p role="status" className="p-4">Cargando…</p>
  if (guardado) return <ConfirmacionEnvio guardado={guardado} otro={() => { setGuardado(null); setVuelta(vuelta + 1) }} ver={{ texto: 'Ver mis partes', ruta: '/produccion' }} />
  // Los frentes que se ofrecen dependen de la jornada elegida (specs/02): se filtran dentro del formulario
  return (
    <EsperarConsultas consultas={[frentes, tipos, unidades]}>
      {() => <ParteForm key={vuelta} onGuardado={setGuardado} idUsuario={yo.id} frentesActivos={frentes.data!.data} unidades={unidades.data!} tipos={tipos.data!} />}
    </EsperarConsultas>
  )
}

function ParteForm({ idUsuario, frentesActivos, unidades, tipos, onGuardado }: { onGuardado: (g: Guardado) => void; idUsuario: number; frentesActivos: Frente[]; unidades: Unidad[]; tipos: { id: number; nombre: string }[] }) {
  const online = useOnlineStatus()
  const registrar = useRegistrarParte()
  const sesionVencida = useSesionVencida()
  const [borradorOk, setBorradorOk] = useState(true)
  const [incierto, setIncierto] = useState(false)
  useEffect(() => () => marcarFotoPendiente(false), [])
  const subirFoto = useSubirFoto()
  const foto = useRef<HTMLInputElement>(null)
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [conflicto, setConflicto] = useState(false)
  const borrador = useRef(leerBorrador<Borrador>('parte', idUsuario)).current

  const { register, handleSubmit, watch, setError, setValue, getValues, formState } = useForm<Borrador>({
    resolver: zodResolver(esquema),
    mode: 'onTouched',
    defaultValues: borrador ?? {
      clave: crypto.randomUUID(),
      id_frente: '',
      // CA-07.4: la última máquina usada, a la vista y editable
      id_unidad: vigente(leerUltimaEleccion('parte', idUsuario).id_unidad, unidades),
      tipo_madera: '',
      fecha_registro: hoy(),
      cantidad_toneladas: '',
      metros_cubicos: '',
      observaciones: '',
    },
  })
  const e = formState.errors
  const idFrente = watch('id_frente')
  const fecha = watch('fecha_registro')
  const asignaciones = useMisAsignaciones(idUsuario, fecha)
  const frentes = asignaciones.data ? frentesActivos.filter((f) => asignaciones.data.some((a) => a.frente.id === f.id)) : []
  const frente = frentes.find((f) => String(f.id) === idFrente)
  const [frenteQuitado, setFrenteQuitado] = useState<string | null>(null)

  // Al cambiar la jornada cambian los frentes posibles: si el elegido ya no corresponde se limpia y se avisa;
  // si queda uno solo se preselecciona (siempre editable)
  const opciones = frentes.map((f) => f.id).join()
  useEffect(() => {
    if (!asignaciones.data || asignaciones.isPlaceholderData) return
    const actual = getValues('id_frente')
    const validos = opciones ? opciones.split(',') : []
    if (actual && !validos.includes(actual)) {
      setFrenteQuitado(frentesActivos.find((f) => String(f.id) === actual)?.nombre ?? 'el frente elegido')
      setValue('id_frente', '')
    } else if (!actual && validos.length === 1) {
      setValue('id_frente', validos[0])
    }
  }, [opciones, asignaciones.data, asignaciones.isPlaceholderData, getValues, setValue, frentesActivos])

  // Cada cambio queda en el equipo: si se corta la señal o se cierra la app, el parte no se pierde
  useEffect(() => {
    // Solo lo que escribe o elige el usuario: una preselección automática (el único frente) no es un borrador
    const s = watch((v, { type }) => {
      if (type === 'change') setBorradorOk(guardarBorrador('parte', idUsuario, v))
    })
    return () => s.unsubscribe()
  }, [watch, idUsuario])

  const enviar = handleSubmit(async (d) => {
    setErrorGeneral(null)
    setIncierto(false)
    try {
      const parte = await registrar.mutateAsync({
        clave: d.clave,
        datos: {
          id_frente: Number(d.id_frente), id_unidad: Number(d.id_unidad), tipo_madera: Number(d.tipo_madera), fecha_registro: d.fecha_registro,
          cantidad_toneladas: numero(d.cantidad_toneladas), metros_cubicos: numero(d.metros_cubicos), observaciones: d.observaciones.trim() || null,
        },
      })
      borrarBorrador('parte', idUsuario)
      recordarEleccion('parte', idUsuario, { id_unidad: d.id_unidad })
      marcarFotoPendiente(false)
      const archivo = foto.current?.files?.[0]
      let aviso: string | undefined
      if (archivo) {
        try {
          await subirFoto.mutateAsync({ id: parte.id, foto: archivo })
        } catch {
          aviso = 'La foto no se pudo subir. Adjuntala desde "Ver mis partes".'
        }
      }
      onGuardado({
        titulo: parte.ya_registrado ? 'Parte guardado (ya había llegado).' : 'Parte guardado.', numero: parte.id, aviso,
        detalle: [parte.fecha_registro.split('-').reverse().join('/'), parte.frente.nombre, parte.unidad.nombre, parte.tipo_madera.nombre,
          parte.cantidad_toneladas && `${parte.cantidad_toneladas} t`, parte.metros_cubicos && `${parte.metros_cubicos} m³`],
      })
    } catch (err) {
      if (err instanceof ApiError && err.code === 'NO_AUTENTICADO') return sesionVencida()
      // Un corte durante el envío puede haber llegado igual: se reintenta con la misma clave, sin duplicar (specs/04)
      const sinRespuesta = err instanceof ApiError && err.code === 'SIN_CONEXION'
      setIncierto(sinRespuesta)
      if (sinRespuesta) return
      if (err instanceof ApiError && Object.keys(err.details).length) {
        for (const [campo, msgs] of Object.entries(err.details)) setError(campo as keyof Borrador, { message: msgs[0] })
      }
      setErrorGeneral(err instanceof ApiError ? err.message : 'No se pudo enviar. El borrador sigue guardado en este equipo.')
      setConflicto(err instanceof ApiError && err.code === 'CLAVE_REUTILIZADA')
    }
  })

  const enOtros = unidades.filter((u) => u.frente?.id !== frente?.id)
  const enFrente = unidades.filter((u) => frente && u.frente?.id === frente.id)
  // D30: se permite una máquina de otro frente (traslado temporal); el parte queda en el frente elegido
  const idUnidad = watch('id_unidad')
  const maquina = unidades.find((u) => String(u.id) === idUnidad)
  const trasladada = frente && maquina?.frente && maquina.frente.id !== frente.id ? maquina : null

  return (
    <section className="mx-auto grid max-w-md gap-5 text-base">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Parte de producción</h1>
        <ConnectionBadge />
      </div>

      <form onSubmit={enviar} noValidate className="grid gap-5">
        <Campo id="fecha_registro" label="Jornada" error={e.fecha_registro?.message}>
          <Input id="fecha_registro" type="date" max={hoy()} className="h-12 text-base" aria-invalid={!!e.fecha_registro} aria-describedby="fecha_registro-error"
            {...register('fecha_registro', { onChange: () => setFrenteQuitado(null) })} />
        </Campo>

        <Campo id="id_frente" label="Frente" error={e.id_frente?.message}>
          <select id="id_frente" className={control} aria-invalid={!!e.id_frente} aria-describedby="id_frente-error id_frente-aviso" disabled={!asignaciones.data} {...register('id_frente')}>
            <option value="">{asignaciones.data ? 'Elegí…' : 'Buscando tus frentes…'}</option>
            {frentes.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
          </select>
        </Campo>
        <div id="id_frente-aviso" aria-live="polite">
          {asignaciones.isError && (
            <p role="alert" className="text-sm text-danger">
              No se pudieron cargar tus frentes. <button type="button" className="underline" onClick={() => asignaciones.refetch()}>Reintentar</button>
            </p>
          )}
          {asignaciones.data && !asignaciones.isPlaceholderData && frentes.length === 0 && (
            <p role="alert" className="text-sm text-danger">
              No estabas asignado a ningún frente el {fecha.split('-').reverse().join('/')}. Cambiá la jornada o pedile a Administración que revise tus asignaciones.
            </p>
          )}
          {frenteQuitado && <p className="text-sm text-warning">⚠ El {fecha.split('-').reverse().join('/')} no estabas asignado a {frenteQuitado}: elegí el frente otra vez.</p>}
        </div>
        {frente && (
          <p className="text-sm text-soft">
            {frente.modalidad === 'CONSOLIDADA' ? 'Carga consolidada del frente (encargado).' : 'Carga individual: quedás como operario productor.'}
          </p>
        )}

        <Campo id="id_unidad" label="Máquina" error={e.id_unidad?.message}>
          <select id="id_unidad" className={control} aria-invalid={!!e.id_unidad} aria-describedby="id_unidad-error id_unidad-aviso"
            // Controlado: al elegir el frente las opciones cambian de grupo y React las recrea; así no se pierde la elegida
            {...register('id_unidad')} value={idUnidad}>
            <option value="">Elegí…</option>
            {enFrente.length > 0 && <optgroup label="En este frente">{enFrente.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}</optgroup>}
            <optgroup label={enFrente.length > 0 ? 'Otras' : 'Máquinas'}>{enOtros.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}</optgroup>
          </select>
        </Campo>
        <div id="id_unidad-aviso" aria-live="polite">
          {trasladada && frente && (
            <p className="rounded-md border border-warning p-3 text-sm">
              ⚠ {trasladada.nombre} figura en {trasladada.frente!.nombre}. El parte quedará registrado en {frente.nombre}. Si la máquina no se trasladó, revisá la elección.
            </p>
          )}
        </div>

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
          <Campo id="cantidad_toneladas" label="Toneladas" error={e.cantidad_toneladas?.message}>
            <Input id="cantidad_toneladas" inputMode="decimal" autoComplete="off" className="h-12 text-base" aria-invalid={!!e.cantidad_toneladas} aria-describedby="cantidad_toneladas-error" {...register('cantidad_toneladas')} />
          </Campo>
          <Campo id="metros_cubicos" label="Metros cúbicos" error={e.metros_cubicos?.message}>
            <Input id="metros_cubicos" inputMode="decimal" autoComplete="off" className="h-12 text-base" aria-invalid={!!e.metros_cubicos} aria-describedby="metros_cubicos-error" {...register('metros_cubicos')} />
          </Campo>
        </div>
        <p className="-mt-3 text-sm text-soft">Completá al menos una. No se suman ni se convierten entre sí.</p>

        <Campo id="foto" label="Foto de la planilla o el monitor (opcional)">
          <input id="foto" ref={foto} type="file" accept="image/*" capture="environment" onChange={(e) => marcarFotoPendiente(!!e.target.files?.length)} className="text-base file:mr-3 file:min-h-11 file:rounded-md file:border file:border-input file:bg-card file:px-3" />
        </Campo>

        <Campo id="observaciones" label="Observaciones (opcional)" error={e.observaciones?.message}>
          <textarea id="observaciones" rows={3} className="w-full rounded-md border border-input bg-card p-3 text-base" placeholder="Clima, detenciones, ausencias…" {...register('observaciones')} />
        </Campo>

        <div aria-live="polite" className="grid gap-2">
          {errorGeneral && <p role="alert" className="rounded-md border border-danger p-3 text-danger">{errorGeneral}</p>}
          {conflicto && <DescartarBorrador tipo="parte" idUsuario={idUsuario} verGuardados="/produccion" />}
        </div>
        <EstadoEnvio online={online} enviando={formState.isSubmitting} borradorOk={borradorOk} incierto={incierto} />

        <div className="sticky bottom-0 -mx-4 grid gap-2 border-t border-border bg-background p-4">
          <Button type="submit" className="h-12 text-base" disabled={!online || formState.isSubmitting}>
            {formState.isSubmitting ? '↻ Enviando…' : !online ? 'Sin conexión' : incierto ? 'Reintentar' : 'Enviar parte'}
          </Button>
          <Button asChild variant="ghost" className="h-11"><Link to="/produccion">Volver al listado</Link></Button>
        </div>
      </form>
    </section>
  )
}
