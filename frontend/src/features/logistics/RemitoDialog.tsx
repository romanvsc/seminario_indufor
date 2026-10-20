import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { hoy } from '@/features/fronts/api'
import { useTiposMadera } from '@/features/production/api'
import { ApiError } from '@/shared/api/client'
import { Campo } from '@/shared/components/Campo'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { useCamioneros, useCargarRemito, type Viaje } from './api'

const select = 'h-9 w-full rounded-md border border-input bg-card px-3'

/**
 * RF06: Administración carga el remito tal como figura en el papel y el backend coteja.
 * A propósito no se precarga nada del viaje: copiar lo declarado haría que el cotejo nunca detecte diferencias (D05).
 */
export function RemitoDialog({ viaje, onClose }: { viaje: Viaje; onClose: () => void }) {
  const tipos = useTiposMadera()
  const camioneros = useCamioneros(true)
  const cargar = useCargarRemito()
  const [d, setD] = useState({ numero_remito: '', fecha_remito: hoy(), id_transportista: '', tipo_madera_remito: '', volumen_toneladas_remito: '' })
  const [errores, setErrores] = useState<Record<string, string>>({})
  const cambiar = (c: Partial<typeof d>) => setD({ ...d, ...c })

  const enviar = async (ev: FormEvent) => {
    ev.preventDefault()
    const faltan: Record<string, string> = {}
    if (!d.numero_remito.trim()) faltan.numero_remito = 'Ingresá el número de remito.'
    if (!d.id_transportista) faltan.id_transportista = 'Elegí el transportista que figura en el remito.'
    if (!d.tipo_madera_remito) faltan.tipo_madera_remito = 'Elegí el tipo de madera del remito.'
    if (!/^\d{1,8}([.,]\d{1,2})?$/.test(d.volumen_toneladas_remito.trim())) faltan.volumen_toneladas_remito = 'Indicá las toneladas con hasta 2 decimales.'
    setErrores(faltan)
    if (Object.keys(faltan).length) return

    try {
      const r = await cargar.mutateAsync({
        ...d, id_viaje: viaje.id, id_transportista: Number(d.id_transportista), tipo_madera_remito: Number(d.tipo_madera_remito),
        volumen_toneladas_remito: d.volumen_toneladas_remito.trim().replace(',', '.'),
      })
      if (r.cotejo.coincide) toast.success('Remito cargado: coincide con la declaración. Viaje validado.')
      else toast.warning(`Remito cargado con diferencias. Se abrió una solicitud de corrección: ${r.cotejo.diferencias.join(' ')}`, { duration: 10_000 })
      onClose()
    } catch (e) {
      if (e instanceof ApiError && Object.keys(e.details).length) setErrores(Object.fromEntries(Object.entries(e.details).map(([k, v]) => [k, v[0]])))
      else toast.error(e instanceof ApiError ? e.message : 'No se pudo cargar el remito.')
    }
  }

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cargar remito del viaje #{viaje.id}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-soft">
          {viaje.fecha.replace('T', ' ')} · {viaje.origen.nombre} → {viaje.destino} · {viaje.camion.nombre}. Copiá los datos del remito en papel.
        </p>
        <form id="form-remito" onSubmit={enviar} noValidate className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="numero_remito" label="Número de remito" error={errores.numero_remito}>
              <Input id="numero_remito" aria-describedby="numero_remito-error" value={d.numero_remito} onChange={(e) => cambiar({ numero_remito: e.target.value })} />
            </Campo>
            <Campo id="fecha_remito" label="Fecha del remito" error={errores.fecha_remito}>
              <Input id="fecha_remito" type="date" max={hoy()} aria-describedby="fecha_remito-error" value={d.fecha_remito} onChange={(e) => cambiar({ fecha_remito: e.target.value })} />
            </Campo>
          </div>
          <Campo id="id_transportista" label="Transportista según el remito" error={errores.id_transportista}>
            <select id="id_transportista" className={select} aria-describedby="id_transportista-error" value={d.id_transportista} onChange={(e) => cambiar({ id_transportista: e.target.value })}>
              <option value="">Elegí…</option>
              {camioneros.data?.map((u) => <option key={u.id} value={u.id}>{u.apellido}, {u.nombre}</option>)}
            </select>
          </Campo>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="tipo_madera_remito" label="Tipo de madera" error={errores.tipo_madera_remito}>
              <select id="tipo_madera_remito" className={`${select} capitalize`} aria-describedby="tipo_madera_remito-error" value={d.tipo_madera_remito} onChange={(e) => cambiar({ tipo_madera_remito: e.target.value })}>
                <option value="">Elegí…</option>
                {tipos.data?.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </Campo>
            <Campo id="volumen_toneladas_remito" label="Toneladas" error={errores.volumen_toneladas_remito}>
              <Input id="volumen_toneladas_remito" inputMode="decimal" aria-describedby="volumen_toneladas_remito-error" value={d.volumen_toneladas_remito} onChange={(e) => cambiar({ volumen_toneladas_remito: e.target.value })} />
            </Campo>
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="form-remito" disabled={cargar.isPending}>{cargar.isPending ? 'Cotejando…' : 'Cargar y cotejar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
