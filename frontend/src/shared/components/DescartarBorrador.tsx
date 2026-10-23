import { borrarBorrador } from '@/shared/borrador'
import { Button } from '@/shared/components/ui/button'

/**
 * Respuesta 409 CLAVE_REUTILIZADA (D22, specs/05): este borrador ya se registró antes con otros datos.
 * Reenviarlo no sirve; el usuario revisa lo guardado y, si quiere cargar algo nuevo, descarta el borrador.
 */
export function DescartarBorrador({ tipo, idUsuario, verGuardados }: { tipo: string; idUsuario: number; verGuardados: string }) {
  return (
    <div className="grid gap-2 rounded-md border border-warning p-3 text-sm">
      <p>Revisá lo que ya quedó guardado. Si querés cargar un registro nuevo, descartá este borrador y empezá de nuevo.</p>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm"><a href={verGuardados}>Ver lo guardado</a></Button>
        <Button type="button" variant="outline" size="sm" onClick={() => { borrarBorrador(tipo, idUsuario); window.location.reload() }}>
          Descartar este borrador
        </Button>
      </div>
    </div>
  )
}
