import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { usePermiso } from '@/features/auth/api'
import { ApiError } from '@/shared/api/client'
import { Campo } from '@/shared/components/Campo'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { hoy, useAsignaciones, useAsignar, useFinalizarAsignacion, useUsuariosActivos, type Frente } from './api'

const fecha = (iso: string) => iso.split('-').reverse().join('/')
const mensaje = (e: unknown) => (e instanceof ApiError ? e.message : 'No se pudo guardar.')

/** Historial de asignaciones de un frente. Las asignaciones no se borran: se finalizan con fecha de fin. */
export function AsignacionesDialog({ frente, onClose }: { frente: Frente; onClose: () => void }) {
  const puedeAsignar = usePermiso('fronts.assign-users')
  // D29: sin estos permisos el backend devuelve solo las asignaciones propias
  const gestionaUsuarios = usePermiso('users.view')
  const veTodas = puedeAsignar || gestionaUsuarios
  const lista = useAsignaciones(frente.id)
  const usuarios = useUsuariosActivos(puedeAsignar)
  const asignar = useAsignar()
  const finalizar = useFinalizarAsignacion()
  const [alta, setAlta] = useState({ id_usuario: '', fecha_desde: hoy(), fecha_hasta: '' })
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [cierre, setCierre] = useState<{ id: number; fecha: string } | null>(null)

  const enviarAlta = async (ev: FormEvent) => {
    ev.preventDefault()
    if (!alta.id_usuario) return setErrores({ id_usuario: 'Elegí un usuario.' })
    setErrores({})
    try {
      await asignar.mutateAsync({ id_frente: frente.id, id_usuario: Number(alta.id_usuario), fecha_desde: alta.fecha_desde, fecha_hasta: alta.fecha_hasta || null })
      toast.success('Usuario asignado.')
      setAlta({ ...alta, id_usuario: '', fecha_hasta: '' })
    } catch (e) {
      if (e instanceof ApiError && e.code === 'VALIDACION') setErrores(Object.fromEntries(Object.entries(e.details).map(([k, v]) => [k, v[0]])))
      else toast.error(mensaje(e))
    }
  }

  const confirmarCierre = async () => {
    if (!cierre) return
    try {
      await finalizar.mutateAsync({ id: cierre.id, fecha_hasta: cierre.fecha })
      toast.success('Asignación finalizada.')
      setCierre(null)
    } catch (e) {
      toast.error(mensaje(e))
    }
  }

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{veTodas ? `Asignaciones de ${frente.nombre}` : `Tus asignaciones en ${frente.nombre}`}</DialogTitle>
          {!veTodas && <DialogDescription>Ves solo tus propias asignaciones. El historial completo lo consulta Administración.</DialogDescription>}
        </DialogHeader>

        {puedeAsignar && frente.estado_activo && (
          <form onSubmit={enviarAlta} noValidate className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
            <Campo id="id_usuario" label="Usuario" error={errores.id_usuario}>
              <select id="id_usuario" className="h-9 rounded-md border border-input bg-card px-3" aria-describedby="id_usuario-error"
                value={alta.id_usuario} onChange={(e) => setAlta({ ...alta, id_usuario: e.target.value })}>
                <option value="">Elegí…</option>
                {usuarios.data?.map((u) => <option key={u.id} value={u.id}>{u.apellido}, {u.nombre}</option>)}
              </select>
            </Campo>
            <Campo id="fecha_desde" label="Desde" error={errores.fecha_desde}>
              <Input id="fecha_desde" type="date" aria-describedby="fecha_desde-error" value={alta.fecha_desde} onChange={(e) => setAlta({ ...alta, fecha_desde: e.target.value })} />
            </Campo>
            <Campo id="fecha_hasta" label="Hasta (opcional)" error={errores.fecha_hasta}>
              <Input id="fecha_hasta" type="date" aria-describedby="fecha_hasta-error" min={alta.fecha_desde} value={alta.fecha_hasta} onChange={(e) => setAlta({ ...alta, fecha_hasta: e.target.value })} />
            </Campo>
            <Button type="submit" disabled={asignar.isPending}>{asignar.isPending ? 'Asignando…' : 'Asignar'}</Button>
          </form>
        )}

        {lista.isError && <p role="alert" className="text-danger">{(lista.error as Error).message}</p>}

        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Desde</TableHead>
                <TableHead>Hasta</TableHead>
                {puedeAsignar && <TableHead className="text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.isPending && <TableRow><TableCell colSpan={4} role="status">Cargando…</TableCell></TableRow>}
              {lista.data?.length === 0 && <TableRow><TableCell colSpan={4}>Nadie fue asignado a este frente todavía.</TableCell></TableRow>}
              {lista.data?.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.usuario.apellido}, {a.usuario.nombre}</TableCell>
                  <TableCell>{fecha(a.fecha_desde)}</TableCell>
                  <TableCell>{a.fecha_hasta ? fecha(a.fecha_hasta) : <span className="text-success">● Sin fecha de fin</span>}</TableCell>
                  {puedeAsignar && (
                    <TableCell className="text-right">
                      {!a.fecha_hasta && cierre?.id !== a.id && (
                        <Button size="sm" variant="outline" onClick={() => setCierre({ id: a.id, fecha: hoy() })}>Finalizar</Button>
                      )}
                      {cierre?.id === a.id && (
                        <div className="flex items-center justify-end gap-2">
                          <Input type="date" aria-label="Fecha de fin" className="w-40" min={a.fecha_desde} value={cierre.fecha}
                            onChange={(e) => setCierre({ ...cierre, fecha: e.target.value })} />
                          <Button size="sm" disabled={finalizar.isPending || !cierre.fecha} onClick={confirmarCierre}>Confirmar</Button>
                          <Button size="sm" variant="ghost" onClick={() => setCierre(null)}>Cancelar</Button>
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
