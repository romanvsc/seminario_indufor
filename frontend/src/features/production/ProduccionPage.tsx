import { ChevronRightIcon } from '@animateicons/react/lucide/chevron-right-icon'
import { ImageIcon } from '@animateicons/react/lucide/image-icon'
import { LayersIcon } from '@animateicons/react/lucide/layers-icon'
import { ListIcon } from '@animateicons/react/lucide/list-icon'
import { Trees, Weight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { usePermiso, useUsuarioActual } from '@/features/auth/api'
import { useFrentes } from '@/features/fronts/api'
import { useUnidadesTodas } from '@/features/machinery/api'
import { fecha, numero } from '@/features/reports/formato'
import { ApiError } from '@/shared/api/client'
import { controlSelect, FilterPanel, type FiltroActivo } from '@/shared/components/FilterPanel'
import { KpiCard } from '@/shared/components/KpiCard'
import { PageHeader } from '@/shared/components/PageHeader'
import { Paginacion } from '@/shared/components/Paginacion'
import { StatusBadge, type TonoEstado } from '@/shared/components/StatusBadge'
import { FilaEstado, TablaPanel } from '@/shared/components/TablaPanel'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { abrirFoto, useOperarios, useProduccion, useSubirFoto, useTiposMadera, type FiltrosProduccion, type Parte } from './api'
import { CorregirParteDialog } from './CorregirParteDialog'
import { DetalleParteDialog } from './DetalleParteDialog'
import { useFiltrosUrl } from '@/shared/hooks/useFiltrosUrl'

const TONO_MADERA: Record<string, TonoEstado> = { pulpable: 'pulpable', aserrable: 'aserrable' }
const VACIOS: FiltrosProduccion = { desde: '', hasta: '', frente: '', tipo_madera: '', unidad: '', operario: '', page: 1 }
type Clave = Exclude<keyof FiltrosProduccion, 'page'>

/** Listado de partes con filtros operativos. El backend limita lo visible (frentes asignados o todo). */
export function ProduccionPage() {
  const [filtros, setFiltros] = useFiltrosUrl<FiltrosProduccion>(VACIOS)
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
  const [viendo, setViendo] = useState<Parte | null>(null)
  // I-03.1: solo el autor ve "Corregir"; el backend lo vuelve a verificar
  const esMio = (p: Parte) => puedeCorregir && p.registrado_por.id === yo?.id
  const filtrar = (c: Partial<FiltrosProduccion>) => setFiltros({ ...filtros, ...c, page: 1 })
  const meta = lista.data?.meta
  const resumen = lista.data?.resumen

  const nombreDe = <T extends { id: number }>(items: T[] | undefined, id: string, texto: (x: T) => string) => {
    const x = items?.find((i) => String(i.id) === id)
    return x ? texto(x) : id
  }
  const activos: FiltroActivo<Clave>[] = [
    filtros.desde && { clave: 'desde' as const, texto: `Desde: ${fecha(filtros.desde)}` },
    filtros.hasta && { clave: 'hasta' as const, texto: `Hasta: ${fecha(filtros.hasta)}` },
    filtros.frente && { clave: 'frente' as const, texto: `Frente: ${nombreDe(frentes.data?.data, filtros.frente, (f) => f.nombre)}` },
    filtros.tipo_madera && { clave: 'tipo_madera' as const, texto: `Madera: ${nombreDe(tipos.data, filtros.tipo_madera, (t) => t.nombre)}` },
    filtros.unidad && { clave: 'unidad' as const, texto: `Máquina: ${nombreDe(unidades.data, filtros.unidad, (u) => u.nombre)}` },
    filtros.operario && { clave: 'operario' as const, texto: `Operario: ${nombreDe(operarios.data, filtros.operario, (u) => `${u.apellido}, ${u.nombre}`)}` },
  ].filter((a) => !!a)

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
    <section className="grid gap-6">
      <PageHeader eyebrow="Operación / Producción" titulo="Producción forestal" descripcion="Consulta y seguimiento de partes diarios"
        accion={puedeCargar && <Button asChild className="h-11"><Link to="/produccion/nuevo">Cargar parte</Link></Button>} />

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <KpiCard icono={<LayersIcon size={22} />} titulo="Partes" valor={meta ? String(meta.total) : '…'} detalle="Registros con estos filtros" />
        <KpiCard icono={<Weight size={22} />} titulo="Toneladas" valor={resumen ? `${numero(resumen.toneladas)} t` : '…'}
          detalle={resumen && Number(resumen.metros_cubicos) > 0 ? `y ${numero(resumen.metros_cubicos)} m³` : 'Total con estos filtros'} />
        <KpiCard icono={<Trees size={22} />} titulo="Frentes" valor={resumen ? String(resumen.frentes) : '…'} detalle="Con partes en el resultado" />
      </div>

      <FilterPanel activos={activos} onQuitar={(clave) => filtrar({ [clave]: '' })} onLimpiar={() => setFiltros(VACIOS)}>
        <div className="grid gap-1.5">
          <Label htmlFor="desde">Desde</Label>
          <Input id="desde" type="date" className="h-10" value={filtros.desde} onChange={(e) => filtrar({ desde: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="hasta">Hasta</Label>
          <Input id="hasta" type="date" className="h-10" min={filtros.desde || undefined} value={filtros.hasta} onChange={(e) => filtrar({ hasta: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="frente">Frente</Label>
          <select id="frente" className={controlSelect} value={filtros.frente} onChange={(e) => filtrar({ frente: e.target.value })}>
            <option value="">Todos</option>
            {frentes.data?.data.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="tipo_madera">Madera</Label>
          <select id="tipo_madera" className={controlSelect} value={filtros.tipo_madera} onChange={(e) => filtrar({ tipo_madera: e.target.value })}>
            <option value="">Todas</option>
            {tipos.data?.map((t) => <option key={t.id} value={t.id} className="capitalize">{t.nombre}</option>)}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="unidad">Máquina</Label>
          <select id="unidad" className={controlSelect} value={filtros.unidad} onChange={(e) => filtrar({ unidad: e.target.value })}>
            <option value="">Todas</option>
            {unidades.data?.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
          </select>
        </div>
        {verUsuarios && (
          <div className="grid gap-1.5">
            <Label htmlFor="operario">Operario</Label>
            <select id="operario" className={controlSelect} value={filtros.operario} onChange={(e) => filtrar({ operario: e.target.value })}>
              <option value="">Todos</option>
              {operarios.data?.map((u) => <option key={u.id} value={u.id}>{u.apellido}, {u.nombre}</option>)}
            </select>
          </div>
        )}
      </FilterPanel>

      <TablaPanel titulo="Registros de producción" icono={<ListIcon size={20} />} contador={meta && (meta.total === 1 ? '1 resultado' : `${meta.total} resultados`)}>
        <Table className="tabla-apilada">
          <TableHeader>
            <TableRow>
              <TableHead aria-sort="descending" className="pl-4 sm:pl-5">Fecha ↓</TableHead>
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
            {lista.isPending && <FilaEstado tipo="cargando" columnas={9}>Cargando…</FilaEstado>}
            {lista.isError && <FilaEstado tipo="error" columnas={9}>{(lista.error as Error).message}</FilaEstado>}
            {lista.data?.data.length === 0 && <FilaEstado tipo="vacio" columnas={9}>No hay partes con esos filtros. Probá ampliar las fechas o quitar algún filtro.</FilaEstado>}
            {lista.data?.data.map((p) => (
              <TableRow key={p.id} className="h-14">
                <TableCell data-label="Fecha" className="pl-4 tabular-nums sm:pl-5">{fecha(p.fecha_registro)}</TableCell>
                <TableCell data-label="Frente" className="font-medium">{p.frente.nombre}</TableCell>
                <TableCell data-label="Máquina">{p.unidad.nombre}</TableCell>
                <TableCell data-label="Madera"><StatusBadge tono={TONO_MADERA[p.tipo_madera.nombre] ?? 'neutral'} className="capitalize">{p.tipo_madera.nombre}</StatusBadge></TableCell>
                <TableCell data-label="Toneladas" className="text-right font-medium tabular-nums">{p.cantidad_toneladas ? numero(p.cantidad_toneladas) : <span className="text-soft">—</span>}</TableCell>
                <TableCell data-label="m³" className="text-right font-medium tabular-nums">{p.metros_cubicos ? numero(p.metros_cubicos) : <span className="text-soft">—</span>}</TableCell>
                <TableCell data-label="Registró">
                  {p.registrado_por.apellido}, {p.registrado_por.nombre}
                  {p.operario && p.operario.id !== p.registrado_por.id && <span className="block text-sm text-soft">Operario: {p.operario.apellido}, {p.operario.nombre}</span>}
                </TableCell>
                <TableCell data-label="Foto">
                  {p.tiene_foto && (
                    <Button size="icon" variant="ghost" aria-label={`Ver foto del parte del ${fecha(p.fecha_registro)}`} title="Ver foto"
                      onClick={() => abrirFoto(p.id).catch((e: Error) => toast.error(e.message))}><ImageIcon size={20} /></Button>
                  )}
                  {!p.tiene_foto && esMio(p) && (
                    <label className="inline-flex h-8 cursor-pointer items-center rounded-md border border-input px-3 text-sm focus-within:ring-2 focus-within:ring-ring">
                      Adjuntar
                      <input type="file" accept="image/*" className="sr-only" aria-label={`Adjuntar foto al parte del ${fecha(p.fecha_registro)}`}
                        onChange={(e) => adjuntar(p, e.target.files?.[0])} disabled={subirFoto.isPending} />
                    </label>
                  )}
                  {!p.tiene_foto && !esMio(p) && <span className="text-sm text-soft">Sin foto</span>}
                </TableCell>
                <TableCell className="pr-4 text-right whitespace-nowrap sm:pr-5">
                  {esMio(p) && (
                    <Button size="sm" variant="outline" onClick={() => setCorrigiendo(p)} aria-label={`Corregir el parte del ${fecha(p.fecha_registro)} en ${p.frente.nombre}`}>Corregir</Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => setViendo(p)} aria-label={`Ver detalle del parte del ${fecha(p.fecha_registro)} en ${p.frente.nombre}`}><ChevronRightIcon size={20} /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TablaPanel>

      {corrigiendo && yo && <CorregirParteDialog parte={corrigiendo} idUsuario={yo.id} onClose={() => setCorrigiendo(null)} />}
      {viendo && <DetalleParteDialog parte={viendo} onClose={() => setViendo(null)} />}

      <Paginacion meta={meta} onPagina={(page) => setFiltros({ ...filtros, page })} />
    </section>
  )
}
