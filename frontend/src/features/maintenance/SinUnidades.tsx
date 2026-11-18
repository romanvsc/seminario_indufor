import { TriangleAlert } from 'lucide-react'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'

/** D28: el usuario no es responsable de ninguna unidad ni está asignado a un frente en la fecha elegida. */
export function SinUnidades() {
  return (
    <Alert variant="warning" role={undefined} className="text-sm">
      <TriangleAlert aria-hidden="true" />
      <AlertDescription>No tenés unidades a cargo ni estabas asignado a un frente en esa fecha. Revisá la fecha o pedí a Administración que te asigne.</AlertDescription>
    </Alert>
  )
}
