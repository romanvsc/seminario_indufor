import { useState } from 'react'
import { toast } from 'sonner'
import { usePermiso } from '@/features/auth/api'
import { ApiError } from '@/shared/api/client'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { ESTADOS_MATAFUEGO, UNIDAD_METRICA, useAtenderFalla, useFallasAbiertas, usePanel, type FilaPanel } from './api'

const fecha = (iso: string) => {
  const [f, h] = iso.split(' ')
  return `${f.split('-').reverse().join('/')}${h ? ` ${h}` : ''}`
}

function Matafuego({ m }: { m: FilaPanel['matafuego'] }) {
  if (!m) return <span className="text-correction">⚠ Sin controles</span>
  return (
    <>
      <span className={m.estado === 'OK' ? '' : 'font-medium text-correction'}>{ESTADOS_MATAFUEGO[m.estado]}</span>
      <span className="block text-sm">
        {/* D24: sin vencimiento cuando falta el matafuego o la etiqueta no se lee; nunca se muestra como vigente */}
        {m.estado === 'FALTANTE' ? <span className="font-medium text-danger">⚠ Falta el matafuego</span>
          : m.vencimiento === null ? <span className="font-medium text-correction">⚠ Etiqueta ilegible: sin fecha de vencimiento</span>
          : m.vencido ? <span className="font-medium text-danger">⚠ Carga vencida el {fecha(m.vencimiento)}</span>
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
  const fallas = useFallasAbiertas()
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
      <h1 className="text-2xl font-semibold">Panel técnico</h1>

      <div className="grid gap-3">
        <h2 className="text-lg font-semibold">Fallas abiertas ({fallas.data?.meta.total ?? '…'})</h2>
        {fallas.isError && <p role="alert" className="text-danger">{(fallas.error as Error).message}</p>}
        {fallas.data?.data.length === 0 && <p className="text-soft">✓ No hay fallas abiertas.</p>}
        <ul className="grid gap-3">
          {fallas.data?.data.map((f) => (
            <li key={f.id} className="grid gap-2 rounded-lg border border-danger bg-card p-4">
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
      </div>

      <div className="grid gap-3">
        <h2 className="text-lg font-semibold">Unidades</h2>
        {panel.isError && <p role="alert" className="text-danger">{(panel.error as Error).message}</p>}
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
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
                    <span className="font-medium">{u.unidad.nombre}</span>
                    <span className="block text-sm text-soft">{u.unidad.tipo}{u.unidad.frente && ` · ${u.unidad.frente}`}</span>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {u.ultima_lectura ? <>{u.ultima_lectura.valor} {UNIDAD_METRICA[u.unidad.metrica]}<span className="block text-sm text-soft">{fecha(u.ultima_lectura.fecha)}</span></> : '—'}
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
