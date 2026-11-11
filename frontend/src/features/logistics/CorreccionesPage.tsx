import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { CircleCheck, RotateCw, TriangleAlert } from 'lucide-react'
import { Cargando } from '@/shared/components/Cargando'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Textarea } from '@/shared/components/ui/textarea'
import { NativeSelect } from '@/shared/components/ui/native-select'
import { useTiposMadera } from '@/features/production/api'
import { useUsuarioActual } from '@/features/auth/api'
import { capitalizar, fechaHora, toneladas } from '@/features/reports/formato'
import { ApiError } from '@/shared/api/client'
import { Campo } from '@/shared/components/Campo'
import { Paginacion } from '@/shared/components/Paginacion'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { useCamioneros, useResolverSolicitud, useSolicitudes, useTomarSolicitud, type Cotejo, type Solicitud } from './api'
import { antiguedad, diferenciasViaje, mismasToneladas, nombrePersona, type Diferencia } from './cotejo'
import { PageHeader } from '@/shared/components/PageHeader'
import { StatusBadge } from '@/shared/components/StatusBadge'
import type { TonoEstado } from '@/shared/components/StatusBadge'

const ESTADO_SOLICITUD = { PENDIENTE: '○ Pendiente', EN_REVISION: '↻ En revisión', RESUELTA: '✓ Resuelta' }
const TONO_SOLICITUD: Record<keyof typeof ESTADO_SOLICITUD, TonoEstado> = { PENDIENTE: 'warning', EN_REVISION: 'info', RESUELTA: 'success' }
const mensaje = (e: unknown, defecto: string) => (e instanceof ApiError ? e.message : defecto)
const TONELADAS = /^\d{1,8}([.,]\d{1,2})?$/

/** Bandeja de solicitudes de corrección (RF08, D19). Nunca valida a mano: corrige un dato y el backend recoteja. */
export function CorreccionesPage() {
  const [pagina, setPagina] = useState(1)
  const lista = useSolicitudes(pagina)
  const yo = useUsuarioActual().data?.id
  const tomar = useTomarSolicitud()
  const [corrigiendo, setCorrigiendo] = useState<{ solicitud: Solicitud; origen: HTMLElement } | null>(null)
  const meta = lista.data?.meta
  const solicitudes = lista.data?.data

  // Al resolver la última solicitud de una página que no es la primera, se vuelve a la última que tenga datos.
  // Se ajusta durante el render (no en un efecto) y solo cuando la respuesta corresponde a la página pedida.
  if (meta && solicitudes?.length === 0 && meta.current_page === pagina && pagina > 1) setPagina(Math.max(1, Math.min(pagina - 1, meta.last_page)))

  return (
    <section className="grid gap-6">
      <PageHeader eyebrow="Operación / Correcciones" titulo="Solicitudes de corrección" descripcion="Viajes cuyo remito no coincidió con lo declarado: tomarlos, corregir el dato y recotejar" />
      {lista.isError && (
        <Alert variant="destructive">
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            {mensaje(lista.error, 'No se pudieron cargar las solicitudes.')}
            <Button size="sm" variant="outline" onClick={() => lista.refetch()} disabled={lista.isFetching}><RotateCw aria-hidden="true" />Reintentar</Button>
          </AlertDescription>
        </Alert>
      )}
      {lista.isPending && <p role="status"><Cargando /></p>}
      {solicitudes?.length === 0 && meta?.current_page === 1 && <BandejaVacia />}

      {!!solicitudes?.length && (
        <div className="grid gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="titulo-solicitudes" className="text-lg font-semibold">Solicitudes abiertas</h2>
            <p className="text-sm text-soft">{meta?.total} en total · las más antiguas primero</p>
          </div>
          <ul aria-labelledby="titulo-solicitudes" className="grid gap-3">
            {solicitudes.map((s) => (
              <TarjetaSolicitud key={s.id} s={s} yo={yo} tomando={tomar.isPending && tomar.variables === s.id}
                onTomar={() => tomar.mutateAsync(s.id).then(() => toast.success('Solicitud en revisión.'), (e) => toast.error(mensaje(e, 'No se pudo tomar.')))}
                onCorregir={(origen) => setCorrigiendo({ solicitud: s, origen })} />
            ))}
          </ul>
        </div>
      )}
      <Paginacion meta={meta} onPagina={setPagina} etiqueta="Páginas de solicitudes" />

      {corrigiendo && <CorregirDialog solicitud={corrigiendo.solicitud} onClose={(resuelta) => {
        // WCAG 2.4.3: el foco vuelve al botón; si se resolvió, la solicitud sale de la bandeja y va al título
        const origen = corrigiendo.origen
        setCorrigiendo(null)
        requestAnimationFrame(() => (resuelta || !origen.isConnected ? document.querySelector<HTMLElement>('main h1') : origen)?.focus())
      }} />}
    </section>
  )
}

