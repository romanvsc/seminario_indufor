import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { ApiError } from '@/shared/api/client'
import { Campo } from '@/shared/components/Campo'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { MODALIDADES, useGuardarFrente, type Frente } from './api'

const esquema = z.object({
  nombre_frente: z.string().trim().min(1, 'Ingresá el nombre.').max(100),
  ubicacion_geografica: z.string().trim().max(150),
  modalidad_produccion: z.enum(['CONSOLIDADA', 'INDIVIDUAL'], { message: 'Elegí la modalidad.' }),
})
type Datos = z.infer<typeof esquema>

/** Alta y edición de frentes. Solo confirma "guardado" después de la respuesta del backend. */
export function FrenteDialog({ frente, onClose }: { frente: Frente | 'nuevo'; onClose: () => void }) {
  const nuevo = frente === 'nuevo'
  const guardar = useGuardarFrente()
  const { register, handleSubmit, setError, formState } = useForm<Datos>({
    resolver: zodResolver(esquema),
    defaultValues: nuevo
      ? { nombre_frente: '', ubicacion_geografica: '', modalidad_produccion: undefined }
      : { nombre_frente: frente.nombre, ubicacion_geografica: frente.ubicacion ?? '', modalidad_produccion: frente.modalidad },
  })
  const e = formState.errors

  const enviar = handleSubmit(async (d) => {
    try {
      await guardar.mutateAsync({ id: nuevo ? undefined : frente.id, datos: { ...d, ubicacion_geografica: d.ubicacion_geografica || null } })
      toast.success(nuevo ? 'Frente creado.' : 'Cambios guardados.')
      onClose()
    } catch (err) {
      if (err instanceof ApiError && err.code === 'VALIDACION') {
        for (const [campo, msgs] of Object.entries(err.details)) setError(campo as keyof Datos, { message: msgs[0] })
      } else toast.error(err instanceof ApiError ? err.message : 'No se pudo guardar.')
    }
  })

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{nuevo ? 'Nuevo frente' : `Editar ${frente.nombre}`}</DialogTitle>
        </DialogHeader>
        <form id="form-frente" onSubmit={enviar} noValidate className="grid gap-4">
          <Campo id="nombre_frente" label="Nombre" error={e.nombre_frente?.message}>
            <Input id="nombre_frente" aria-invalid={!!e.nombre_frente} aria-describedby="nombre_frente-error" {...register('nombre_frente')} />
          </Campo>
          <Campo id="ubicacion_geografica" label="Ubicación (opcional)" error={e.ubicacion_geografica?.message}>
            <Input id="ubicacion_geografica" {...register('ubicacion_geografica')} />
          </Campo>
          <Campo id="modalidad_produccion" label="Modalidad de producción" error={e.modalidad_produccion?.message}>
            <select id="modalidad_produccion" className="h-9 rounded-md border border-input bg-card px-3"
              aria-invalid={!!e.modalidad_produccion} aria-describedby="modalidad_produccion-error" {...register('modalidad_produccion')}>
              <option value="">Elegí…</option>
              {Object.entries(MODALIDADES).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
          </Campo>
        </form>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="form-frente" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
