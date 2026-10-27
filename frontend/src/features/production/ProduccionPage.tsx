import { useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { usePermiso, useUsuarioActual } from '@/features/auth/api'
import { useFrentes } from '@/features/fronts/api'
import { useUnidadesTodas } from '@/features/machinery/api'
import { ApiError } from '@/shared/api/client'
import { Paginacion } from '@/shared/components/Paginacion'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { abrirFoto, useOperarios, useProduccion, useSubirFoto, useTiposMadera, type FiltrosProduccion, type Parte } from './api'
import { CorregirParteDialog } from './CorregirParteDialog'
import { useFiltrosUrl } from '@/shared/hooks/useFiltrosUrl'

const select = 'h-9 rounded-md border border-input bg-card px-3'
const fecha = (iso: string) => iso.split('-').reverse().join('/')
const COLOR_MADERA: Record<string, string> = { pulpable: 'border-pulpable text-pulpable', aserrable: 'border-aserrable text-aserrable' }

/** Listado de partes con filtros operativos. El backend limita lo visible (frentes asignados o todo). */
export function ProduccionPage() {
  const [filtros, setFiltros] = useFiltrosUrl<FiltrosProduccion>({ desde: '', hasta: '', frente: '', tipo_madera: '', unidad: '', operario: '', page: 1 })
  const lista = useProduccion(filtros)
  const frentes = useFrentes('todos')
  const tipos = useTiposMadera()
  const unidades = useUnidadesTodas()
  // RF16: el filtro por operario es para quien consulta todo (Administración, Gerencia), que también puede listar usuarios
  const verUsuarios = usePermiso('users.view')
  const operarios = useOperarios(verUsuarios)
  const yo = useUsuarioActual().data
  const puedeCargar = usePermiso('production.create')
  const puedeCorregir = usePermiso('production.update-own')
  const subirFoto = useSubirFoto()
  const [corrigiendo, setCorrigiendo] = useState<Parte | null>(null)
  // I-03.1: solo el autor ve "Corregir"; el backend lo vuelve a verificar
  const esMio = (p: Parte) => puedeCorregir && p.registrado_por.id === yo?.id
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
        <div className="grid gap-1.5">
          <Label htmlFor="unidad">Máquina</Label>
          <select id="unidad" className={select} value={filtros.unidad} onChange={(e) => filtrar({ unidad: e.target.value })}>
            <option value="">Todas</option>
            {unidades.data?.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
          </select>
        </div>
        {verUsuarios && (
          <div className="grid gap-1.5">
            <Label htmlFor="operario">Operario</Label>
            <select id="operario" className={select} value={filtros.operario} onChange={(e) => filtrar({ operario: e.target.value })}>
              <option value="">Todos</option>
              {operarios.data?.map((u) => <option key={u.id} value={u.id}>{u.apellido}, {u.nombre}</option>)}
            </select>
          </div>
        )}
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
              <TableHead><span className="sr-only">Acciones</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lista.isPending && <TableRow><TableCell colSpan={9} role="status">Cargando…</TableCell></TableRow>}
            {lista.data?.data.length === 0 && <TableRow><TableCell colSpan={9}>No hay partes con esos filtros.</TableCell></TableRow>}
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
                  {!p.tiene_foto && esMio(p) && (
                    <label className="inline-flex h-8 cursor-pointer items-center rounded-md border border-input px-3 text-sm focus-within:ring-2 focus-within:ring-ring">
                      Adjuntar
                      <input type="file" accept="image/*" className="sr-only" aria-label={`Adjuntar foto al parte del ${fecha(p.fecha_registro)}`}
                        onChange={(e) => adjuntar(p, e.target.files?.[0])} disabled={subirFoto.isPending} />
                    </label>
                  )}
                  {!p.tiene_foto && !esMio(p) && <span className="text-soft">—</span>}
                </TableCell>
                <TableCell>
                  {esMio(p) && (
                    <Button size="sm" variant="outline" onClick={() => setCorrigiendo(p)} aria-label={`Corregir el parte del ${fecha(p.fecha_registro)} en ${p.frente.nombre}`}>Corregir</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {corrigiendo && yo && <CorregirParteDialog parte={corrigiendo} idUsuario={yo.id} onClose={() => setCorrigiendo(null)} />}

      <Paginacion meta={meta} onPagina={(page) => setFiltros({ ...filtros, page })} />
    </section>
  )
}
