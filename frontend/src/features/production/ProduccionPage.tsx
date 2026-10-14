import { useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { usePermiso, useUsuarioActual } from '@/features/auth/api'
import { useFrentes } from '@/features/fronts/api'
import { ApiError } from '@/shared/api/client'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { abrirFoto, useProduccion, useSubirFoto, useTiposMadera, type FiltrosProduccion, type Parte } from './api'

const select = 'h-9 rounded-md border border-input bg-card px-3'
const fecha = (iso: string) => iso.split('-').reverse().join('/')
const COLOR_MADERA: Record<string, string> = { pulpable: 'border-pulpable text-pulpable', aserrable: 'border-aserrable text-aserrable' }

/** Listado de partes con filtros operativos. El backend limita lo visible (frentes asignados o todo). */
export function ProduccionPage() {
  const [filtros, setFiltros] = useState<FiltrosProduccion>({ desde: '', hasta: '', frente: '', tipo_madera: '', page: 1 })
  const lista = useProduccion(filtros)
  const frentes = useFrentes('todos')
  const tipos = useTiposMadera()
  const yo = useUsuarioActual().data
  const puedeCargar = usePermiso('production.create')
  const puedeCorregir = usePermiso('production.update-own')
  const subirFoto = useSubirFoto()
  const filtrar = (c: Partial<FiltrosProduccion>) => setFiltros({ ...filtros, ...c, page: 1 })
  const meta = lista.data?.meta

  const adjuntar = async (p: Parte, archivo: File | undefined) => {
    if (!archivo) return
    try {
      await subirFoto.mutateAsync({ id: p.id, foto: archivo })
      toast.success('Foto adjuntada.')
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'No se pudo subir la foto.')
    }
  }

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold">Producción</h1>
        {puedeCargar && <Button asChild className="h-11"><Link to="/produccion/nuevo">Cargar parte</Link></Button>}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="desde">Desde</Label>
          <Input id="desde" type="date" value={filtros.desde} onChange={(e) => filtrar({ desde: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="hasta">Hasta</Label>
          <Input id="hasta" type="date" min={filtros.desde || undefined} value={filtros.hasta} onChange={(e) => filtrar({ hasta: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="frente">Frente</Label>
          <select id="frente" className={select} value={filtros.frente} onChange={(e) => filtrar({ frente: e.target.value })}>
            <option value="">Todos</option>
            {frentes.data?.data.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="tipo_madera">Madera</Label>
          <select id="tipo_madera" className={select} value={filtros.tipo_madera} onChange={(e) => filtrar({ tipo_madera: e.target.value })}>
            <option value="">Todas</option>
            {tipos.data?.map((t) => <option key={t.id} value={t.id} className="capitalize">{t.nombre}</option>)}
          </select>
        </div>
      </div>

      {lista.isError && <p role="alert" className="text-danger">{(lista.error as Error).message}</p>}

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jornada</TableHead>
              <TableHead>Frente</TableHead>
              <TableHead>Máquina</TableHead>
              <TableHead>Madera</TableHead>
              <TableHead className="text-right">Toneladas</TableHead>
              <TableHead className="text-right">m³</TableHead>
              <TableHead>Registró</TableHead>
              <TableHead>Foto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lista.isPending && <TableRow><TableCell colSpan={8} role="status">Cargando…</TableCell></TableRow>}
            {lista.data?.data.length === 0 && <TableRow><TableCell colSpan={8}>No hay partes con esos filtros.</TableCell></TableRow>}
            {lista.data?.data.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{fecha(p.fecha_registro)}</TableCell>
                <TableCell>{p.frente.nombre}</TableCell>
                <TableCell>{p.unidad.nombre}</TableCell>
                <TableCell>
                  <span className={`rounded-full border px-2 py-0.5 text-sm font-medium capitalize ${COLOR_MADERA[p.tipo_madera.nombre] ?? ''}`}>{p.tipo_madera.nombre}</span>
                </TableCell>
                <TableCell className="text-right tabular-nums">{p.cantidad_toneladas ?? '—'}</TableCell>
                <TableCell className="text-right tabular-nums">{p.metros_cubicos ?? '—'}</TableCell>
                <TableCell>
                  {p.registrado_por.apellido}, {p.registrado_por.nombre}
                  {p.operario && p.operario.id !== p.registrado_por.id && <span className="block text-sm text-soft">Operario: {p.operario.apellido}, {p.operario.nombre}</span>}
                </TableCell>
                <TableCell>
                  {p.tiene_foto && (
                    <Button size="sm" variant="outline" onClick={() => abrirFoto(p.id).catch((e: Error) => toast.error(e.message))}>Ver</Button>
                  )}
                  {!p.tiene_foto && puedeCorregir && p.registrado_por.id === yo?.id && (
                    <label className="inline-flex h-8 cursor-pointer items-center rounded-md border border-input px-3 text-sm focus-within:ring-2 focus-within:ring-ring">
                      Adjuntar
                      <input type="file" accept="image/*" className="sr-only" aria-label={`Adjuntar foto al parte del ${fecha(p.fecha_registro)}`}
                        onChange={(e) => adjuntar(p, e.target.files?.[0])} disabled={subirFoto.isPending} />
                    </label>
                  )}
                  {!p.tiene_foto && !(puedeCorregir && p.registrado_por.id === yo?.id) && <span className="text-soft">—</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {meta && meta.last_page > 1 && (
        <nav aria-label="Paginación" className="flex items-center gap-3">
          <Button variant="outline" size="sm" disabled={meta.current_page <= 1} onClick={() => setFiltros({ ...filtros, page: filtros.page - 1 })}>Anterior</Button>
          <span className="text-sm text-soft">Página {meta.current_page} de {meta.last_page}</span>
          <Button variant="outline" size="sm" disabled={meta.current_page >= meta.last_page} onClick={() => setFiltros({ ...filtros, page: filtros.page + 1 })}>Siguiente</Button>
        </nav>
      )}
    </section>
  )
}