function BandejaVacia() {
  return (
    <div role="status" className="surface grid justify-items-center gap-3 px-6 py-12 text-center">
      <span aria-hidden="true" className="grid size-12 place-items-center rounded-full bg-success/10 text-success"><CircleCheck size={26} /></span>
      <h2 className="text-lg font-semibold">No hay solicitudes pendientes</h2>
      <p className="max-w-md text-soft">Todos los remitos cargados coinciden con lo declarado. Si un remito no coincide, la solicitud va a aparecer acá.</p>
      <Button asChild variant="outline" className="mt-1"><Link viewTransition to="/viajes?estado=PENDIENTE">Ver viajes pendientes de remito</Link></Button>
    </div>
  )
}

function TarjetaSolicitud({ s, yo, tomando, onTomar, onCorregir }: {
  s: Solicitud; yo: number | undefined; tomando: boolean; onTomar: () => void; onCorregir: (origen: HTMLElement) => void
}) {
  const v = s.viaje
  const titulo = `solicitud-${s.id}`
  const responsable = s.responsable ? (s.responsable.id === yo ? 'Vos' : nombrePersona(s.responsable)) : 'Sin responsable'
  const pendiente = s.estado === 'PENDIENTE'
  return (
    <li className="surface grid gap-3 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="grid gap-0.5">
          <h3 id={titulo} className="font-semibold">Viaje #{v.id}{v.remito && ` · Remito N.º ${v.remito.numero}`}</h3>
          <p className="text-sm text-soft">
            <time dateTime={s.fecha_solicitud.replace(' ', 'T')}>{antiguedad(s.fecha_solicitud)} · solicitada el {fechaHora(s.fecha_solicitud)}</time>
          </p>
        </div>
        <StatusBadge tono={TONO_SOLICITUD[s.estado]}>{ESTADO_SOLICITUD[s.estado]}</StatusBadge>
      </div>

      <ListaDiferencias diferencias={diferenciasViaje(v)} detalle={s.detalle} />

      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <Dato termino="Ruta">{v.origen.nombre} → {v.destino}</Dato>
        <Dato termino="Fecha del viaje">{fechaHora(v.fecha)}</Dato>
        <Dato termino="Camionero">{nombrePersona(v.camionero)}</Dato>
        <Dato termino="Responsable">{responsable}</Dato>
      </dl>

      <div className="flex flex-wrap gap-2">
        {/* 44 px táctiles en el celular; compactos en escritorio */}
        {pendiente && <Button size="sm" className="h-11 px-4 sm:h-8" aria-describedby={titulo} disabled={tomando} onClick={onTomar}>{tomando ? 'Tomando…' : 'Tomar'}</Button>}
        <Button size="sm" className="h-11 px-4 sm:h-8" variant={pendiente ? 'outline' : 'default'} aria-describedby={titulo} onClick={(e) => onCorregir(e.currentTarget)}>Corregir</Button>
      </div>
    </li>
  )
}

function Dato({ termino, children }: { termino: string; children: ReactNode }) {
  return <div className="grid gap-0.5"><dt className="text-xs font-medium text-soft">{termino}</dt><dd>{children}</dd></div>
}

/** Las diferencias con el remito, destacadas. Si no se pueden calcular (sin remito), se muestra el detalle del backend. */
function ListaDiferencias({ diferencias, detalle }: { diferencias: Diferencia[]; detalle: string }) {
  return (
    <div className="rounded-md border border-correction/40 bg-correction/5 p-3">
      <p className="flex items-center gap-2 text-sm font-semibold text-correction">
        <TriangleAlert aria-hidden="true" size={16} />
        {diferencias.length === 1 ? '1 diferencia con el remito' : diferencias.length > 1 ? `${diferencias.length} diferencias con el remito` : 'Diferencias con el remito'}
      </p>
      {diferencias.length ? (
        <ul className="mt-2 grid gap-1.5 text-sm">
          {diferencias.map((d) => (
            <li key={d.campo} className="grid gap-x-3 sm:grid-cols-[8.5rem_1fr]">
              <span className="font-medium">{d.etiqueta}</span>
              <span>Declarado <strong className="font-semibold">{d.declarado}</strong> · Remito <strong className="font-semibold">{d.remito}</strong></span>
            </li>
          ))}
        </ul>
      ) : <p className="mt-2 whitespace-pre-line text-sm">{detalle}</p>}
    </div>
  )
}

