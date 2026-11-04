import { useState } from 'react'
import { toast } from 'sonner'
import { usePermiso, useUsuarioActual } from '@/features/auth/api'
import { ApiError } from '@/shared/api/client'
import { Badge } from '@/shared/components/ui/badge'
import { Paginacion } from '@/shared/components/Paginacion'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { useCambiarEstado, useUsuarios, type FiltrosUsuarios, type Usuario } from './api'
import { UsuarioDialog } from './UsuarioDialog'
import { useFiltrosUrl } from '@/shared/hooks/useFiltrosUrl'
import { controlSelect, FilterPanel } from '@/shared/components/FilterPanel'
import { PageHeader } from '@/shared/components/PageHeader'
import { StatusBadge } from '@/shared/components/StatusBadge'

export function UsuariosPage() {
  const [filtros, setFiltros] = useFiltrosUrl<FiltrosUsuarios>({ q: '', estado: 'activos', page: 1 })
  const [editando, setEditando] = useState<Usuario | 'nuevo' | null>(null)
  const lista = useUsuarios(filtros)
  const yo = useUsuarioActual().data
  const puedeCrear = usePermiso('users.create')
  const puedeEditar = usePermiso('users.update')
  const puedeDeshabilitar = usePermiso('users.disable')
  const cambiarEstado = useCambiarEstado()

  const alternar = async (u: Usuario) => {
    try {
      await cambiarEstado.mutateAsync({ id: u.id, activo: !u.estado_activo })
      toast.success(u.estado_activo ? `${u.nombre} quedó deshabilitado.` : `${u.nombre} quedó habilitado.`)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'No se pudo cambiar el estado.')
    }
  }

  const meta = lista.data?.meta

  return (
    <section className="grid gap-6">
      <PageHeader eyebrow="Gestión / Usuarios" titulo="Usuarios" descripcion="Personas con acceso al sistema y sus roles"
        accion={puedeCrear && <Button onClick={() => setEditando('nuevo')}>Nuevo usuario</Button>} />

      <FilterPanel limpiable={!!filtros.q || filtros.estado !== 'activos'} onLimpiar={() => setFiltros({ q: '', estado: 'activos', page: 1 })}>
        <div className="col-span-2 grid gap-1.5">
          <Label htmlFor="buscar">Buscar</Label>
          <Input id="buscar" type="search" placeholder="Nombre, apellido o email" className="h-10"
            value={filtros.q} onChange={(e) => setFiltros({ ...filtros, q: e.target.value, page: 1 })} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="estado">Estado</Label>
          <select id="estado" className={controlSelect}
            value={filtros.estado} onChange={(e) => setFiltros({ ...filtros, estado: e.target.value as FiltrosUsuarios['estado'], page: 1 })}>
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
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lista.isPending && (
              <TableRow><TableCell colSpan={5} role="status">Cargando…</TableCell></TableRow>
            )}
            {lista.data?.data.length === 0 && (
              <TableRow><TableCell colSpan={5}>No hay usuarios con esos filtros.</TableCell></TableRow>
            )}
            {lista.data?.data.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.apellido}, {u.nombre}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">{u.roles.map((r) => <Badge key={r.codigo} variant="secondary">{r.nombre}</Badge>)}</div>
                </TableCell>
                <TableCell>
                  <StatusBadge tono={u.estado_activo ? 'success' : 'neutral'}>{u.estado_activo ? '● Activo' : '○ Deshabilitado'}</StatusBadge>
                </TableCell>
                <TableCell className="space-x-2 text-right">
                  {puedeEditar && <Button size="sm" variant="outline" onClick={() => setEditando(u)}>Editar</Button>}
                  {puedeDeshabilitar && u.id !== yo?.id && (
                    <Button size="sm" variant={u.estado_activo ? 'destructive-outline' : 'outline'} disabled={cambiarEstado.isPending} onClick={() => alternar(u)}>
                      {u.estado_activo ? 'Deshabilitar' : 'Habilitar'}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Paginacion meta={meta} onPagina={(page) => setFiltros({ ...filtros, page })} />

      {editando && <UsuarioDialog usuario={editando} onClose={() => setEditando(null)} />}
    </section>
  )
}
