import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, type CSSProperties } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { z } from 'zod'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { ApiError } from '@/shared/api/client'
import { Campo } from '@/shared/components/Campo'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import fondo from '@/images/background_login.jpg'
import { PageHeader } from '@/shared/components/PageHeader'
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

  // El fondo de la app se descarga mientras se completa el formulario: así no aparece tarde al entrar
  useEffect(() => { import('@/shared/components/ui/Grainient').catch(() => {}) }, [])

  // UIX-037: al entrar se funde la página entera (mismo patrón que el cambio de tema), en vez del corte seco
  const entrar = (a: string) => {
    const raiz = document.documentElement
    if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      void navigate(a, { replace: true })
      return
    }
    raiz.dataset.ingreso = ''
    // flushSync deja el DOM nuevo listo en el acto; no se devuelve la promesa de navigate para no congelar la captura
    void document.startViewTransition(() => { void navigate(a, { replace: true, flushSync: true }) }).finished.finally(() => delete raiz.dataset.ingreso)
  }

  if (usuario) return <Navigate to={destino} replace />

  const enviar = handleSubmit((datos) =>
    login.mutate(datos, {
      onSuccess: () => entrar(destino),
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

      {/* UIX-037: la misma superficie que el resto de la app; la entrada reutiliza el keyframe de las vistas */}
      <div className="login-entrada surface grid w-full max-w-5xl overflow-hidden md:min-h-[34rem] md:grid-cols-[1.05fr_1fr]">
        {/* Panel de la foto: decorativo, solo en pantallas anchas */}
        <aside aria-hidden="true" className="relative hidden md:block">
          <img src={fondo} alt="" className="absolute inset-0 size-full object-cover object-left" />
          <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-black/35" />
          <div className="login-entrada relative flex h-full flex-col justify-between p-8 text-white" style={{ '--orden': 1 } as CSSProperties}>
            <p className="text-xs font-semibold tracking-[0.16em] text-white/85 uppercase">Servicios forestales</p>
            <div className="grid max-w-xs gap-1.5">
              <p className="text-2xl leading-tight font-semibold">Sistema Integral de Gestión y Control</p>
              <p className="text-sm text-white/80">Papel Misionero · Bosques del Plata · Prusia</p>
            </div>
          </div>
        </aside>

        {/* Una sola columna de lectura: marca, saludo, formulario y ayuda comparten el borde izquierdo */}
        <section className="mx-auto grid w-full max-w-sm grid-rows-[auto_1fr_auto] gap-10 px-6 py-8 sm:py-10 md:px-2">
          <div className="flex items-center gap-2">
            <img src="/icons/icon-192.png" alt="" width={28} height={28} className="rounded-md" />
            <span className="text-lg font-semibold">INDUFOR</span>
          </div>

          <div className="grid content-center gap-8">
            <div className="login-entrada" style={{ '--orden': 1 } as CSSProperties}>
              <PageHeader titulo="Hola de nuevo" descripcion="Ingresá con tu email y tu contraseña" />
            </div>

            <form onSubmit={enviar} noValidate className="login-entrada grid gap-4" style={{ '--orden': 2 } as CSSProperties}>
              {errorGeneral && (
                <Alert variant="destructive" className="text-sm"><AlertDescription>{errorGeneral}</AlertDescription></Alert>
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
                <Label htmlFor="recordar" className="min-h-11 flex-1">Mantener la sesión iniciada</Label>
              </div>

              <Button type="submit" className="mt-2 h-12 text-base" disabled={login.isPending}>
                {login.isPending ? 'Ingresando…' : 'Ingresar'}
              </Button>
            </form>
          </div>

          <p className="login-entrada text-sm text-soft" style={{ '--orden': 2 } as CSSProperties}>¿No podés ingresar? Pedí ayuda a Administración.</p>
        </section>
      </div>
    </main>
  )
}
