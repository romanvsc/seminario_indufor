import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { useFrentes, useUsuariosActivos } from '@/features/fronts/api'
import { ApiError } from '@/shared/api/client'
import { Campo } from '@/shared/components/Campo'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { METRICAS, useGuardarUnidad, useTipos, type Unidad } from './api'

const esquema = z.object({
  nombre: z.string().trim().min(1, 'Ingresá el nombre o número interno.').max(100),
  dominio_patente: z.string().trim().max(20),
  marca_modelo: z.string().trim().min(1, 'Ingresá marca y modelo.').max(120),
  id_tipo_maquinaria: z.string().min(1, 'Elegí el tipo.'),
  id_frente_actual: z.string(),
  id_usuario: z.string(),
})
type Datos = z.infer<typeof esquema>
const select = 'h-9 rounded-md border border-input bg-card px-3'
const idONull = (v: string) => (v ? Number(v) : null)

/** Alta y edición de unidades de la flota. Solo confirma "guardado" después de la respuesta del backend. */
export function UnidadDialog({ unidad, onClose }: { unidad: Unidad | 'nueva'; onClose: () => void }) {
  const nueva = unidad === 'nueva'
  const tipos = useTipos()
  const frentes = useFrentes('activos')
  const usuarios = useUsuariosActivos(true)
  const guardar = useGuardarUnidad()
  const { register, handleSubmit, setError, formState } = useForm<Datos>({
    resolver: zodResolver(esquema),
    defaultValues: nueva
      ? { nombre: '', dominio_patente: '', marca_modelo: '', id_tipo_maquinaria: '', id_frente_actual: '', id_usuario: '' }
      : {
          nombre: unidad.nombre,
          dominio_patente: unidad.dominio_patente ?? '',
          marca_modelo: unidad.marca_modelo,
          id_tipo_maquinaria: String(unidad.tipo.id),
          id_frente_actual: unidad.frente ? String(unidad.frente.id) : '',
          id_usuario: unidad.usuario ? String(unidad.usuario.id) : '',
        },
  })
  const e = formState.errors

  const enviar = handleSubmit(async (d) => {
    try {
      await guardar.mutateAsync({
        id: nueva ? undefined : unidad.id,
        datos: { ...d, dominio_patente: d.dominio_patente || null, id_tipo_maquinaria: Number(d.id_tipo_maquinaria), id_frente_actual: idONull(d.id_frente_actual), id_usuario: idONull(d.id_usuario) },
      })
      toast.success(nueva ? 'Unidad creada.' : 'Cambios guardados.')
      onClose()
    } catch (err) {
      if (err instanceof ApiError && err.code === 'VALIDACION') {
        for (const [campo, msgs] of Object.entries(err.details)) setError(campo as keyof Datos, { message: msgs[0] })
      } else toast.error(err instanceof ApiError ? err.message : 'No se pudo guardar.')
    }
  })

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{nueva ? 'Nueva unidad' : `Editar ${unidad.nombre}`}</DialogTitle>
        </DialogHeader>
        {/* Los selects se montan con sus opciones ya cargadas para que muestren el valor actual al editar */}
        {!(tipos.data && frentes.data && usuarios.data) ? <p role="status">Cargando…</p> : (
        <form id="form-unidad" onSubmit={enviar} noValidate className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="nombre" label="Nombre / número interno" error={e.nombre?.message}>
              <Input id="nombre" aria-invalid={!!e.nombre} aria-describedby="nombre-error" {...register('nombre')} />
            </Campo>
            <Campo id="dominio_patente" label="Patente (opcional)" error={e.dominio_patente?.message}>
              <Input id="dominio_patente" className="uppercase" aria-invalid={!!e.dominio_patente} aria-describedby="dominio_patente-error" {...register('dominio_patente')} />
            </Campo>
          </div>
          <Campo id="marca_modelo" label="Marca y modelo" error={e.marca_modelo?.message}>
            <Input id="marca_modelo" aria-invalid={!!e.marca_modelo} aria-describedby="marca_modelo-error" {...register('marca_modelo')} />
          </Campo>
          <Campo id="id_tipo_maquinaria" label="Tipo" error={e.id_tipo_maquinaria?.message}>
            <select id="id_tipo_maquinaria" className={select} aria-invalid={!!e.id_tipo_maquinaria} aria-describedby="id_tipo_maquinaria-error" {...register('id_tipo_maquinaria')}>
              <option value="">Elegí…</option>
              {tipos.data?.map((t) => <option key={t.id} value={t.id}>{t.nombre} ({METRICAS[t.metrica]})</option>)}
            </select>
          </Campo>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="id_frente_actual" label="Frente actual (opcional)" error={e.id_frente_actual?.message}>
              <select id="id_frente_actual" className={select} aria-describedby="id_frente_actual-error" {...register('id_frente_actual')}>
                <option value="">Sin frente</option>
                {frentes.data?.data.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
              </select>
            </Campo>
            <Campo id="id_usuario" label="Responsable (opcional)" error={e.id_usuario?.message}>
              <select id="id_usuario" className={select} aria-describedby="id_usuario-error" {...register('id_usuario')}>
                <option value="">Sin responsable</option>
                {usuarios.data?.map((u) => <option key={u.id} value={u.id}>{u.apellido}, {u.nombre}</option>)}
              </select>
            </Campo>
          </div>
        </form>
        )}
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="form-unidad" disabled={formState.isSubmitting}>{formState.isSubmitting ? 'Guardando…' : 'Guardar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
