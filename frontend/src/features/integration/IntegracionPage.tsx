import { useRef, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { ApiError } from '@/shared/api/client'
import { Campo } from '@/shared/components/Campo'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { descargarSimulado, ESTADOS_LOTE, useConsumos, useImportar, useLotes, useReintentarExportacion } from './api'

const mesAnterior = () => {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - 1)
  return d.toLocaleDateString('sv-SE').slice(0, 7)
}
const pesos = (v: string) => Number(v).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
const litros = (v: string) => `${Number(v).toLocaleString('es-AR', { minimumFractionDigits: 2 })} L`

/** Intercambio con el Sistema de Control de Gastos e Insumos (RF12, RF13, ADR-004). Solo Administración. */
export function IntegracionPage() {
  const [periodo, setPeriodo] = useState(mesAnterior())
  const [reemplazar, setReemplazar] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [filasConError, setFilasConError] = useState<string[]>([])
  const archivo = useRef<HTMLInputElement>(null)
  const lotes = useLotes('')
  const consumos = useConsumos(periodo)
  const importar = useImportar()
  const reintentar = useReintentarExportacion()

  const enviar = async (ev: FormEvent) => {
    ev.preventDefault()
    setError(null)
    setFilasConError([])
    const f = archivo.current?.files?.[0]
    if (!f) return setError('Elegí el archivo del consolidado (CSV).')
    try {
      const r = await importar.mutateAsync({ archivo: f, periodo, reemplazar, motivo: motivo.trim() })
      if (r.ya_importado) toast.info('Ese archivo ya estaba importado: no se cargó nada de nuevo.')
      else if (r.data.estado === 'OK') toast.success(`Consolidado ${periodo} importado: ${r.data.consumos} unidades.`)
      else if (r.data.estado === 'PARCIAL') toast.warning(`Importado con ${r.data.errores.length} filas con error. Revisalas en el historial.`)
      else toast.error('Ninguna fila era válida: no se importó nada. Revisá el detalle en el historial.')
      if (archivo.current) archivo.current.value = ''
      setReemplazar(false)
      setMotivo('')
    } catch (e) {
      if (e instanceof ApiError && e.code === 'PERIODO_YA_IMPORTADO') setReemplazar(true)
      setError(e instanceof ApiError ? e.message : 'No se pudo importar el archivo.')
      setFilasConError(e instanceof ApiError && e.code === 'REEMPLAZO_CON_ERRORES' ? (e.details.filas ?? []) : [])
    }
  }

  const reenviar = async () => {
    try {
      const r = await reintentar.mutateAsync(undefined)
      toast[r.con_error ? 'warning' : 'success'](`Exportadas: ${r.exportadas}. Con error: ${r.con_error}.`)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'No se pudo reintentar.')
    }
  }

  return (
    <section className="grid gap-6">
      <h1 className="text-2xl font-semibold">Integración con el sistema de gastos</h1>

      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={enviar} noValidate className="grid gap-3 rounded-lg border border-border bg-card p-4">
          <h2 className="text-lg font-semibold">Importar consolidado mensual</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo id="periodo" label="Período">
              <Input id="periodo" type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} />
            </Campo>
            <Campo id="archivo" label="Archivo CSV">
              <input id="archivo" ref={archivo} type="file" accept=".csv,text/csv" className="text-sm file:mr-3 file:h-9 file:rounded-md file:border file:border-input file:bg-card file:px-3" />
            </Campo>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-4 accent-primary" checked={reemplazar} onChange={(e) => setReemplazar(e.target.checked)} />
            Reemplazar el consolidado ya importado de este período
          </label>
          {reemplazar && (
            <Campo id="motivo" label="Motivo del reemplazo">
              <Input id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej.: el sistema externo corrigió los litros" />
            </Campo>
          )}
          {error && (
            <div role="alert" className="rounded-md border border-danger p-3 text-sm text-danger">
              <p>{error}</p>
              {filasConError.length > 0 && <ul className="mt-2 list-disc pl-5">{filasConError.map((f) => <li key={f}>{f}</li>)}</ul>}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={importar.isPending}>{importar.isPending ? 'Importando…' : 'Importar'}</Button>
            <Button type="button" variant="outline" onClick={() => descargarSimulado(periodo).catch((e: Error) => toast.error(e.message))}>Descargar archivo de prueba</Button>
          </div>
          <p className="text-xs text-soft">Formato CSV v1: periodo,codigo_unidad,litros,costo_total,referencia_externa. El archivo de prueba lo genera el simulador del sistema externo.</p>
        </form>

        <div className="grid content-start gap-3 rounded-lg border border-border bg-card p-4">
          <h2 className="text-lg font-semibold">Exportación de lecturas</h2>
          <p>Cada lectura con valor se envía sola al sistema externo al guardarse.</p>
          <p aria-live="polite" className={lotes.data?.pendientes_exportacion ? 'font-medium text-correction' : 'text-approved'}>
            {lotes.data === undefined ? '…' : lotes.data.pendientes_exportacion ? `⚠ ${lotes.data.pendientes_exportacion} lecturas pendientes de envío` : '✓ No hay lecturas pendientes de envío'}
          </p>
          <Button variant="outline" className="w-fit" disabled={reintentar.isPending || !lotes.data?.pendientes_exportacion} onClick={reenviar}>Reintentar envío</Button>
        </div>
      </div>

      <div className="grid gap-3">
        <h2 className="text-lg font-semibold">Consumos importados de {periodo}</h2>
        {consumos.data?.data.length === 0 && <p className="text-soft">No hay consumos importados para este período.</p>}
        {!!consumos.data?.data.length && (
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <Table>
              <TableHeader><TableRow><TableHead>Unidad</TableHead><TableHead className="text-right">Litros</TableHead><TableHead className="text-right">Costo</TableHead><TableHead>Referencia</TableHead></TableRow></TableHeader>
              <TableBody>
                {consumos.data.data.map((c) => (
                  <TableRow key={c.unidad.id}>
                    <TableCell>{c.unidad.nombre} <span className="text-sm text-soft">({c.unidad.codigo})</span></TableCell>
                    <TableCell className="text-right tabular-nums">{litros(c.litros)}</TableCell>
                    <TableCell className="text-right tabular-nums">{pesos(c.costo_total)}</TableCell>
                    <TableCell className="text-sm">{c.referencia_externa ?? '—'}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-semibold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right tabular-nums">{litros(consumos.data.totales.litros)}</TableCell>
                  <TableCell className="text-right tabular-nums">{pesos(consumos.data.totales.costo_total)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="grid gap-3">
        <h2 className="text-lg font-semibold">Historial de intercambios</h2>
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <Table>
            <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Tipo</TableHead><TableHead>Archivo</TableHead><TableHead>Estado</TableHead><TableHead>Detalle</TableHead></TableRow></TableHeader>
            <TableBody>
              {lotes.isPending && <TableRow><TableCell colSpan={5} role="status">Cargando…</TableCell></TableRow>}
              {lotes.data?.data.length === 0 && <TableRow><TableCell colSpan={5}>Todavía no hubo intercambios.</TableCell></TableRow>}
              {lotes.data?.data.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="whitespace-nowrap">{l.iniciado_at}</TableCell>
                  <TableCell>{l.tipo === 'IMPORT_CONSUMOS' ? `Importación ${l.periodo}` : 'Exportación de lectura'}</TableCell>
                  <TableCell className="text-sm">{l.nombre_archivo ?? '—'}{l.usuario && <span className="block text-soft">{l.usuario.apellido}, {l.usuario.nombre}</span>}</TableCell>
                  <TableCell><span className={`font-medium ${ESTADOS_LOTE[l.estado].clase}`}>{ESTADOS_LOTE[l.estado].texto}</span></TableCell>
                  <TableCell className="text-sm">
                    {l.tipo === 'IMPORT_CONSUMOS' && `${l.consumos} unidades`}
                    {l.errores.map((e, i) => <span key={i} className="block text-correction">{e.fila ? `Fila ${e.fila}: ` : ''}{e.mensaje}</span>)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  )
}
