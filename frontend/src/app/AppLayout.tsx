import { ArrowLeftRightIcon } from '@animateicons/react/lucide/arrow-left-right-icon'
import { ChartColumnIcon } from '@animateicons/react/lucide/chart-column-icon'
import { ClipboardListIcon } from '@animateicons/react/lucide/clipboard-list-icon'
import { FactoryIcon } from '@animateicons/react/lucide/factory-icon'
import { FileCheckIcon } from '@animateicons/react/lucide/file-check-icon'
import { FlameIcon } from '@animateicons/react/lucide/flame-icon'
import { GaugeIcon } from '@animateicons/react/lucide/gauge-icon'
import { HouseIcon } from '@animateicons/react/lucide/house-icon'
import { LayoutDashboardIcon } from '@animateicons/react/lucide/layout-dashboard-icon'
import { MapPinIcon } from '@animateicons/react/lucide/map-pin-icon'
import { MenuIcon } from '@animateicons/react/lucide/menu-icon'
import { SettingsIcon } from '@animateicons/react/lucide/settings-icon'
import { TruckIcon } from '@animateicons/react/lucide/truck-icon'
import { UsersIcon } from '@animateicons/react/lucide/users-icon'
import { WrenchIcon } from '@animateicons/react/lucide/wrench-icon'
import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { useEntradaVista } from './useEntradaVista'
import { useFocoVista } from './useFocoVista'
import { useLogout, usePermiso, useUsuarioActual } from '@/features/auth/api'
import { useFallasAbiertas } from '@/features/maintenance/api'
import { ConnectionBadge } from '@/shared/components/ConnectionBadge'
import { Button } from '@/shared/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/shared/components/ui/alert-dialog'
import { SidebarInset, SidebarProvider, useSidebar } from '@/shared/components/ui/sidebar'
import { listarBorradores } from '@/shared/borrador'
import { Sidebar, type Enlace, type Seccion } from './Sidebar'

const PLEGADA = 'indufor:sidebar-plegada'
const leerPlegada = () => {
  try {
    return localStorage.getItem(PLEGADA) === '1'
  } catch {
    return false
  }
}

function BotonMenu() {
  const { openMobile, setOpenMobile } = useSidebar()
  const boton = useRef<HTMLButtonElement>(null)
  // Radix devuelve el foco solo a un SheetTrigger, y este botón está fuera del panel
  const estabaAbierto = useRef(false)
  useEffect(() => {
    if (estabaAbierto.current && !openMobile) boton.current?.focus()
    estabaAbierto.current = openMobile
  }, [openMobile])
  return (
    <Button ref={boton} variant="outline" size="sm" className="h-11 gap-2" aria-expanded={openMobile} onClick={() => setOpenMobile(true)}>
      <MenuIcon size={18} /> Menú
    </Button>
  )
}

