import { toast } from 'sonner'
import { fecha, m3, toneladas } from '@/features/reports/formato'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { abrirFoto, useParte, type Parte } from './api'

const MODALIDAD = { CONSOLIDADA: 'carga consolidada', INDIVIDUAL: 'carga individual' }

export function DetalleParteDialog({ parte, onClose }: { parte: Parte; onClose: () => void }) {
  const p = useParte(parte).data ?? parte
  const nombre = (x: { apellido: string; nombre: string }) => `${x.apellido}, ${x.nombre}`
  const filas: [string, string][] = [
    ['Frente', `${p.frente.nombre} (${MODALIDAD[p.frente.modalidad]})`],
    ['Máquina', p.unidad.nombre],
    ['Madera', p.tipo_madera.nombre],
    ['Toneladas', toneladas(p.cantidad_toneladas)],
    ['Metros cúbicos', m3(p.metros_cubicos)],
    ['Registró', nombre(p.registrado_por)],
    ...(p.operario && p.operario.id !== p.registrado_por.id ? [['Operario', nombre(p.operario)] as [string, string]] : []),
    ['Observaciones', p.observaciones || 'Sin observaciones'],
  ]
  return (
    <Dialog open onOpenChange={(abierto) => !abierto && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Parte del {fecha(p.fecha_registro)}</DialogTitle>
          <DialogDescription>Parte diario #{p.id}</DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
          {filas.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-soft">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
          <dt className="text-soft">Foto</dt>
          <dd>
            {p.tiene_foto
              ? <Button size="sm" variant="outline" onClick={() => abrirFoto(p.id).catch((e: Error) => toast.error(e.message))}>Ver foto</Button>
              : <span className="text-soft">Sin foto</span>}
          </dd>
        </dl>
      </DialogContent>
    </Dialog>
  )
}
