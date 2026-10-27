import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { hoy, useFrentes, type Frente } from '@/features/fronts/api'
import { useUnidadesOpciones, type Unidad } from '@/features/machinery/api'
import { ApiError } from '@/shared/api/client'
import { Campo } from '@/shared/components/Campo'
import { EsperarConsultas } from '@/shared/components/EsperarConsultas'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus'
import { useCorregirParte, useMisAsignaciones, useTiposMadera, type DatosParte, type Parte } from './api'
import { camposParte, conMagnitud, numero, SIN_MAGNITUD } from './validaciones'

const esquema = z
  .object({ ...camposParte, motivo: z.string().trim().min(5, 'Contá en pocas palabras por qué corregís (mínimo 5 letras).').max(500) })
  .refine(conMagnitud, SIN_MAGNITUD)
type Correccion = z.infer<typeof esquema>
type Campos = Exclude<keyof Correccion, 'motivo'>

const control = 'h-11 w-full rounded-md border border-input bg-card px-3 text-base'
const fecha = (iso: string) => iso.split('-').reverse().join('/')

/** Spec 03: el autor corrige su parte con las mismas reglas del alta, más un motivo que queda auditado (D25). */
export function CorregirParteDialog({ parte, idUsuario, onClose }: { parte: Parte; idUsuario: number; onClose: () => void }) {
  const frentes = useFrentes('activos')
  const unidades = useUnidadesOpciones()
  const tipos = useTiposMadera()
  return (
    <Dialog open onOpenChange={(abierto) => !abierto && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Corregir parte del {fecha(parte.fecha_registro)}</DialogTitle>
          <DialogDescription>Se aplican las mismas reglas que al cargarlo. El cambio y su motivo quedan registrados.</DialogDescription>
        </DialogHeader>
        <EsperarConsultas consultas={[frentes, unidades, tipos]}>
          {() => <Formulario parte={parte} idUsuario={idUsuario} frentesActivos={frentes.data!.data} unidades={unidades.data!} tipos={tipos.data!} onClose={onClose} />}
        </EsperarConsultas>
      </DialogContent>
    </Dialog>
  )
}

function Formulario({ parte, idUsuario, frentesActivos, unidades, tipos, onClose }: {
  parte: Parte; idUsuario: number; frentesActivos: Frente[]; unidades: Unidad[]; tipos: { id: number; nombre: string }[]; onClose: () => void
}) {
  const online = useOnlineStatus()
  const corregir = useCorregirParte()
  const [aviso, setAviso] = useState<string | null>(null)
  const original: Record<Campos, string> = {
    id_frente: String(parte.frente.id),
    id_unidad: String(parte.unidad.id),
    tipo_madera: String(parte.tipo_madera.id),
    fecha_registro: parte.fecha_registro,
    cantidad_toneladas: parte.cantidad_toneladas ?? '',
    metros_cubicos: parte.metros_cubicos ?? '',
    observaciones: parte.observaciones ?? '',
  }
  const { register, handleSubmit, watch, setError, formState } = useForm<Correccion>({
    resolver: zodResolver(esquema),
    mode: 'onTouched',
    defaultValues: { ...original, motivo: '' },
  })
  const e = formState.errors
  const jornada = watch('fecha_registro')
  // Los frentes posibles dependen de la jornada (D12). El del parte se muestra siempre: el backend decide si sigue valiendo
  const asignaciones = useMisAsignaciones(idUsuario, jornada)
  const frentes = [
    { id: parte.frente.id, nombre: parte.frente.nombre },
    ...frentesActivos.filter((f) => f.id !== parte.frente.id && asignaciones.data?.some((a) => a.frente.id === f.id)),
  ]

  const guardar = handleSubmit(async (d) => {
    setAviso(null)
    const cambiados = (Object.keys(original) as Campos[]).filter((k) => d[k].trim() !== original[k].trim())
    if (cambiados.length === 0) return setAviso('No hay cambios para guardar.')

    const cambios: Partial<DatosParte> = {}
    for (const k of cambiados) {
      if (k === 'id_frente' || k === 'id_unidad' || k === 'tipo_madera') cambios[k] = Number(d[k])
      else if (k === 'cantidad_toneladas' || k === 'metros_cubicos') cambios[k] = numero(d[k].trim())
      else if (k === 'observaciones') cambios[k] = d[k].trim() || null
      else cambios[k] = d[k]
    }
    try {
      await corregir.mutateAsync({ id: parte.id, cambios, motivo: d.motivo.trim() })
      toast.success('Corrección guardada.')
      onClose()
    } catch (err) {
      // El rechazo queda junto al campo y lo editado se conserva (CA-03.3)
      if (err instanceof ApiError && Object.keys(err.details).length) {
        for (const [campo, msgs] of Object.entries(err.details)) setError(campo as keyof Correccion, { message: msgs[0] })
      }
      setAviso(err instanceof ApiError ? err.message : 'No se pudo guardar la corrección. Revisá la conexión y probá de nuevo.')
    }
  })

  return (
    <form onSubmit={guardar} noValidate className="grid gap-4">
      <Campo id="c_fecha_registro" label="Jornada" error={e.fecha_registro?.message}>
        <Input id="c_fecha_registro" type="date" max={hoy()} className="h-11 text-base" aria-invalid={!!e.fecha_registro} aria-describedby="c_fecha_registro-error" {...register('fecha_registro')} />
      </Campo>
      <Campo id="c_id_frente" label="Frente" error={e.id_frente?.message}>
        <select id="c_id_frente" className={control} aria-invalid={!!e.id_frente} aria-describedby="c_id_frente-error" {...register('id_frente')}>
          {frentes.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
        </select>
      </Campo>
      <Campo id="c_id_unidad" label="Máquina" error={e.id_unidad?.message}>
        <select id="c_id_unidad" className={control} aria-invalid={!!e.id_unidad} aria-describedby="c_id_unidad-error" {...register('id_unidad')}>
          {unidades.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
        </select>
      </Campo>
      <fieldset aria-describedby="c_tipo_madera-error" className="grid gap-2">
        <legend className="mb-1 text-sm font-medium">Tipo de madera</legend>
        <div className="grid grid-cols-2 gap-3">
          {tipos.map((t) => (
            <label key={t.id} className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-card px-3 font-medium capitalize has-checked:border-primary has-checked:bg-secondary has-focus-visible:ring-2 has-focus-visible:ring-ring">
              <input type="radio" value={t.id} className="size-5 accent-primary" {...register('tipo_madera')} />
              {t.nombre}
            </label>
          ))}
        </div>
        {e.tipo_madera && <p id="c_tipo_madera-error" role="alert" className="text-sm text-danger">{e.tipo_madera.message}</p>}
      </fieldset>
      <div className="grid grid-cols-2 gap-3">
        <Campo id="c_cantidad_toneladas" label="Toneladas" error={e.cantidad_toneladas?.message}>
          <Input id="c_cantidad_toneladas" inputMode="decimal" autoComplete="off" className="h-11 text-base tabular-nums" aria-invalid={!!e.cantidad_toneladas} aria-describedby="c_cantidad_toneladas-error" {...register('cantidad_toneladas')} />
        </Campo>
        <Campo id="c_metros_cubicos" label="Metros cúbicos" error={e.metros_cubicos?.message}>
          <Input id="c_metros_cubicos" inputMode="decimal" autoComplete="off" className="h-11 text-base tabular-nums" aria-invalid={!!e.metros_cubicos} aria-describedby="c_metros_cubicos-error" {...register('metros_cubicos')} />
        </Campo>
      </div>
      <Campo id="c_observaciones" label="Observaciones (opcional)" error={e.observaciones?.message}>
        <textarea id="c_observaciones" rows={2} className="w-full rounded-md border border-input bg-card p-3 text-base" {...register('observaciones')} />
      </Campo>
      <Campo id="c_motivo" label="Motivo de la corrección" error={e.motivo?.message}>
        <textarea id="c_motivo" rows={2} className="w-full rounded-md border border-input bg-card p-3 text-base" placeholder="Ej.: toneladas invertidas al pasar la planilla"
          aria-invalid={!!e.motivo} aria-describedby="c_motivo-error" {...register('motivo')} />
      </Campo>

      <div aria-live="polite">{aviso && <p role="alert" className="rounded-md border border-warning p-3 text-sm">{aviso}</p>}</div>
      <DialogFooter>
        <Button type="button" variant="outline" className="h-11" onClick={onClose}>Cancelar</Button>
        <Button type="submit" className="h-11" disabled={!online || formState.isSubmitting}>
          {formState.isSubmitting ? '↻ Guardando…' : !online ? 'Sin conexión' : 'Guardar corrección'}
        </Button>
      </DialogFooter>
    </form>
  )
}
