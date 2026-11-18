import { TriangleAlert } from 'lucide-react'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/shared/components/ui/button'

export type Guardado = { titulo: string; numero: number; detalle: (string | null | undefined)[]; aviso?: string }

/**
 * Spec 07 (CA-07.5): constancia de lo que se guardó, que queda en pantalla hasta que el usuario elige qué hacer.
 * Solo se muestra con la confirmación del backend en la mano (nunca "guardado" sin respuesta).
 */
export function ConfirmacionEnvio({ guardado, otro, ver }: { guardado: Guardado; otro: () => void; ver: { texto: string; ruta: string } }) {
  const titulo = useRef<HTMLHeadingElement>(null)
  useEffect(() => { titulo.current?.focus() }, [])
  // Hora de la confirmación: se fija al mostrarla y no cambia con los re-renders
  const [hora] = useState(() => new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }))
  return (
    <section role="status" className="mx-auto grid max-w-md gap-4 text-base">
      <div className="grid gap-2 rounded-2xl border border-approved bg-card p-4">
        <h1 ref={titulo} tabIndex={-1} className="text-xl font-semibold text-approved outline-none">✓ {guardado.titulo}</h1>
        <p className="text-sm text-soft">N.º {guardado.numero} · confirmado por el sistema a las {hora}</p>
        <p>{guardado.detalle.filter(Boolean).join(' · ')}</p>
        {guardado.aviso && <Alert variant="warning" role={undefined} className="text-sm"><TriangleAlert aria-hidden="true" /><AlertDescription>{guardado.aviso}</AlertDescription></Alert>}
      </div>
      <div className="grid gap-2">
        <Button className="h-12 text-base" onClick={otro}>Cargar otro</Button>
        <Button asChild variant="outline" className="h-12 text-base"><Link viewTransition to={ver.ruta}>{ver.texto}</Link></Button>
        <Button asChild variant="ghost" className="h-11"><Link viewTransition to="/">Volver al inicio</Link></Button>
      </div>
    </section>
  )
}
