import type { ReactNode } from 'react'
import { Field, FieldError, FieldLabel } from '@/shared/components/ui/field'

/** Etiqueta + control + error accesible (aria-describedby, anunciado por lectores de pantalla). */
export function Campo({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <Field data-invalid={!!error} className="gap-1.5">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {children}
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </Field>
  )
}
