import { ESTADOS } from '@/features/logistics/api'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import type { FilaDetalle, FilaProduccion, FilaViajes } from './api'
import { m3, toneladas, totalesPorTipo } from './formato'

const madera = (t: string) => <span className={`font-medium capitalize ${t === 'pulpable' ? 'text-pulpable' : 'text-aserrable'}`}>{t}</span>

/** Producción por frente y tipo, con totales por tipo. Toneladas y m³ en columnas separadas (nunca se suman). */
export function TablaProduccion({ filas, vacio = 'No hay producción en el período.' }: { filas: FilaProduccion[]; vacio?: string }) {
  if (filas.length === 0) return <p className="text-soft">{vacio}</p>
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow><TableHead>Frente</TableHead><TableHead>Madera</TableHead><TableHead className="text-right">Toneladas</TableHead><TableHead className="text-right">Metros cúbicos</TableHead><TableHead className="text-right">Partes</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {filas.map((f) => (
            <TableRow key={`${f.id_frente}-${f.tipo_madera}`}>
              <TableCell>{f.frente}</TableCell>
              <TableCell>{madera(f.tipo_madera)}</TableCell>
              <TableCell className="text-right tabular-nums">{toneladas(f.toneladas)}</TableCell>
              <TableCell className="text-right tabular-nums">{m3(f.metros_cubicos)}</TableCell>
              <TableCell className="text-right tabular-nums">{f.partes}</TableCell>
            </TableRow>
          ))}
          {totalesPorTipo(filas).map((t) => (
            <TableRow key={`total-${t.tipo_madera}`} className="bg-secondary/40 font-semibold">
              <TableCell>Total</TableCell>
              <TableCell>{madera(t.tipo_madera)}</TableCell>
              <TableCell className="text-right tabular-nums">{toneladas(t.toneladas)}</TableCell>
              <TableCell className="text-right tabular-nums">{m3(t.metros_cubicos)}</TableCell>
              <TableCell />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function TablaDetalle({ filas }: { filas: FilaDetalle[] }) {
  if (filas.length === 0) return null
  return (
    <details className="rounded-lg border border-border bg-card p-3">
      <summary className="cursor-pointer font-medium">Detalle por máquina y operario ({filas.length} filas)</summary>
      <div className="mt-3 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Frente</TableHead><TableHead>Máquina</TableHead><TableHead>Operario</TableHead><TableHead>Madera</TableHead><TableHead className="text-right">Toneladas</TableHead><TableHead className="text-right">m³</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {filas.map((f, i) => (
              <TableRow key={i}>
                <TableCell>{f.frente}</TableCell>
                <TableCell>{f.unidad}</TableCell>
                <TableCell>{f.operario ?? <span className="text-soft">Consolidado</span>}</TableCell>
                <TableCell>{madera(f.tipo_madera)}</TableCell>
                <TableCell className="text-right tabular-nums">{toneladas(f.toneladas)}</TableCell>
                <TableCell className="text-right tabular-nums">{m3(f.metros_cubicos)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </details>
  )
}

export function TablaViajes({ filas }: { filas: FilaViajes[] }) {
  if (filas.length === 0) return <p className="text-soft">No hay viajes en el período.</p>
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <Table>
        <TableHeader><TableRow><TableHead>Estado</TableHead><TableHead className="text-right">Viajes</TableHead><TableHead className="text-right">Toneladas declaradas</TableHead></TableRow></TableHeader>
        <TableBody>
          {filas.map((f) => (
            <TableRow key={f.estado}>
              <TableCell><span className={`font-medium ${ESTADOS[f.estado].clase}`}>{ESTADOS[f.estado].texto}</span></TableCell>
              <TableCell className="text-right tabular-nums">{f.viajes}</TableCell>
              <TableCell className="text-right tabular-nums">{toneladas(f.toneladas)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
