import { Upload } from 'lucide-react'
import { useState, type Ref } from 'react'

/**
 * Selector de archivo de 44 px con textos propios (MOB-10): el control nativo es chico y muestra los textos del
 * navegador ("Choose File"). El input real queda encima del botón, transparente: es lo que se toca, recibe el foco
 * y conserva su etiqueta (`Campo`). Para vaciarlo desde afuera, remontarlo con otra `key`.
 */
export function SelectorArchivo({ id, ref, accept, capture, texto, onChange }: {
  id: string
  ref?: Ref<HTMLInputElement>
  accept: string
  capture?: 'environment' | 'user'
  texto: string
  onChange?: (hayArchivo: boolean) => void
}) {
  const [nombre, setNombre] = useState<string | null>(null)
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
      <span className="relative inline-flex min-h-11 items-center gap-2 rounded-md border border-input bg-card px-4 text-base font-medium focus-within:ring-2 focus-within:ring-ring hover:bg-secondary md:min-h-9 md:text-sm">
        <Upload aria-hidden="true" size={18} />{texto}
        <input id={id} ref={ref} type="file" accept={accept} capture={capture} className="absolute -inset-px cursor-pointer opacity-0"
          onChange={(e) => { const f = e.target.files?.[0]; setNombre(f?.name ?? null); onChange?.(!!f) }} />
      </span>
      <span className="min-w-0 truncate text-sm text-soft" aria-live="polite">{nombre ?? 'Ningún archivo elegido'}</span>
    </div>
  )
}
