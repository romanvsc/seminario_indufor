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
import fondo from '@/images/background_login.jpg'
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
    <main className="relative isolate grid min-h-dvh place-items-center overflow-hidden p-4 sm:p-8">
      {/* Fondo de página: la misma foto, oscurecida para que la tarjeta resalte */}
      <img src={fondo} alt="" className="absolute inset-0 -z-20 size-full object-cover" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-black/35" />

      <div className="grid w-full max-w-5xl gap-3 rounded-[2rem] bg-card p-3 shadow-2xl md:min-h-[36rem] md:grid-cols-[1.05fr_1fr]">
        {/* Panel de la foto: decorativo, solo en pantallas anchas */}
        <aside aria-hidden="true" className="relative hidden overflow-hidden rounded-[1.5rem] md:block [clip-path:polygon(0_0,100%_0,90%_100%,0_100%)]">
          <img src={fondo} alt="" className="absolute inset-0 size-full object-cover object-left" />
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-black/30" />
          <div className="relative flex h-full flex-col justify-between p-8 text-white">
            <div className="flex items-center justify-between gap-3 pr-10">
              <span className="text-sm font-semibold tracking-wide">INDUFOR SRL</span>
              <span className="rounded-full border border-white/70 px-4 py-1.5 text-xs font-medium">Servicios forestales</span>
            </div>
            <div className="grid max-w-xs gap-1">
              <p className="text-2xl leading-tight font-semibold">Sistema Integral de Gestión y Control</p>
              <p className="text-sm text-white/80">Papel Misionero · Bosques del Plata · Prusia</p>
            </div>
          </div>
        </aside>

        <section className="grid content-center gap-8 px-4 py-8 sm:px-10">
          <div className="flex items-center gap-3">
            <img src="/logo-indufor.png" alt="" width={44} height={44} />
            <span className="text-lg font-bold tracking-wide text-foreground">INDUFOR</span>
          </div>

          <div className="grid gap-2 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Hola de nuevo</h1>
            <p className="text-soft">Ingresá con tu email y tu contraseña</p>
          </div>

          <form onSubmit={enviar} noValidate className="mx-auto grid w-full max-w-sm gap-4">
            {errorGeneral && (
              <p role="alert" className="rounded-xl border border-danger px-3 py-2 text-sm text-danger">
                {errorGeneral}
              </p>
            )}

            <Campo id="email" label="Email" error={formState.errors.email?.message}>
              <Input id="email" type="email" autoComplete="username" inputMode="email" className="h-12 rounded-xl text-base"
                aria-invalid={!!formState.errors.email} aria-describedby="email-error" {...register('email')} />
            </Campo>
            <Campo id="password" label="Contraseña" error={formState.errors.password?.message}>
              <Input id="password" type="password" autoComplete="current-password" className="h-12 rounded-xl text-base"
                aria-invalid={!!formState.errors.password} aria-describedby="password-error" {...register('password')} />
            </Campo>
            <div className="flex items-center gap-2">
              <Checkbox id="recordar" checked={watch('recordar')} onCheckedChange={(v) => setValue('recordar', v === true)} />
              <Label htmlFor="recordar">Mantener la sesión iniciada</Label>
            </div>

            <Button type="submit" className="mt-2 h-12 rounded-full text-base" disabled={login.isPending}>
              {login.isPending ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </form>

          <p className="text-center text-sm text-soft">¿No podés ingresar? Pedí ayuda a Administración.</p>
        </section>
      </div>
    </main>
  )
}
