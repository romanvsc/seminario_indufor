import { useState } from 'react'
import { toast } from 'sonner'
import { usePermiso } from '@/features/auth/api'
import { ApiError } from '@/shared/api/client'
import { Badge } from '@/shared/components/ui/badge'
import { Paginacion } from '@/shared/components/Paginacion'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { TiposDialog } from './TiposDialog'
import { UnidadDialog } from './UnidadDialog'
import { METRICAS, useCambiarEstado, useTipos, useUnidades, type FiltrosUnidades, type Unidad } from './api'
import { useFiltrosUrl } from '@/shared/hooks/useFiltrosUrl'

const select = 'h-9 rounded-md border border-input bg-card px-3'

export function MaquinariaPage() {
  const [filtros, setFiltros] = useFiltrosUrl<FiltrosUnidades>({ q: '', tipo: '', estado: 'activos', page: 1 })
  const [editando, setEditando] = useState<Unidad | 'nueva' | null>(null)
  const [verTipos, setVerTipos] = useState(false)
  const lista = useUnidades(filtros)
  const tipos = useTipos()
  const puedeGestionar = usePermiso('machinery.manage')
  const cambiarEstado = useCambiarEstado()
  const filtrar = (cambio: Partial<FiltrosUnidades>) => setFiltros({ ...filtros, ...cambio, page: 1 })

  const alternar = async (u: Unidad) => {
    try {
      await cambiarEstado.mutateAsync({ recurso: 'machinery', id: u.id, activo: !u.estado_activo })
      toast.success(u.estado_activo ? `${u.nombre} quedó deshabilitada.` : `${u.nombre} quedó habilitada.`)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'No se pudo cambiar el estado.')
    }
  }

  const meta = lista.data?.meta

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold">Maquinaria</h1>
        {puedeGestionar && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setVerTipos(true)}>Tipos</Button>
            <Button onClick={() => setEditando('nueva')}>Nueva unidad</Button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="buscar">Buscar</Label>
          <Input id="buscar" type="search" placeholder="Nombre o patente" className="w-56" value={filtros.q} onChange={(e) => filtrar({ q: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="tipo">Tipo</Label>
          <select id="tipo" className={select} value={filtros.tipo} onChange={(e) => filtrar({ tipo: e.target.value })}>
            <option value="">Todos</option>
            {tipos.data?.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="estado">Estado</Label>
          <select id="estado" className={select} value={filtros.estado} onChange={(e) => filtrar({ estado: e.target.value as FiltrosUnidades['estado'] })}>
            <option value="activos">Activas</option>
            <option value="inactivos">Deshabilitadas</option>
            <option value="todos">Todas</option>
          </select>
        </div>
      </div>

      {lista.isError && <p role="alert" className="text-danger">{(lista.error as Error).message}</p>}

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unidad</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Frente</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead>Estado</TableHead>
              {puedeGestionar && <TableHead className="text-right">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {lista.isPending && <TableRow><TableCell colSpan={6} role="status">Cargando…</TableCell></TableRow>}
            {lista.data?.data.length === 0 && <TableRow><TableCell colSpan={6}>No hay unidades con esos filtros.</TableCell></TableRow>}
            {lista.data?.data.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="font-medium">{u.nombre}</div>
                  <div className="text-sm text-soft">{u.marca_modelo}{u.dominio_patente && ` · ${u.dominio_patente}`}</div>
                </TableCell>
                <TableCell>{u.tipo.nombre} <Badge variant="secondary">{METRICAS[u.tipo.metrica]}</Badge></TableCell>
                <TableCell>{u.frente?.nombre ?? '—'}</TableCell>
                <TableCell>{u.usuario ? `${u.usuario.apellido}, ${u.usuario.nombre}` : '—'}</TableCell>
                <TableCell>
                  <span className={u.estado_activo ? 'text-success' : 'text-soft'}>{u.estado_activo ? '● Activa' : '○ Deshabilitada'}</span>
                </TableCell>
                {puedeGestionar && (
                  <TableCell className="space-x-2 text-right">
                    <Button size="sm" variant="outline" onClick={() => setEditando(u)}>Editar</Button>
                    <Button size="sm" variant={u.estado_activo ? 'destructive' : 'outline'} disabled={cambiarEstado.isPending} onClick={() => alternar(u)}>
                      {u.estado_activo ? 'Deshabilitar' : 'Habilitar'}
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Paginacion meta={meta} onPagina={(page) => setFiltros({ ...filtros, page })} />

      {editando && <UnidadDialog unidad={editando} onClose={() => setEditando(null)} />}
      {verTipos && <TiposDialog onClose={() => setVerTipos(false)} />}
    </section>
  )
}