type Datos = { volumen_declarado: string; tipo_madera: string; volumen_toneladas_remito: string; tipo_madera_remito: string; id_transportista: string }
type Clave = keyof Datos | 'motivo' | 'general'

function CorregirDialog({ solicitud, onClose: cerrar }: { solicitud: Solicitud; onClose: (resuelta: boolean) => void }) {
  const v = solicitud.viaje
  const r = v.remito!
  const tipos = useTiposMadera()
  const camioneros = useCamioneros(true)
  const resolver = useResolverSolicitud()
  // Toneladas con coma decimal, como en el resto de la vista; al enviar se normaliza a punto
  const inicial: Datos = {
    volumen_declarado: v.volumen_declarado.replace('.', ','), tipo_madera: String(v.tipo_madera.id),
    volumen_toneladas_remito: r.volumen_toneladas.replace('.', ','), tipo_madera_remito: String(r.tipo_madera.id), id_transportista: String(r.transportista.id),
  }
  const [d, setD] = useState({ ...inicial, motivo: '' })
  const [errores, setErrores] = useState<Partial<Record<Clave, string>>>({})
  const [resultado, setResultado] = useState<Cotejo | null>(null)
  const tituloResultado = useRef<HTMLHeadingElement>(null)
  const onClose = () => cerrar(resultado !== null)
  const cambiar = (c: Partial<typeof d>) => setD({ ...d, ...c })
  const cambio = (k: keyof Datos) => d[k] !== inicial[k]
  const select = 'h-9'

  useEffect(() => { if (resultado) tituloResultado.current?.focus() }, [resultado])

  const mostrarErrores = (e: Partial<Record<Clave, string>>) => {
    setErrores(e)
    // Se enfoca el primer campo con error, en el orden del formulario; si solo falta un cambio, el primer dato editable
    const orden: Clave[] = ['volumen_declarado', 'volumen_toneladas_remito', 'tipo_madera', 'tipo_madera_remito', 'id_transportista', 'general', 'motivo']
    const primero = orden.find((k) => e[k])
    if (primero) requestAnimationFrame(() => document.getElementById(primero === 'motivo' ? 'motivo' : primero === 'general' ? 'c-volumen_declarado' : `c-${primero}`)?.focus())
  }

  const enviar = async (ev: FormEvent) => {
    ev.preventDefault()
    const e: Partial<Record<Clave, string>> = {}
    if (!TONELADAS.test(d.volumen_declarado.trim())) e.volumen_declarado = 'Indicá las toneladas con hasta 2 decimales.'
    if (!TONELADAS.test(d.volumen_toneladas_remito.trim())) e.volumen_toneladas_remito = 'Indicá las toneladas con hasta 2 decimales.'
    if (!(Object.keys(inicial) as (keyof Datos)[]).some(cambio)) e.general = 'Cambiá al menos un dato de la declaración o del remito antes de recotejar.'
    if (d.motivo.trim().length < 5) e.motivo = 'Explicá el motivo de la corrección (mínimo 5 caracteres).'
    if (Object.keys(e).length) return mostrarErrores(e)
    setErrores({})

    // Solo viajan los campos que cambiaron: el backend audita antes/después de cada uno
    const viaje = { ...(cambio('volumen_declarado') && { volumen_declarado: d.volumen_declarado.trim().replace(',', '.') }), ...(cambio('tipo_madera') && { tipo_madera: Number(d.tipo_madera) }) }
    const remito = {
      ...(cambio('volumen_toneladas_remito') && { volumen_toneladas_remito: d.volumen_toneladas_remito.trim().replace(',', '.') }),
      ...(cambio('tipo_madera_remito') && { tipo_madera_remito: Number(d.tipo_madera_remito) }),
      ...(cambio('id_transportista') && { id_transportista: Number(d.id_transportista) }),
    }
    try {
      const res = await resolver.mutateAsync({ id: solicitud.id, cuerpo: { motivo: d.motivo.trim(), viaje, remito } })
      setResultado(res.cotejo)
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.details).length) {
        // "remito.volumen_toneladas_remito" → "volumen_toneladas_remito"; lo que no es un campo del formulario va arriba
        const porCampo: Partial<Record<Clave, string>> = {}
        for (const [k, msj] of Object.entries(err.details)) {
          const campo = k.replace(/^(viaje|remito)\./, '') as Clave
          porCampo[campo in inicial || campo === 'motivo' ? campo : 'general'] = msj[0]
        }
        mostrarErrores(porCampo)
      } else mostrarErrores({ general: mensaje(err, 'No se pudo aplicar la corrección.') })
    }
  }

  // Valor original legible, para mostrar qué se modificó
  const antes: Record<keyof Datos, string> = {
    volumen_declarado: toneladas(v.volumen_declarado), tipo_madera: capitalizar(v.tipo_madera.nombre),
    volumen_toneladas_remito: toneladas(r.volumen_toneladas), tipo_madera_remito: capitalizar(r.tipo_madera.nombre), id_transportista: nombrePersona(r.transportista),
  }
  const volumenValido = TONELADAS.test(d.volumen_declarado.trim()) && TONELADAS.test(d.volumen_toneladas_remito.trim())
  const filas = {
    volumen: volumenValido ? mismasToneladas(d.volumen_declarado, d.volumen_toneladas_remito) : null,
    madera: d.tipo_madera === d.tipo_madera_remito,
    transportista: String(v.camionero.id) === d.id_transportista,
  }
  const invalido = (k: Clave) => (errores[k] ? { 'aria-invalid': true, 'aria-describedby': `${k === 'motivo' ? 'motivo' : `c-${k}`}-error` } : {})
  const antesDe = (k: keyof Datos) => cambio(k) && <p className="text-xs text-soft">Antes: {antes[k]}</p>

  return (
    <Dialog open onOpenChange={(abierto) => !abierto && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Corregir viaje #{v.id} · remito N.º {r.numero}</DialogTitle>
          <DialogDescription className="text-soft">{v.origen.nombre} → {v.destino} · {fechaHora(v.fecha)} · {nombrePersona(v.camionero)}</DialogDescription>
        </DialogHeader>

        {resultado ? (
          <div className="grid gap-3">
            {resultado.coincide ? (
              <div className="flex items-start gap-3 rounded-md border border-success/40 bg-success/10 p-4">
                <CircleCheck aria-hidden="true" className="mt-0.5 shrink-0 text-success" size={22} />
                <div className="grid gap-1">
                  <h3 ref={tituloResultado} tabIndex={-1} className="font-semibold outline-none">Diferencias resueltas</h3>
                  <p>El viaje #{v.id} coincide con el remito y quedó validado.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-md border border-warning/50 bg-warning/10 p-4">
                <TriangleAlert aria-hidden="true" className="mt-0.5 shrink-0 text-warning" size={22} />
                <div className="grid gap-1.5">
                  <h3 ref={tituloResultado} tabIndex={-1} className="font-semibold outline-none">Siguen diferencias</h3>
                  <p>La corrección se guardó, pero el viaje todavía no coincide con el remito. Se abrió una nueva solicitud en la bandeja.</p>
                  <ul className="grid list-disc gap-1 pl-5 text-sm">{resultado.diferencias.map((t) => <li key={t}>{t}</li>)}</ul>
                </div>
              </div>
            )}
            <DialogFooter><Button type="button" onClick={onClose}>Cerrar</Button></DialogFooter>
          </div>
        ) : (
          <>
            <ListaDiferencias diferencias={diferenciasViaje(v)} detalle={solicitud.detalle} />
            <form id="form-correccion" onSubmit={enviar} noValidate className="grid gap-4">
              <p className="text-sm text-soft">Corregí el dato que esté mal, en la declaración o en el remito. Las marcas de cada fila son una vista previa: el sistema confirma al recotejar.</p>
              <FilaComparacion titulo="Toneladas" coincide={filas.volumen} modificado={cambio('volumen_declarado') || cambio('volumen_toneladas_remito')}>
                <Campo id="c-volumen_declarado" label="Toneladas declaradas" error={errores.volumen_declarado}>
                  <Input id="c-volumen_declarado" inputMode="decimal" {...invalido('volumen_declarado')} value={d.volumen_declarado} onChange={(e) => cambiar({ volumen_declarado: e.target.value })} />
                  {antesDe('volumen_declarado')}
                </Campo>
                <Campo id="c-volumen_toneladas_remito" label="Toneladas del remito" error={errores.volumen_toneladas_remito}>
                  <Input id="c-volumen_toneladas_remito" inputMode="decimal" {...invalido('volumen_toneladas_remito')} value={d.volumen_toneladas_remito} onChange={(e) => cambiar({ volumen_toneladas_remito: e.target.value })} />
                  {antesDe('volumen_toneladas_remito')}
                </Campo>
              </FilaComparacion>
              <FilaComparacion titulo="Tipo de madera" coincide={filas.madera} modificado={cambio('tipo_madera') || cambio('tipo_madera_remito')}>
                <Campo id="c-tipo_madera" label="Madera declarada" error={errores.tipo_madera}>
                  <NativeSelect id="c-tipo_madera" className={`${select} capitalize`} {...invalido('tipo_madera')} value={d.tipo_madera} onChange={(e) => cambiar({ tipo_madera: e.target.value })}>
                    {tipos.data?.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </NativeSelect>
                  {antesDe('tipo_madera')}
                </Campo>
                <Campo id="c-tipo_madera_remito" label="Madera del remito" error={errores.tipo_madera_remito}>
                  <NativeSelect id="c-tipo_madera_remito" className={`${select} capitalize`} {...invalido('tipo_madera_remito')} value={d.tipo_madera_remito} onChange={(e) => cambiar({ tipo_madera_remito: e.target.value })}>
                    {tipos.data?.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </NativeSelect>
                  {antesDe('tipo_madera_remito')}
                </Campo>
              </FilaComparacion>
              <FilaComparacion titulo="Transportista" coincide={filas.transportista} modificado={cambio('id_transportista')}>
                <div className="grid content-start gap-1.5">
                  <p className="text-sm font-medium">Camionero del viaje</p>
                  <p className="flex h-9 items-center text-sm">{nombrePersona(v.camionero)}</p>
                  <p className="text-xs text-soft">No se corrige: es quien declaró el viaje.</p>
                </div>
                <Campo id="c-id_transportista" label="Transportista del remito" error={errores.id_transportista}>
                  <NativeSelect id="c-id_transportista" className={select} {...invalido('id_transportista')} value={d.id_transportista} onChange={(e) => cambiar({ id_transportista: e.target.value })}>
                    {camioneros.data?.map((u) => <option key={u.id} value={u.id}>{u.apellido}, {u.nombre}</option>)}
                  </NativeSelect>
                  {antesDe('id_transportista')}
                </Campo>
              </FilaComparacion>
              {errores.general && <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{errores.general}</p>}
              <Campo id="motivo" label="Motivo de la corrección" error={errores.motivo}>
                <Textarea id="motivo" rows={2} className="text-base" {...invalido('motivo')}
                  value={d.motivo} onChange={(e) => cambiar({ motivo: e.target.value })} placeholder="Ej.: error de tipeo al cargar el remito" />
              </Campo>
            </form>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button type="submit" form="form-correccion" disabled={resolver.isPending}>{resolver.isPending ? 'Recotejando…' : 'Corregir y recotejar'}</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

/** Una fila de la comparación: declaración y remito lado a lado, con la marca de si coinciden ahora. */
function FilaComparacion({ titulo, coincide, modificado, children }: { titulo: string; coincide: boolean | null; modificado: boolean; children: ReactNode }) {
  const borde = coincide === false ? 'border-correction/50' : coincide ? 'border-success/40' : 'border-border'
  return (
    <fieldset className={`grid gap-3 rounded-lg border p-3 sm:grid-cols-2 ${borde}`}>
      <legend className="flex flex-wrap items-center gap-2 px-1 text-sm font-medium">
        {titulo}
        {coincide === false && <StatusBadge tono="danger" className="text-xs">Difiere</StatusBadge>}
        {coincide === true && <StatusBadge tono="success" className="text-xs">Coincide</StatusBadge>}
        {modificado && <StatusBadge tono="info" className="text-xs">Modificado</StatusBadge>}
      </legend>
      {children}
    </fieldset>
  )
}
