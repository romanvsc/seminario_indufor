import { useIconHover } from '@animateicons/react'
import { LogOutIcon } from '@animateicons/react/lucide/log-out-icon'
import { MoonIcon } from '@animateicons/react/lucide/moon-icon'
import { PanelLeftCloseIcon } from '@animateicons/react/lucide/panel-left-close-icon'
import { PanelLeftOpenIcon } from '@animateicons/react/lucide/panel-left-open-icon'
import { SunIcon } from '@animateicons/react/lucide/sun-icon'
import { XIcon } from '@animateicons/react/lucide/x-icon'
import type { ComponentProps, ComponentType, MouseEventHandler, ReactNode } from 'react'
import { NavLink, useMatch } from 'react-router'
import { ConnectionBadge } from '@/shared/components/ConnectionBadge'
import {
  Sidebar as SidebarBase, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from '@/shared/components/ui/sidebar'
import { useTema } from './useTema'

/** Cualquier ícono de @animateicons/react: todos comparten props y handle (startAnimation / stopAnimation). */
export type Icono = ComponentType<ComponentProps<typeof LogOutIcon>>
export type Enlace = { to: string; texto: string; icono: Icono; end?: boolean; aria?: string; extra?: ReactNode }
export type Seccion = { titulo: string; enlaces: Enlace[] }

// Plegada: círculo de 44 px, centrado; el texto queda recortado pero sigue siendo el nombre accesible del enlace
const PILDORA = 'nav-pildora h-11 rounded-full bg-(--sidebar-pill) shadow-(--sidebar-pill-sombra) px-3 text-base font-medium hover:bg-(--sidebar-pill-hover) hover:text-sidebar-foreground active:bg-(--sidebar-pill-hover) active:text-sidebar-foreground md:h-10 md:text-sm data-[active=true]:bg-sidebar-accent data-[active=true]:shadow-none data-[active=true]:font-semibold data-[active=true]:text-sidebar-accent-foreground group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:p-3! [&>svg]:size-5'

/** Fila del menú: el ícono se anima al pasar por toda la fila, no solo por el dibujo. */
function ItemNav({ enlace }: { enlace: Enlace }) {
  const { ref, triggerProps } = useIconHover()
  const { setOpenMobile } = useSidebar()
  const activo = useMatch({ path: enlace.to, end: enlace.end ?? false }) !== null
  const Icono = enlace.icono
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={activo} tooltip={enlace.texto} className={PILDORA}>
        <NavLink viewTransition to={enlace.to} end={enlace.end} aria-label={enlace.aria} onClick={() => setOpenMobile(false)} {...triggerProps}>
          <Icono ref={ref} size={20} className="shrink-0" />
          <span>{enlace.texto}</span>
        </NavLink>
      </SidebarMenuButton>
      {/* Plegada, el contador (fallas abiertas) pasa a ser una insignia sobre el ícono */}
      {enlace.extra && (
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 group-data-[collapsible=icon]:top-1 group-data-[collapsible=icon]:right-0.5 group-data-[collapsible=icon]:translate-y-0">{enlace.extra}</span>
      )}
    </SidebarMenuItem>
  )
}

function BotonIcono({ icono: Icono, etiqueta, onClick, ...resto }: { icono: Icono; etiqueta: string; onClick: MouseEventHandler<HTMLButtonElement> } & Omit<ComponentProps<'button'>, 'onClick'>) {
  const { ref, triggerProps } = useIconHover()
  return (
    <button type="button" aria-label={etiqueta} title={etiqueta} onClick={onClick} onMouseEnter={triggerProps.onMouseEnter} onMouseLeave={triggerProps.onMouseLeave} {...resto}
      className="grid size-11 shrink-0 place-items-center rounded-full bg-(--sidebar-pill) shadow-(--sidebar-pill-sombra) hover:bg-(--sidebar-pill-hover) focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none md:size-8">
      <Icono ref={ref} size={18} />
    </button>
  )
}

/**
 * Navegación principal (UIX-011): sidebar fija y plegable en pantallas anchas;
 * en el celular, panel que entra desde la izquierda. Un solo <nav aria-label="Principal"> para ambos.
 */
export function Sidebar({ secciones, usuario, onSalir, saliendo }: {
  secciones: Seccion[]
  usuario: string
  onSalir: () => void
  saliendo: boolean
}) {
  const { ref: iconoSalir, triggerProps: hoverSalir } = useIconHover()
  const { open, toggleSidebar, setOpenMobile } = useSidebar()
  const { tema, cambiar } = useTema()
  // Centro del botón: también funciona con teclado, donde el clic no trae coordenadas
  const cambiarTema: MouseEventHandler<HTMLButtonElement> = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    cambiar(r.left + r.width / 2, r.top + r.height / 2)
  }
  return (
    <SidebarBase id="menu-principal" variant="inset" collapsible="icon" aria-label="Menú lateral">
      <SidebarHeader className="flex-row items-center gap-3 px-4 py-3 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:px-2">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-(--sidebar-pill)">
          <img src="/icons/icon-192.png" alt="" width={28} height={28} className="rounded-md" />
        </span>
        <span className="flex-1 text-lg font-semibold group-data-[collapsible=icon]:hidden">INDUFOR</span>
        <div className="hidden md:block">
          <BotonIcono icono={open ? PanelLeftCloseIcon : PanelLeftOpenIcon} etiqueta={open ? 'Plegar menú' : 'Desplegar menú'} aria-expanded={open} onClick={toggleSidebar} />
        </div>
        <div className="md:hidden">
          <BotonIcono icono={XIcon} etiqueta="Cerrar menú" onClick={() => setOpenMobile(false)} />
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0 [scrollbar-width:none]">
        <nav aria-label="Principal">
          {secciones.map((s) => s.enlaces.length > 0 && (
            <SidebarGroup key={s.titulo} className="py-1.5">
              <SidebarGroupLabel className="font-semibold tracking-wide text-sidebar-foreground uppercase">{s.titulo}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {s.enlaces.map((e) => <ItemNav key={e.to} enlace={e} />)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </nav>
      </SidebarContent>

      <SidebarFooter className="gap-2 border-t border-sidebar-border p-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-2">
        <div className="flex items-center justify-between gap-2">
          <div className="group-data-[collapsible=icon]:hidden"><ConnectionBadge /></div>
          <BotonIcono icono={tema === 'claro' ? MoonIcon : SunIcon} etiqueta={tema === 'claro' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'} onClick={cambiarTema} />
        </div>
        <p className="flex items-center gap-2.5 px-1 text-sm">
          <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-(--sidebar-pill) text-sm font-semibold">{usuario.charAt(0).toUpperCase()}</span>
          <span className="truncate font-medium group-data-[collapsible=icon]:sr-only">{usuario}</span>
        </p>
        <button type="button" {...hoverSalir} onClick={onSalir} disabled={saliendo} title={open ? undefined : 'Salir'}
          className="flex min-h-11 w-full items-center gap-3 rounded-full bg-(--sidebar-pill) px-3 text-base font-medium hover:bg-(--sidebar-pill-hover) focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none disabled:opacity-50 md:min-h-10 md:text-sm group-data-[collapsible=icon]:size-11 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <LogOutIcon ref={iconoSalir} size={20} className="shrink-0" />
          <span className="group-data-[collapsible=icon]:sr-only">Salir</span>
        </button>
      </SidebarFooter>
    </SidebarBase>
  )
}
