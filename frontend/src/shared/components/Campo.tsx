import type { ReactNode } from 'react'
import { Label } from '@/shared/components/ui/label'

/** Etiqueta + control + error accesible (aria-describedby, anunciado por lectores de pantalla). */
export function Campo({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
