import { useState } from 'react'
import { toast } from 'sonner'
import { usePermiso } from '@/features/auth/api'
import { ApiError } from '@/shared/api/client'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { AsignacionesDialog } from './AsignacionesDialog'
import { FrenteDialog } from './FrenteDialog'
import { MODALIDADES, useCambiarEstadoFrente, useFrentes, type Frente } from './api'
import { controlSelect, FilterPanel } from '@/shared/components/FilterPanel'
import { PageHeader } from '@/shared/components/PageHeader'
import { StatusBadge } from '@/shared/components/StatusBadge'

type Estado = 'activos' | 'inactivos' | 'todos'

export function FrentesPage() {
  const [estado, setEstado] = useState<Estado>('activos')
  const [editando, setEditando] = useState<Frente | 'nuevo' | null>(null)
  const [viendo, setViendo] = useState<Frente | null>(null)
  const lista = useFrentes(estado)
  const puedeGestionar = usePermiso('fronts.manage')
  const cambiarEstado = useCambiarEstadoFrente()

  const alternar = async (f: Frente) => {
    try {
      await cambiarEstado.mutateAsync({ id: f.id, activo: !f.estado_activo })
      toast.success(f.estado_activo ? `${f.nombre} quedó deshabilitado.` : `${f.nombre} quedó habilitado.`)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'No se pudo cambiar el estado.')
    }
  }

  return (
    <section className="grid gap-6">
      <PageHeader eyebrow="Gestión / Frentes" titulo="Frentes" descripcion="Frentes de trabajo, su modalidad de carga y quiénes están asignados"
        accion={puedeGestionar && <Button onClick={() => setEditando('nuevo')}>Nuevo frente</Button>} />

      <FilterPanel limpiable={estado !== 'activos'} onLimpiar={() => setEstado('activos')}>
        <div className="grid gap-1.5">
          <Label htmlFor="estado">Estado</Label>
          <select id="estado" className={controlSelect} value={estado} onChange={(e) => setEstado(e.target.value as Estado)}>
            <option value="activos">Activos</option>
            <option value="inactivos">Deshabilitados</option>
            <option value="todos">Todos</option>
          </select>
        </div>
      </FilterPanel>

      {lista.isError && <p role="alert" className="text-danger">{(lista.error as Error).message}</p>}

      <div className="surface overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Modalidad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lista.isPending && <TableRow><TableCell colSpan={5} role="status">Cargando…</TableCell></TableRow>}
            {lista.data?.data.length === 0 && <TableRow><TableCell colSpan={5}>No hay frentes con ese estado.</TableCell></TableRow>}
            {lista.data?.data.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.nombre}</TableCell>
                <TableCell>{f.ubicacion ?? '—'}</TableCell>
                <TableCell><Badge variant="secondary">{MODALIDADES[f.modalidad]}</Badge></TableCell>
                <TableCell>
                  <StatusBadge tono={f.estado_activo ? 'success' : 'neutral'}>{f.estado_activo ? '● Activo' : '○ Deshabilitado'}</StatusBadge>
                </TableCell>
                <TableCell className="space-x-2 text-right">
                  <Button size="sm" variant="outline" onClick={() => setViendo(f)}>Asignaciones</Button>
                  {puedeGestionar && <Button size="sm" variant="outline" onClick={() => setEditando(f)}>Editar</Button>}
                  {puedeGestionar && (
                    <Button size="sm" variant={f.estado_activo ? 'destructive-outline' : 'outline'} disabled={cambiarEstado.isPending} onClick={() => alternar(f)}>
                      {f.estado_activo ? 'Deshabilitar' : 'Habilitar'}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editando && <FrenteDialog frente={editando} onClose={() => setEditando(null)} />}
      {viendo && <AsignacionesDialog frente={viendo} onClose={() => setViendo(null)} />}
    </section>
  )
}
