import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { useTiposMadera } from '@/features/production/api'
import { ApiError } from '@/shared/api/client'
import { Campo } from '@/shared/components/Campo'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { useCamioneros, useResolverSolicitud, useSolicitudes, useTomarSolicitud, type Solicitud } from './api'

const ESTADO_SOLICITUD = { PENDIENTE: '○ Pendiente', EN_REVISION: '↻ En revisión', RESUELTA: '✓ Resuelta' }
const mensaje = (e: unknown, defecto: string) => (e instanceof ApiError ? e.message : defecto)

/** Bandeja de solicitudes de corrección (RF08, D19). Nunca valida a mano: corrige un dato y el backend recoteja. */
export function CorreccionesPage() {
  const lista = useSolicitudes()
  const tomar = useTomarSolicitud()
  const [corrigiendo, setCorrigiendo] = useState<Solicitud | null>(null)

  return (
    <section className="grid gap-4">
      <h1 className="text-2xl font-semibold">Solicitudes de corrección</h1>
      {lista.isError && <p role="alert" className="text-danger">{(lista.error as Error).message}</p>}
      {lista.isPending && <p role="status">Cargando…</p>}
      {lista.data?.length === 0 && <p>No hay solicitudes abiertas.</p>}

      <ul className="grid gap-3">
        {lista.data?.map((s) => (
          <li key={s.id} className="grid gap-2 rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">
                Viaje #{s.viaje.id} · {s.viaje.origen.nombre} → {s.viaje.destino} · {s.viaje.camionero.apellido}, {s.viaje.camionero.nombre}
              </p>
              <span className="text-sm">
                {ESTADO_SOLICITUD[s.estado]}{s.responsable && ` · ${s.responsable.apellido}, ${s.responsable.nombre}`}
              </span>
            </div>
            <p className="whitespace-pre-line text-correction">{s.detalle}</p>
            <div className="flex gap-2">
              {s.estado === 'PENDIENTE' && (
                <Button size="sm" variant="outline" disabled={tomar.isPending}
                  onClick={() => tomar.mutateAsync(s.id).then(() => toast.success('Solicitud en revisión.'), (e) => toast.error(mensaje(e, 'No se pudo tomar.')))}>
                  Tomar
                </Button>
              )}
              <Button size="sm" onClick={() => setCorrigiendo(s)}>Corregir</Button>
            </div>
          </li>
        ))}
      </ul>

      {corrigiendo && <CorregirDialog solicitud={corrigiendo} onClose={() => setCorrigiendo(null)} />}
    </section>
  )
}

