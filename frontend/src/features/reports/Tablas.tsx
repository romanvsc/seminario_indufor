import { ESTADOS } from '@/features/logistics/api'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import type { FilaDetalle, FilaProduccion, FilaViajes } from './api'
import { m3, toneladas, totalesPorTipo } from './formato'
import { StatusBadge } from '@/shared/components/StatusBadge'

// UIX-032: el color va en un punto; en el texto, el ámbar de aserrable se leía como advertencia
const madera = (t: string) => (
  <span className="inline-flex items-center gap-1.5 font-medium capitalize">
    <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${t === 'pulpable' ? 'bg-pulpable' : 'bg-aserrable'}`} />{t}
  </span>
)

/** Producción por frente y tipo, con totales por tipo. Toneladas y m³ en columnas separadas (nunca se suman). */
export function TablaProduccion({ filas, vacio = 'No hay producción en el período.' }: { filas: FilaProduccion[]; vacio?: string }) {
  if (filas.length === 0) return <p className="text-soft">{vacio}</p>
  return (
    <div className="surface overflow-x-auto">
      <Table className="tabla-apilada-angosta">
        <TableHeader>
          <TableRow><TableHead>Frente</TableHead><TableHead>Madera</TableHead><TableHead className="text-right">Toneladas</TableHead><TableHead className="text-right">Metros cúbicos</TableHead><TableHead className="text-right">Partes</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {filas.map((f) => (
            <TableRow key={`${f.id_frente}-${f.tipo_madera}`}>
              {/* UIX-032: apilada, el frente es el título de la tarjeta (sin etiqueta) y el m³ sin medición no ocupa una línea */}
              <TableCell className="font-semibold sm:font-normal">{f.frente}</TableCell>
              <TableCell data-label="Madera">{madera(f.tipo_madera)}</TableCell>
              <TableCell data-label="Toneladas" className="text-right tabular-nums">{toneladas(f.toneladas)}</TableCell>
              <TableCell data-label="Metros cúbicos" data-apilada={f.metros_cubicos === null ? 'oculta' : undefined} className="text-right tabular-nums">{m3(f.metros_cubicos)}</TableCell>
              <TableCell data-label="Partes" className="text-right tabular-nums">{f.partes}</TableCell>
            </TableRow>
          ))}
          {totalesPorTipo(filas).map((t, i) => (
            <TableRow key={`total-${t.tipo_madera}`} className={`bg-secondary/40 font-semibold ${i === 0 ? 'border-t-2 border-border' : ''}`}>
              <TableCell>Total</TableCell>
              <TableCell data-label="Madera">{madera(t.tipo_madera)}</TableCell>
              <TableCell data-label="Toneladas" className="text-right tabular-nums">{toneladas(t.toneladas)}</TableCell>
              <TableCell data-label="Metros cúbicos" data-apilada={t.metros_cubicos === null ? 'oculta' : undefined} className="text-right tabular-nums">{m3(t.metros_cubicos)}</TableCell>
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
    <details className="surface p-3">
      <summary className="cursor-pointer font-medium">Detalle por máquina y operario ({filas.length} filas)</summary>
      <div className="mt-3 overflow-x-auto">
        <Table className="tabla-apilada-angosta">
          <TableHeader>
            <TableRow><TableHead>Frente</TableHead><TableHead>Máquina</TableHead><TableHead>Operario</TableHead><TableHead>Madera</TableHead><TableHead className="text-right">Toneladas</TableHead><TableHead className="text-right">m³</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {filas.map((f, i) => (
              <TableRow key={i}>
                <TableCell data-label="Frente">{f.frente}</TableCell>
                <TableCell data-label="Máquina">{f.unidad}</TableCell>
                <TableCell data-label="Operario">{f.operario ?? <span className="text-soft">Consolidado</span>}</TableCell>
                <TableCell data-label="Madera">{madera(f.tipo_madera)}</TableCell>
                <TableCell data-label="Toneladas" className="text-right tabular-nums">{toneladas(f.toneladas)}</TableCell>
                <TableCell data-label="m³" className="text-right tabular-nums">{m3(f.metros_cubicos)}</TableCell>
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
    <div className="surface overflow-x-auto">
      <Table className="tabla-apilada-angosta">
        <TableHeader><TableRow><TableHead>Estado</TableHead><TableHead className="text-right">Viajes</TableHead><TableHead className="text-right">Toneladas declaradas</TableHead></TableRow></TableHeader>
        <TableBody>
          {filas.map((f) => (
            <TableRow key={f.estado}>
              <TableCell data-label="Estado"><StatusBadge tono={ESTADOS[f.estado].tono}>{ESTADOS[f.estado].texto}</StatusBadge></TableCell>
              <TableCell data-label="Viajes" className="text-right tabular-nums">{f.viajes}</TableCell>
              <TableCell data-label="Toneladas declaradas" className="text-right tabular-nums">{toneladas(f.toneladas)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
