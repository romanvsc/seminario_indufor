import { useIconHover } from '@animateicons/react'
import { LogOutIcon } from '@animateicons/react/lucide/log-out-icon'
import { PanelLeftCloseIcon } from '@animateicons/react/lucide/panel-left-close-icon'
import { PanelLeftOpenIcon } from '@animateicons/react/lucide/panel-left-open-icon'
import { XIcon } from '@animateicons/react/lucide/x-icon'
import type { ComponentProps, ComponentType, ReactNode } from 'react'
import { NavLink } from 'react-router'
import { ConnectionBadge } from '@/shared/components/ConnectionBadge'

/** Cualquier ícono de @animateicons/react: todos comparten props y handle (startAnimation / stopAnimation). */
export type Icono = ComponentType<ComponentProps<typeof LogOutIcon>>
export type Enlace = { to: string; texto: string; icono: Icono; end?: boolean; aria?: string; extra?: ReactNode }
export type Seccion = { titulo: string; enlaces: Enlace[] }

// Despliegue leve de 0,5 s; sin animación si el sistema pide reducir el movimiento
const TRANSICION = 'duration-500 ease-out motion-reduce:transition-none'

/** Fila del menú: el ícono se anima al pasar por toda la fila, no solo por el dibujo. */
function ItemNav({ enlace, plegada }: { enlace: Enlace; plegada: boolean }) {
  const { ref, triggerProps } = useIconHover()
  const Icono = enlace.icono
  return (
    <NavLink viewTransition to={enlace.to} end={enlace.end} aria-label={enlace.aria} title={plegada ? enlace.texto : undefined} {...triggerProps}
      className={({ isActive }) => `relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-base transition-colors md:min-h-10 md:text-sm ${plegada ? 'md:justify-center md:px-0' : ''} ${
        isActive ? 'bg-brand/12 font-medium text-foreground before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-brand' : 'text-soft hover:bg-secondary hover:text-foreground'}`}>
      <Icono ref={ref} size={20} className="shrink-0" />
      {/* Plegada: el texto sigue siendo el nombre accesible del enlace (lectores de pantalla y E2E) */}
      <span className={plegada ? 'md:sr-only' : 'truncate'}>{enlace.texto}</span>
      {/* Plegada, el contador (fallas abiertas) pasa a ser una insignia sobre el ícono */}
      {enlace.extra && <span className={plegada ? 'md:absolute md:top-0.5 md:right-1.5' : 'ml-auto'}>{enlace.extra}</span>}
    </NavLink>
  )
}

function BotonIcono({ icono: Icono, etiqueta, onClick, ...resto }: { icono: Icono; etiqueta: string; onClick: () => void } & Omit<ComponentProps<'button'>, 'onClick'>) {
  const { ref, triggerProps } = useIconHover()
  return (
    <button type="button" aria-label={etiqueta} title={etiqueta} onClick={onClick} onMouseEnter={triggerProps.onMouseEnter} onMouseLeave={triggerProps.onMouseLeave} {...resto}
      className="grid size-11 shrink-0 place-items-center rounded-lg text-soft hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring md:size-9">
      <Icono ref={ref} size={20} />
    </button>
  )
}

/**
 * Navegación principal (spec 07, pedido del 2026-11-03): sidebar fija y plegable en pantallas anchas;
 * en el celular, panel que entra desde la izquierda. Un solo <nav aria-label="Principal"> para ambos.
 */
export function Sidebar({ secciones, plegada, onPlegar, abierta, onCerrar, usuario, onSalir, saliendo }: {
  secciones: Seccion[]
  plegada: boolean
  onPlegar: () => void
  abierta: boolean
  onCerrar: () => void
  usuario: string
  onSalir: () => void
  saliendo: boolean
}) {
  const { ref: iconoSalir, triggerProps: hoverSalir } = useIconHover()
  return (
    <aside id="menu-principal" aria-label="Menú lateral"
      className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card transition-[transform,width,visibility] ${TRANSICION}
        md:visible md:sticky md:top-0 md:h-dvh md:translate-x-0 ${plegada ? 'md:w-18' : 'md:w-60'} ${abierta ? 'visible translate-x-0' : 'invisible -translate-x-full'}`}>
      <div className={`flex items-center gap-3 border-b border-border px-4 py-3 ${plegada ? 'md:flex-col md:px-2' : ''}`}>
        <img src="/icons/icon-192.png" alt="" width={32} height={32} className="shrink-0" />
        <span className={`flex-1 text-lg font-semibold ${plegada ? 'md:hidden' : ''}`}>INDUFOR</span>
        <div className="hidden md:block">
          <BotonIcono icono={plegada ? PanelLeftOpenIcon : PanelLeftCloseIcon} etiqueta={plegada ? 'Desplegar menú' : 'Plegar menú'}
            aria-expanded={!plegada} aria-controls="menu-principal" onClick={onPlegar} />
        </div>
        <div className="md:hidden">
          <BotonIcono icono={XIcon} etiqueta="Cerrar menú" onClick={onCerrar} />
        </div>
      </div>

      <nav aria-label="Principal" onClick={onCerrar} className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3">
        {secciones.map((s, i) => s.enlaces.length > 0 && (
          <div key={s.titulo} className={`grid gap-1 ${i > 0 ? 'mt-4' : ''}`}>
            <p className={`px-3 text-xs font-semibold tracking-wide text-soft uppercase ${plegada ? 'md:sr-only' : ''}`}>{s.titulo}</p>
            {plegada && i > 0 && <hr aria-hidden="true" className="mx-2 mb-1 hidden border-border md:block" />}
            {s.enlaces.map((e) => <ItemNav key={e.to} enlace={e} plegada={plegada} />)}
          </div>
        ))}
      </nav>

      <div className={`grid gap-2 border-t border-border p-3 ${plegada ? 'md:justify-items-center' : ''}`}>
        <div className={plegada ? 'md:hidden' : ''}><ConnectionBadge /></div>
        <p className={`flex items-center gap-2.5 px-1 text-sm ${plegada ? 'md:justify-center' : ''}`}>
          <span aria-hidden="true" className="icon-surface grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold">{usuario.charAt(0).toUpperCase()}</span>
          <span className={`truncate font-medium ${plegada ? 'md:sr-only' : ''}`}>{usuario}</span>
        </p>
        <button type="button" {...hoverSalir} onClick={onSalir} disabled={saliendo}
          title={plegada ? 'Salir' : undefined}
          className={`flex min-h-11 w-full items-center gap-3 rounded-lg border border-border px-3 text-base font-medium hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 md:min-h-10 md:text-sm ${plegada ? 'md:justify-center md:px-0' : ''}`}>
          <LogOutIcon ref={iconoSalir} size={20} className="shrink-0" />
          <span className={plegada ? 'md:sr-only' : ''}>Salir</span>
        </button>
      </div>
    </aside>
  )
}
