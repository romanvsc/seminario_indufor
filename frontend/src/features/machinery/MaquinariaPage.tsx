import { Cargando } from '@/shared/components/Cargando'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { FiltroAutocompletable } from '@/shared/components/FiltroAutocompletable'
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
import { FilterPanel } from '@/shared/components/FilterPanel'
import { PageHeader } from '@/shared/components/PageHeader'
import { StatusBadge } from '@/shared/components/StatusBadge'


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
    <section className="grid gap-6">
      <PageHeader eyebrow="Gestión / Maquinaria" titulo="Maquinaria" descripcion="Unidades, su tipo, métrica de lectura y frente"
        accion={puedeGestionar && (
          <>
            <Button variant="outline" onClick={() => setVerTipos(true)}>Tipos</Button>
            <Button onClick={() => setEditando('nueva')}>Nueva unidad</Button>
          </>
        )} />

      <FilterPanel limpiable={!!filtros.q || !!filtros.tipo || filtros.estado !== 'activos'} onLimpiar={() => setFiltros({ q: '', tipo: '', estado: 'activos', page: 1 })}>
        <div className="col-span-2 grid gap-1.5">
          <Label htmlFor="buscar">Buscar</Label>
          <Input id="buscar" type="search" placeholder="Nombre o patente" className="h-10" value={filtros.q} onChange={(e) => filtrar({ q: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="tipo">Tipo</Label>
          <FiltroAutocompletable id="tipo" cargando={tipos.isLoading} error={tipos.isError} className="h-10" value={filtros.tipo} onChange={(valor) => filtrar({ tipo: valor })}>
            <option value="">Todos</option>
            {tipos.data?.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </FiltroAutocompletable>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="estado">Estado</Label>
          <FiltroAutocompletable id="estado" className="h-10" value={filtros.estado} onChange={(valor) => filtrar({ estado: valor as FiltrosUnidades['estado'] })}>
            <option value="activos">Activas</option>
            <option value="inactivos">Deshabilitadas</option>
            <option value="todos">Todas</option>
          </FiltroAutocompletable>
        </div>
      </FilterPanel>

      {lista.isError && <Alert variant="destructive"><AlertDescription>{(lista.error as Error).message}</AlertDescription></Alert>}

      <div className="surface overflow-x-auto">
        <Table className="tabla-apilada">
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
            {lista.isPending && <TableRow><TableCell colSpan={6} role="status"><Cargando /></TableCell></TableRow>}
            {lista.data?.data.length === 0 && <TableRow><TableCell colSpan={6}>No hay unidades con esos filtros.</TableCell></TableRow>}
            {lista.data?.data.map((u) => (
              <TableRow key={u.id}>
                <TableCell data-label="Unidad">
                  <div className="font-mono font-medium">{u.nombre}</div>
                  <div className="text-sm text-soft">{u.marca_modelo}{u.dominio_patente && ` · ${u.dominio_patente}`}</div>
                </TableCell>
                <TableCell data-label="Tipo">{u.tipo.nombre} <Badge variant="secondary">{METRICAS[u.tipo.metrica]}</Badge></TableCell>
                <TableCell data-label="Frente">{u.frente?.nombre ?? '—'}</TableCell>
                <TableCell data-label="Responsable">{u.usuario ? `${u.usuario.apellido}, ${u.usuario.nombre}` : '—'}</TableCell>
                <TableCell data-label="Estado">
                  <StatusBadge tono={u.estado_activo ? 'success' : 'neutral'}>{u.estado_activo ? '● Activa' : '○ Deshabilitada'}</StatusBadge>
                </TableCell>
                {puedeGestionar && (
                  <TableCell>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button size="sm" variant="outline" className="h-11 sm:h-8" onClick={() => setEditando(u)}>Editar</Button>
                      <Button size="sm" variant={u.estado_activo ? 'destructive-outline' : 'outline'} className="h-11 sm:h-8" disabled={cambiarEstado.isPending} onClick={() => alternar(u)}>
                        {u.estado_activo ? 'Deshabilitar' : 'Habilitar'}
                      </Button>
                    </div>
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
