import type { Ref } from 'react'
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group'

/**
 * Opciones grandes para elegir una entre pocas, como el tipo de madera en campo.
 * Con React Hook Form va dentro de un Controller; `refPrimera` permite que el formulario enfoque el campo con error.
 */
export function OpcionesRadio({ leyenda, errorId, error, opciones, value, onChange, refPrimera, alto = 'min-h-12', className = '' }: {
  leyenda: string
  errorId: string
  error?: string
  opciones: { valor: string; texto: string }[]
  value: string
  onChange: (valor: string) => void
  refPrimera?: Ref<HTMLButtonElement>
  alto?: string
  className?: string
}) {
  return (
    <fieldset aria-describedby={errorId} className="grid gap-2">
      <legend className="mb-1 text-sm font-medium">{leyenda}</legend>
      <RadioGroup aria-label={leyenda} value={value} onValueChange={onChange} className="grid-cols-2">
        {opciones.map((o, i) => (
          <label key={o.valor} className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-card px-3 font-medium has-data-[state=checked]:border-primary has-data-[state=checked]:bg-secondary ${alto} ${className}`}>
            <RadioGroupItem ref={i === 0 ? refPrimera : undefined} value={o.valor} className="size-5" />
            {o.texto}
          </label>
        ))}
      </RadioGroup>
      {error && <p id={errorId} role="alert" className="text-sm text-danger">{error}</p>}
    </fieldset>
  )
}