export function AppLayout() {
  const usuario = useUsuarioActual().data
  const logout = useLogout()
  // D23: salir borra los borradores del equipo; si hay alguno sin enviar, se avisa antes
  const [borradores, setBorradores] = useState(0)
  const salir = () => {
    const n = usuario ? listarBorradores(usuario.id).length : 0
    if (n > 0) setBorradores(n)
    else logout.mutate()
  }
  const verUsuarios = usePermiso('users.view')
  const verFrentes = usePermiso('fronts.view')
  const verProduccionPropia = usePermiso('production.view')
  const verProduccionTodo = usePermiso('production.view-all')
  const verProduccion = verProduccionPropia || verProduccionTodo
  const verMaquinaria = usePermiso('machinery.view')
  const verViajesPropios = usePermiso('logistics.trip.view-own')
  const verViajesTodos = usePermiso('logistics.trip.view-all')
  const verCorrecciones = usePermiso('logistics.correction.manage')
  const cargaLecturas = usePermiso('maintenance.reading.create')
  const verLecturas = usePermiso('maintenance.reading.view')
  const cargaMatafuegos = usePermiso('maintenance.extinguisher.create')
  const verPanel = usePermiso('maintenance.failure.view')
  const verIntegracion = usePermiso('integration.view-history')
  const verDashboard = usePermiso('dashboard.management')
  const repProduccion = usePermiso('reports.production')
  const repOperativo = usePermiso('reports.operational')
  const repFinanciero = usePermiso('reports.financial')
  // ADR-003: el contador de fallas abiertas se refresca solo mientras la app está abierta
  const fallas = useFallasAbiertas(verPanel, true).data?.meta.total ?? 0

  // Escritorio: sidebar plegada o desplegada (se recuerda en el equipo). El panel del celular lo maneja SidebarProvider
  const [plegada, setPlegada] = useState(leerPlegada)
  const cambiarAbierta = (abierta: boolean) => {
    setPlegada(!abierta)
    try {
      localStorage.setItem(PLEGADA, abierta ? '0' : '1')
    } catch {
      // sin almacenamiento solo se pierde recordar la preferencia
    }
  }

  const vista = useRef<HTMLElement>(null)
  const { pathname } = useLocation()
  useEntradaVista(vista, pathname)
  useFocoVista(vista, pathname)

  const si = (condicion: boolean, e: Enlace) => (condicion ? [e] : [])
  const contadorFallas = fallas > 0 && (
    <span className="rounded-full bg-danger px-1.5 text-xs font-semibold text-destructive-foreground">{fallas}</span>
  )
  const secciones: Seccion[] = [
    { titulo: 'Inicio', enlaces: [{ to: '/', texto: 'Inicio', icono: HouseIcon, end: true }] },
    { titulo: 'Campo', enlaces: [
      ...si(cargaLecturas, { to: '/lecturas/nueva', texto: 'Cargar lectura', icono: GaugeIcon }),
      ...si(cargaMatafuegos, { to: '/matafuegos/nuevo', texto: 'Matafuego', icono: FlameIcon }),
    ] },
    { titulo: 'Operación', enlaces: [
      ...si(verProduccion, { to: '/produccion', texto: 'Producción', icono: FactoryIcon }),
      ...si(verViajesPropios || verViajesTodos, { to: '/viajes', texto: 'Viajes', icono: TruckIcon }),
      ...si(verCorrecciones, { to: '/correcciones', texto: 'Correcciones', icono: FileCheckIcon }),
      ...si(verLecturas, { to: '/lecturas', texto: 'Lecturas', icono: ClipboardListIcon, end: true }),
      ...si(verPanel, {
        to: '/mantenimiento', texto: 'Mantenimiento', icono: WrenchIcon, extra: contadorFallas,
        aria: fallas ? `Mantenimiento, ${fallas} fallas abiertas` : undefined,
      }),
    ] },
    { titulo: 'Gestión', enlaces: [
      ...si(verDashboard, { to: '/dashboard', texto: 'Dashboard', icono: LayoutDashboardIcon }),
      ...si(repProduccion || repOperativo || repFinanciero, { to: '/reportes', texto: 'Reportes', icono: ChartColumnIcon }),
      ...si(verIntegracion, { to: '/integracion', texto: 'Integración', icono: ArrowLeftRightIcon }),
      ...si(verUsuarios, { to: '/usuarios', texto: 'Usuarios', icono: UsersIcon }),
      ...si(verFrentes, { to: '/frentes', texto: 'Frentes', icono: MapPinIcon }),
      ...si(verMaquinaria, { to: '/maquinaria', texto: 'Maquinaria', icono: SettingsIcon }),
    ] },
  ]

  return (
    <SidebarProvider open={!plegada} onOpenChange={cambiarAbierta} className="sidebar-marco">
      <Sidebar secciones={secciones} usuario={`${usuario?.nombre ?? ''} ${usuario?.apellido ?? ''}`} onSalir={salir} saliendo={logout.isPending} />

      {/* overflow-x-clip: la foto del encabezado se extiende hasta el borde derecho sin generar scroll horizontal */}
      <SidebarInset className="isolate overflow-x-clip canvas-ambient">
        {/* Celular: barra superior chica; el menú se abre como panel lateral */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-border bg-card px-4 py-2 md:hidden">
          <div className="flex items-center gap-2">
            <img src="/icons/icon-192.png" alt="" width={32} height={32} />
            <span className="text-lg font-semibold max-[379px]:sr-only">INDUFOR</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ConnectionBadge />
            <BotonMenu />
          </div>
        </header>
        {/* Con 401/419 la sesión ya no existía y se limpió: no hay nada que reintentar */}
        {logout.isError && usuario && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border-b border-danger bg-card px-4 py-3 text-sm">
            <p>
              <strong className="text-danger">No se pudo cerrar la sesión.</strong> Revisá la conexión y tocá Reintentar; mientras tanto, la sesión
              sigue abierta en este equipo.
            </p>
            <Button variant="outline" size="sm" className="h-11 md:h-8" onClick={() => logout.mutate()} disabled={logout.isPending}>Reintentar</Button>
          </div>
        )}
        {borradores > 0 && (
          <AlertDialog open onOpenChange={(abierto) => !abierto && setBorradores(0)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Salir con borradores sin enviar?</AlertDialogTitle>
                <AlertDialogDescription>
                  {borradores === 1 ? 'Tenés 1 borrador sin enviar en este equipo.' : `Tenés ${borradores} borradores sin enviar en este equipo.`} Si salís se borran.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Volver</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={() => { setBorradores(0); logout.mutate() }}>Salir igual</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <main ref={vista} className="vista mx-auto w-full max-w-6xl p-4 md:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
