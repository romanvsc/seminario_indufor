import { useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { usePermiso } from '@/features/auth/api'
import { ApiError } from '@/shared/api/client'
import { Paginacion } from '@/shared/components/Paginacion'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { ESTADOS_MATAFUEGO, TONO_MATAFUEGO, useAtenderFalla, useFallasAbiertas, usePanel, type FilaPanel } from './api'
import { fecha, lectura } from './formato'
import { PageHeader } from '@/shared/components/PageHeader'
import { StatusBadge } from '@/shared/components/StatusBadge'


function Matafuego({ m }: { m: FilaPanel['matafuego'] }) {
  if (!m) return <span className="text-correction">⚠ Sin controles</span>
  return (
    <>
      {m.vencido && m.vencimiento !== null && m.estado !== 'FALTANTE'
        ? <StatusBadge tono="danger">⚠ Carga vencida</StatusBadge>
        : <StatusBadge tono={TONO_MATAFUEGO[m.estado]}>{ESTADOS_MATAFUEGO[m.estado]}</StatusBadge>}
      <span className="block text-sm">
        {/* D24: sin vencimiento cuando falta el matafuego o la etiqueta no se lee; nunca se muestra como vigente */}
        {m.estado === 'FALTANTE' ? <span className="font-medium text-danger">⚠ Falta el matafuego</span>
          : m.vencimiento === null ? <span className="font-medium text-correction">⚠ Etiqueta ilegible: sin fecha de vencimiento</span>
          : m.vencido ? <span className="text-soft">Venció el {fecha(m.vencimiento)} · estado del matafuego: {ESTADOS_MATAFUEGO[m.estado]}</span>
          : m.por_vencer ? <span className="text-correction">⚠ Vence el {fecha(m.vencimiento)}</span>
          : <span className="text-soft">Vence el {fecha(m.vencimiento)}</span>}
      </span>
      {!m.control_del_mes && <span className="block text-sm text-correction">⚠ Sin control este mes</span>}
    </>
  )
}

/** Panel técnico de Mantenimiento: estado de cada unidad y fallas abiertas (RF09–RF11, ADR-003). */
export function PanelPage() {
  const panel = usePanel()
  const [pagina, setPagina] = useState(1)
  const fallas = useFallasAbiertas(true, false, pagina)
  const puedeAtender = usePermiso('maintenance.failure.manage')
  const atender = useAtenderFalla()
  const [nota, setNota] = useState<{ id: number; texto: string } | null>(null)

  const confirmar = async () => {
    if (!nota || nota.texto.trim().length < 3) return toast.error('Escribí qué se hizo (mínimo 3 caracteres).')
    try {
      await atender.mutateAsync({ id: nota.id, nota: nota.texto.trim() })
      toast.success('Falla marcada como atendida.')
      setNota(null)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'No se pudo marcar como atendida.')
    }
  }

  return (
    <section className="grid gap-6">
      <PageHeader eyebrow="Operación / Mantenimiento" titulo="Panel técnico" descripcion="Fallas abiertas, última lectura y estado del matafuego de cada unidad" />

      <div className="grid gap-3">
        <h2 className="text-lg font-semibold">Fallas abiertas ({fallas.data?.meta.total ?? '…'})</h2>
        {fallas.isError && <p role="alert" className="text-danger">{(fallas.error as Error).message}</p>}
        {fallas.data?.data.length === 0 && <p className="text-soft">✓ No hay fallas abiertas.</p>}
        <ul className="grid gap-3">
          {fallas.data?.data.map((f) => (
            <li key={f.id} className="surface grid gap-2 p-4 border-danger/60!">
              <p className="font-medium">⚠ {f.unidad.nombre}{f.unidad.frente && ` · ${f.unidad.frente}`} · {fecha(f.fecha_lectura)}</p>
              <p>{f.detalle_falla}</p>
              <p className="text-sm text-soft">Reportó {f.operario.apellido}, {f.operario.nombre}</p>
              {puedeAtender && nota?.id !== f.id && <Button size="sm" variant="outline" className="w-fit" onClick={() => setNota({ id: f.id, texto: '' })}>Marcar atendida</Button>}
              {nota?.id === f.id && (
                <div className="flex flex-wrap items-center gap-2">
                  <Input aria-label="Qué se hizo" className="max-w-sm" placeholder="Qué se hizo" value={nota.texto} onChange={(e) => setNota({ ...nota, texto: e.target.value })} />
                  <Button size="sm" disabled={atender.isPending} onClick={confirmar}>Confirmar</Button>
                  <Button size="sm" variant="ghost" onClick={() => setNota(null)}>Cancelar</Button>
                </div>
              )}
            </li>
          ))}
        </ul>
        <Paginacion meta={fallas.data?.meta} onPagina={setPagina} etiqueta="Páginas de fallas abiertas" />
      </div>

      <div className="grid gap-3">
        <h2 className="text-lg font-semibold">Unidades</h2>
        {panel.isError && <p role="alert" className="text-danger">{(panel.error as Error).message}</p>}
        <div className="surface overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unidad</TableHead>
                <TableHead>Última lectura</TableHead>
                <TableHead>Fallas</TableHead>
                <TableHead>Matafuego</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {panel.isPending && <TableRow><TableCell colSpan={4} role="status">Cargando…</TableCell></TableRow>}
              {panel.data?.length === 0 && <TableRow><TableCell colSpan={4}>No hay unidades activas.</TableCell></TableRow>}
              {panel.data?.map((u) => (
                <TableRow key={u.unidad.id}>
                  <TableCell>
                    <Link to={`/mantenimiento/unidad/${u.unidad.id}`} className="font-medium underline-offset-4 hover:underline">{u.unidad.nombre}</Link>
                    <span className="block text-sm text-soft">{u.unidad.tipo}{u.unidad.frente && ` · ${u.unidad.frente}`}</span>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {u.ultima_lectura ? <>{lectura(u.ultima_lectura.valor, u.unidad.metrica)}<span className="block text-sm text-soft">{fecha(u.ultima_lectura.fecha)}</span></> : '—'}
                    {u.ultima_carga_sin_valor && <span className="block text-sm text-correction">⚠ Última carga: falla sin valor ({fecha(u.ultima_carga_sin_valor)})</span>}
                    <span className={`block text-sm ${u.lectura_semana ? 'text-approved' : 'text-correction'}`}>{u.lectura_semana ? '✓ Leída esta semana' : '⚠ Sin lectura desde el lunes'}</span>
                  </TableCell>
                  <TableCell>{u.fallas_abiertas > 0 ? <span className="font-medium text-danger">⚠ {u.fallas_abiertas} abierta{u.fallas_abiertas > 1 && 's'}</span> : <span className="text-soft">—</span>}</TableCell>
                  <TableCell><Matafuego m={u.matafuego} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  )
}