function CorregirDialog({ solicitud, onClose }: { solicitud: Solicitud; onClose: () => void }) {
  const v = solicitud.viaje
  const r = v.remito!
  const tipos = useTiposMadera()
  const camioneros = useCamioneros(true)
  const resolver = useResolverSolicitud()
  const inicial = {
    volumen_declarado: v.volumen_declarado, tipo_madera: String(v.tipo_madera.id),
    volumen_toneladas_remito: r.volumen_toneladas, tipo_madera_remito: String(r.tipo_madera.id), id_transportista: String(r.transportista.id),
  }
  const [d, setD] = useState({ ...inicial, motivo: '' })
  const [error, setError] = useState<string | null>(null)
  const cambiar = (c: Partial<typeof d>) => setD({ ...d, ...c })
  const select = 'h-9 w-full rounded-md border border-input bg-card px-3 capitalize'

  const enviar = async (ev: FormEvent) => {
    ev.preventDefault()
    if (d.motivo.trim().length < 5) return setError('Explicá el motivo de la corrección (mínimo 5 caracteres).')
    // Solo viajan los campos que cambiaron: el backend audita antes/después de cada uno
    const cambio = (k: keyof typeof inicial) => d[k] !== inicial[k]
    const viaje = { ...(cambio('volumen_declarado') && { volumen_declarado: d.volumen_declarado.replace(',', '.') }), ...(cambio('tipo_madera') && { tipo_madera: Number(d.tipo_madera) }) }
    const remito = {
      ...(cambio('volumen_toneladas_remito') && { volumen_toneladas_remito: d.volumen_toneladas_remito.replace(',', '.') }),
      ...(cambio('tipo_madera_remito') && { tipo_madera_remito: Number(d.tipo_madera_remito) }),
      ...(cambio('id_transportista') && { id_transportista: Number(d.id_transportista) }),
    }
    try {
      const res = await resolver.mutateAsync({ id: solicitud.id, cuerpo: { motivo: d.motivo.trim(), viaje, remito } })
      if (res.cotejo.coincide) toast.success('Corrección aplicada: el viaje coincide con el remito y quedó validado.')
      else toast.warning(`Corrección aplicada, pero siguen diferencias. Se abrió una nueva solicitud: ${res.cotejo.diferencias.join(' ')}`, { duration: 10_000 })
      onClose()
    } catch (e) {
      setError(mensaje(e, 'No se pudo aplicar la corrección.'))
    }
  }

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Corregir viaje #{v.id} · remito N.º {r.numero}</DialogTitle>
        </DialogHeader>
        <p className="whitespace-pre-line text-sm text-correction">{solicitud.detalle}</p>
        <form id="form-correccion" onSubmit={enviar} noValidate className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <fieldset className="grid gap-3 rounded-lg border border-border p-3">
              <legend className="px-1 text-sm font-medium">Declaración del camionero</legend>
              <Campo id="c-volumen_declarado" label="Toneladas declaradas">
                <Input id="c-volumen_declarado" inputMode="decimal" value={d.volumen_declarado} onChange={(e) => cambiar({ volumen_declarado: e.target.value })} />
              </Campo>
              <Campo id="c-tipo_madera" label="Madera declarada">
                <select id="c-tipo_madera" className={select} value={d.tipo_madera} onChange={(e) => cambiar({ tipo_madera: e.target.value })}>
                  {tipos.data?.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              </Campo>
              <p className="text-sm text-soft">Camionero: {v.camionero.apellido}, {v.camionero.nombre}</p>
            </fieldset>
            <fieldset className="grid gap-3 rounded-lg border border-border p-3">
              <legend className="px-1 text-sm font-medium">Remito</legend>
              <Campo id="c-volumen_toneladas_remito" label="Toneladas del remito">
                <Input id="c-volumen_toneladas_remito" inputMode="decimal" value={d.volumen_toneladas_remito} onChange={(e) => cambiar({ volumen_toneladas_remito: e.target.value })} />
              </Campo>
              <Campo id="c-tipo_madera_remito" label="Madera del remito">
                <select id="c-tipo_madera_remito" className={select} value={d.tipo_madera_remito} onChange={(e) => cambiar({ tipo_madera_remito: e.target.value })}>
                  {tipos.data?.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              </Campo>
              <Campo id="c-id_transportista" label="Transportista del remito">
                <select id="c-id_transportista" className={select} value={d.id_transportista} onChange={(e) => cambiar({ id_transportista: e.target.value })}>
                  {camioneros.data?.map((u) => <option key={u.id} value={u.id}>{u.apellido}, {u.nombre}</option>)}
                </select>
              </Campo>
            </fieldset>
          </div>
          <Campo id="motivo" label="Motivo de la corrección" error={error ?? undefined}>
            <textarea id="motivo" rows={2} className="w-full rounded-md border border-input bg-card p-3" aria-describedby="motivo-error"
              value={d.motivo} onChange={(e) => cambiar({ motivo: e.target.value })} placeholder="Ej.: error de tipeo al cargar el remito" />
          </Campo>
        </form>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="form-correccion" disabled={resolver.isPending}>{resolver.isPending ? 'Recotejando…' : 'Corregir y recotejar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
