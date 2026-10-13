import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { ApiError } from '@/shared/api/client'
import { Campo } from '@/shared/components/Campo'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { useActualizarUsuario, useCatalogoRoles, useCrearUsuario, type Usuario } from './api'

const base = {
  nombre: z.string().trim().min(1, 'Ingresá el nombre.').max(80),
  apellido: z.string().trim().min(1, 'Ingresá el apellido.').max(80),
  email: z.string().trim().email('El email no es válido.').max(190),
  telefono_whatsapp: z.string().trim().max(30),
  roles: z.array(z.string()).min(1, 'Elegí al menos un rol.'),
}
const clave = z.string().min(8, 'Mínimo 8 caracteres, con letras y números.').regex(/[a-zA-Z]/, 'Debe tener letras.').regex(/\d/, 'Debe tener números.')
const esquemaAlta = z.object({ ...base, password: clave })
const esquemaEdicion = z.object({ ...base, password: clave.or(z.literal('')) })
type Datos = z.infer<typeof esquemaAlta>

/** Alta y edición de usuarios. Solo confirma "guardado" después de la respuesta del backend. */
export function UsuarioDialog({ usuario, onClose }: { usuario: Usuario | 'nuevo'; onClose: () => void }) {
  const nuevo = usuario === 'nuevo'
  const roles = useCatalogoRoles()
  const crear = useCrearUsuario()
  const actualizar = useActualizarUsuario()
  const { register, handleSubmit, watch, setValue, setError, formState } = useForm<Datos>({
    resolver: zodResolver(nuevo ? esquemaAlta : esquemaEdicion),
    defaultValues: nuevo
      ? { nombre: '', apellido: '', email: '', telefono_whatsapp: '', password: '', roles: [] }
      : { ...usuario, telefono_whatsapp: usuario.telefono_whatsapp ?? '', password: '', roles: usuario.roles.map((r) => r.codigo) },
  })
  const seleccion = watch('roles')
  const e = formState.errors

  const enviar = handleSubmit(async (d) => {
    const datos = { nombre: d.nombre, apellido: d.apellido, email: d.email, telefono_whatsapp: d.telefono_whatsapp || null, ...(d.password ? { password: d.password } : {}) }
    try {
      if (nuevo) await crear.mutateAsync({ ...datos, roles: d.roles })
      else {
        const cambiaron = [...d.roles].sort().join() !== usuario.roles.map((r) => r.codigo).sort().join()
        await actualizar.mutateAsync({ id: usuario.id, datos, roles: cambiaron ? d.roles : null })
      }
      toast.success(nuevo ? 'Usuario creado.' : 'Cambios guardados.')
      onClose()
    } catch (err) {
      if (err instanceof ApiError && err.code === 'VALIDACION') {
        for (const [campo, msgs] of Object.entries(err.details)) setError(campo.split('.')[0] as keyof Datos, { message: msgs[0] })
      } else toast.error(err instanceof ApiError ? err.message : 'No se pudo guardar.')
    }
  })

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{nuevo ? 'Nuevo usuario' : `Editar a ${usuario.nombre} ${usuario.apellido}`}</DialogTitle>
        </DialogHeader>
        <form id="form-usuario" onSubmit={enviar} noValidate className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="nombre" label="Nombre" error={e.nombre?.message}>
              <Input id="nombre" aria-invalid={!!e.nombre} aria-describedby="nombre-error" {...register('nombre')} />
            </Campo>
            <Campo id="apellido" label="Apellido" error={e.apellido?.message}>
              <Input id="apellido" aria-invalid={!!e.apellido} aria-describedby="apellido-error" {...register('apellido')} />
            </Campo>
          </div>
          <Campo id="email" label="Email" error={e.email?.message}>
            <Input id="email" type="email" autoComplete="off" aria-invalid={!!e.email} aria-describedby="email-error" {...register('email')} />
          </Campo>
          <Campo id="telefono_whatsapp" label="Teléfono / WhatsApp (opcional)" error={e.telefono_whatsapp?.message}>
            <Input id="telefono_whatsapp" type="tel" inputMode="tel" {...register('telefono_whatsapp')} />
          </Campo>
          <Campo id="password" label={nuevo ? 'Contraseña' : 'Nueva contraseña (dejar vacío para no cambiarla)'} error={e.password?.message}>
            <Input id="password" type="password" autoComplete="new-password" aria-invalid={!!e.password} aria-describedby="password-error" {...register('password')} />
          </Campo>
          <fieldset className="grid gap-2" aria-describedby="roles-error">
            <legend className="mb-1 text-sm font-medium">Roles</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {roles.data?.map((r) => (
                <div key={r.codigo} className="flex items-center gap-2">
                  <Checkbox
                    id={`rol-${r.codigo}`}
                    checked={seleccion.includes(r.codigo)}
                    onCheckedChange={(v) =>
                      setValue('roles', v ? [...seleccion, r.codigo] : seleccion.filter((x) => x !== r.codigo), { shouldValidate: formState.isSubmitted })
                    }
                  />
                  <Label htmlFor={`rol-${r.codigo}`}>{r.nombre}</Label>
                </div>
              ))}
            </div>
            {e.roles && <p id="roles-error" role="alert" className="text-sm text-danger">{e.roles.message}</p>}
          </fieldset>
        </form>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="form-usuario" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
