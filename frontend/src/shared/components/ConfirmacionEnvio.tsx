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
  useEffect(() => titulo.current?.focus(), [])
  // Hora de la confirmación: se fija al mostrarla y no cambia con los re-renders
  const [hora] = useState(() => new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }))
  return (
    <section role="status" className="mx-auto grid max-w-md gap-4 text-base">
      <div className="grid gap-2 rounded-lg border border-approved bg-card p-4">
        <h1 ref={titulo} tabIndex={-1} className="text-xl font-semibold text-approved outline-none">✓ {guardado.titulo}</h1>
        <p className="text-sm text-soft">N.º {guardado.numero} · confirmado por el sistema a las {hora}</p>
        <p className="tabular-nums">{guardado.detalle.filter(Boolean).join(' · ')}</p>
        {guardado.aviso && <p className="rounded-md border border-warning p-3 text-sm">⚠ {guardado.aviso}</p>}
      </div>
      <div className="grid gap-2">
        <Button className="h-12 text-base" onClick={otro}>Cargar otro</Button>
        <Button asChild variant="outline" className="h-12 text-base"><Link to={ver.ruta}>{ver.texto}</Link></Button>
        <Button asChild variant="ghost" className="h-11"><Link to="/">Volver al inicio</Link></Button>
      </div>
    </section>
  )
}
