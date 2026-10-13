import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { z } from 'zod'
import { ApiError } from '@/shared/api/client'
import { Campo } from '@/shared/components/Campo'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { useLogin, useUsuarioActual } from './api'

const esquema = z.object({
  email: z.string().trim().min(1, 'Ingresá tu email.').email('El email no es válido.'),
  password: z.string().min(1, 'Ingresá tu contraseña.'),
  recordar: z.boolean(),
})
type Datos = z.infer<typeof esquema>

export function LoginPage() {
  const { data: usuario } = useUsuarioActual()
  const login = useLogin()
  const navigate = useNavigate()
  const destino = (useLocation().state as { desde?: string } | null)?.desde ?? '/'
  const { register, handleSubmit, setValue, watch, setError, formState } = useForm<Datos>({
    resolver: zodResolver(esquema),
    defaultValues: { email: '', password: '', recordar: false },
  })

  if (usuario) return <Navigate to={destino} replace />

  const enviar = handleSubmit((datos) =>
    login.mutate(datos, {
      onSuccess: () => navigate(destino, { replace: true }),
      onError: (e) => {
        if (e instanceof ApiError && e.code === 'VALIDACION') {
          for (const [campo, mensajes] of Object.entries(e.details)) setError(campo as keyof Datos, { message: mensajes[0] })
        }
      },
    }),
  )
  const errorGeneral = login.error instanceof ApiError && login.error.code !== 'VALIDACION' ? login.error.message : null

  return (
    <main className="grid min-h-dvh place-items-center bg-background p-4">
      <form onSubmit={enviar} noValidate className="grid w-full max-w-sm gap-5 rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="grid justify-items-center gap-2 text-center">
          <img src="/logo-indufor.png" alt="Indufor SRL, servicios forestales" width={120} height={120} />
          <h1 className="text-xl font-semibold text-foreground">Ingresar al sistema</h1>
        </div>

        {errorGeneral && (
          <p role="alert" className="rounded-md border border-danger px-3 py-2 text-sm text-danger">
            {errorGeneral}
          </p>
        )}

        <Campo id="email" label="Email" error={formState.errors.email?.message}>
          <Input id="email" type="email" autoComplete="username" inputMode="email" className="h-12 text-base"
            aria-invalid={!!formState.errors.email} aria-describedby="email-error" {...register('email')} />
        </Campo>
        <Campo id="password" label="Contraseña" error={formState.errors.password?.message}>
          <Input id="password" type="password" autoComplete="current-password" className="h-12 text-base"
            aria-invalid={!!formState.errors.password} aria-describedby="password-error" {...register('password')} />
        </Campo>
        <div className="flex items-center gap-2">
          <Checkbox id="recordar" checked={watch('recordar')} onCheckedChange={(v) => setValue('recordar', v === true)} />
          <Label htmlFor="recordar">Mantener la sesión iniciada</Label>
        </div>

        <Button type="submit" className="h-12 text-base" disabled={login.isPending}>
          {login.isPending ? 'Ingresando…' : 'Ingresar'}
        </Button>
      </form>
    </main>
  )
}
