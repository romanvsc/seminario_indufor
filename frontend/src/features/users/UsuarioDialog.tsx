import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { FieldError } from '@/shared/components/ui/field'
import { ApiError } from '@/shared/api/client'
import { Campo } from '@/shared/components/Campo'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Cargando } from '@/shared/components/Cargando'
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

/** UIX-033: qué habilita cada rol, resumido de docs/rbac.md (mantener en sincronía). El backend es quien autoriza. */
const ALCANCE_ROL: Record<string, string> = {
  administracion: 'Todo el sistema: usuarios, frentes, maquinaria, remitos, correcciones, integración y reportes.',
  gerencia: 'Usuarios, reportes de producción, consumos y gastos, y consulta de la operación.',
  encargado: 'Campo: partes de producción, lecturas y matafuegos de sus frentes.',
  operario: 'Campo: partes de producción, lecturas y matafuegos de sus frentes.',
  camionero: 'Declara sus viajes y consulta los propios.',
  logistica: 'Consulta todos los viajes.',
  mantenimiento: 'Panel técnico: fallas, lecturas y matafuegos de toda la flota; reporte operativo.',
}

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
      {/* UIX-033: en el celular ocupa casi toda la pantalla y el pie con Guardar queda fijo abajo */}
      <DialogContent className="max-h-[90dvh] overflow-y-auto max-sm:max-h-[96dvh] max-sm:max-w-[calc(100%-1rem)]">
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
            <Input id="password" type="password" autoComplete="new-password" aria-invalid={!!e.password} aria-describedby="password-ayuda password-error" {...register('password')} />
            <p id="password-ayuda" className="text-sm text-soft">Mínimo 8 caracteres, con letras y números.</p>
          </Campo>
          <fieldset className="grid gap-2" aria-describedby="roles-error">
            <legend className="mb-1 text-sm font-medium">Roles</legend>
            {roles.isPending && <p role="status" className="text-sm text-soft"><Cargando /></p>}
            {roles.isError && (
              <p role="alert" className="text-sm text-danger">
                No se pudieron cargar los roles. <button type="button" className="underline" onClick={() => roles.refetch()}>Reintentar</button>
              </p>
            )}
            <div className="grid gap-1 sm:grid-cols-2">
              {roles.data?.map((r) => (
                // Toda la fila es el área táctil (mínimo 44 px); la descripción dice qué acceso da el rol
                <label key={r.codigo} htmlFor={`rol-${r.codigo}`} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-secondary/40">
                  <Checkbox
                    id={`rol-${r.codigo}`}
                    className="mt-0.5"
                    aria-labelledby={`rol-${r.codigo}-nombre`}
                    aria-describedby={ALCANCE_ROL[r.codigo] ? `rol-${r.codigo}-alcance` : undefined}
                    checked={seleccion.includes(r.codigo)}
                    onCheckedChange={(v) =>
                      setValue('roles', v ? [...seleccion, r.codigo] : seleccion.filter((x) => x !== r.codigo), { shouldValidate: formState.isSubmitted })
                    }
                  />
                  <span className="grid gap-0.5">
                    <span id={`rol-${r.codigo}-nombre`} className="text-sm font-medium">{r.nombre}</span>
                    {ALCANCE_ROL[r.codigo] && <span id={`rol-${r.codigo}-alcance`} className="text-sm text-soft">{ALCANCE_ROL[r.codigo]}</span>}
                  </span>
                </label>
              ))}
            </div>
            {e.roles && <FieldError id="roles-error">{e.roles.message}</FieldError>}
          </fieldset>
        </form>
        <DialogFooter className="max-sm:sticky max-sm:-bottom-6 max-sm:-mx-6 max-sm:border-t max-sm:border-border max-sm:bg-popover max-sm:px-6 max-sm:py-3">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="form-usuario" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
