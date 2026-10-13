import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { ApiError } from '@/shared/api/client'
import { Campo } from '@/shared/components/Campo'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { METRICAS, useCambiarEstado, useGuardarTipo, useTipos, type Metrica } from './api'

/** Catálogo de tipos de maquinaria (solo machinery.manage). La métrica define qué se lee en mantenimiento (D08). */
export function TiposDialog({ onClose }: { onClose: () => void }) {
  const tipos = useTipos('todos')
  const guardar = useGuardarTipo()
  const cambiarEstado = useCambiarEstado()
  const [alta, setAlta] = useState({ nombre: '', metrica: '' })
  const [errores, setErrores] = useState<Record<string, string>>({})

  const enviar = async (ev: FormEvent) => {
    ev.preventDefault()
    const faltan = { ...(!alta.nombre.trim() && { nombre: 'Ingresá el nombre.' }), ...(!alta.metrica && { metrica: 'Elegí la métrica.' }) }
    setErrores(faltan)
    if (Object.keys(faltan).length) return
    try {
      await guardar.mutateAsync({ datos: { nombre: alta.nombre.trim(), metrica: alta.metrica as Metrica } })
      toast.success('Tipo creado.')
      setAlta({ nombre: '', metrica: '' })
    } catch (e) {
      if (e instanceof ApiError && e.code === 'VALIDACION') setErrores(Object.fromEntries(Object.entries(e.details).map(([k, v]) => [k, v[0]])))
      else toast.error(e instanceof ApiError ? e.message : 'No se pudo guardar.')
    }
  }

  const alternar = async (id: number, activo: boolean) => {
    try {
      await cambiarEstado.mutateAsync({ recurso: 'machinery-types', id, activo })
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'No se pudo cambiar el estado.')
    }
  }

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tipos de maquinaria</DialogTitle>
        </DialogHeader>
        <form onSubmit={enviar} noValidate className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
          <Campo id="tipo-nombre" label="Nombre" error={errores.nombre}>
            <Input id="tipo-nombre" aria-describedby="tipo-nombre-error" value={alta.nombre} onChange={(e) => setAlta({ ...alta, nombre: e.target.value })} />
          </Campo>
          <Campo id="tipo-metrica" label="Métrica" error={errores.metrica}>
            <select id="tipo-metrica" className="h-9 rounded-md border border-input bg-card px-3" aria-describedby="tipo-metrica-error"
              value={alta.metrica} onChange={(e) => setAlta({ ...alta, metrica: e.target.value })}>
              <option value="">Elegí…</option>
              {Object.entries(METRICAS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
          </Campo>
          <Button type="submit" disabled={guardar.isPending}>Agregar</Button>
        </form>
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Tipo</TableHead><TableHead>Métrica</TableHead><TableHead className="text-right">Estado</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {tipos.isPending && <TableRow><TableCell colSpan={3} role="status">Cargando…</TableCell></TableRow>}
              {tipos.data?.length === 0 && <TableRow><TableCell colSpan={3}>Todavía no hay tipos cargados.</TableCell></TableRow>}
              {tipos.data?.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.nombre}</TableCell>
                  <TableCell>{METRICAS[t.metrica]}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" disabled={cambiarEstado.isPending} onClick={() => alternar(t.id, !t.estado_activo)}>
                      {t.estado_activo ? 'Deshabilitar' : 'Habilitar'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
