import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, RouterProvider } from 'react-router'
import './index.css'
import { AppLayout } from '@/app/AppLayout'
import { InicioPage } from '@/features/inicio/InicioPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { RequireAuth, RequirePermiso } from '@/features/auth/RequireAuth'
import { FrentesPage } from '@/features/fronts/FrentesPage'
import { IntegracionPage } from '@/features/integration/IntegracionPage'
import { CorreccionesPage } from '@/features/logistics/CorreccionesPage'
import { ViajeNuevoPage } from '@/features/logistics/ViajeNuevoPage'
import { ViajesPage } from '@/features/logistics/ViajesPage'
import { MaquinariaPage } from '@/features/machinery/MaquinariaPage'
import { LecturaNuevaPage } from '@/features/maintenance/LecturaNuevaPage'
import { MatafuegoNuevoPage } from '@/features/maintenance/MatafuegoNuevoPage'
import { HistorialUnidadPage } from '@/features/maintenance/HistorialUnidadPage'
import { MisLecturasPage } from '@/features/maintenance/MisLecturasPage'
import { PanelPage } from '@/features/maintenance/PanelPage'
import { ParteNuevoPage } from '@/features/production/ParteNuevoPage'
import { ProduccionPage } from '@/features/production/ProduccionPage'
import { DashboardPage } from '@/features/reports/DashboardPage'
import { ReportesPage } from '@/features/reports/ReportesPage'
import { UsuariosPage } from '@/features/users/UsuariosPage'
import { UpdatePrompt } from '@/shared/components/UpdatePrompt'
import { Toaster } from '@/shared/components/ui/sonner'

const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false } } })

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth><AppLayout /></RequireAuth>,
    children: [
      { path: '/', element: <InicioPage /> },
      { path: '/dashboard', element: <RequirePermiso permiso="dashboard.management"><DashboardPage /></RequirePermiso> },
      { path: '/reportes', element: <RequirePermiso permiso={['reports.production', 'reports.operational', 'reports.financial']}><ReportesPage /></RequirePermiso> },
      { path: '/usuarios', element: <RequirePermiso permiso="users.view"><UsuariosPage /></RequirePermiso> },
      { path: '/produccion', element: <RequirePermiso permiso={['production.view', 'production.view-all']}><ProduccionPage /></RequirePermiso> },
      { path: '/produccion/nuevo', element: <RequirePermiso permiso="production.create"><ParteNuevoPage /></RequirePermiso> },
      { path: '/viajes', element: <RequirePermiso permiso={['logistics.trip.view-own', 'logistics.trip.view-all']}><ViajesPage /></RequirePermiso> },
      { path: '/viajes/nuevo', element: <RequirePermiso permiso="logistics.trip.create"><ViajeNuevoPage /></RequirePermiso> },
      { path: '/correcciones', element: <RequirePermiso permiso="logistics.correction.manage"><CorreccionesPage /></RequirePermiso> },
      { path: '/lecturas/nueva', element: <RequirePermiso permiso="maintenance.reading.create"><LecturaNuevaPage /></RequirePermiso> },
      { path: '/matafuegos/nuevo', element: <RequirePermiso permiso="maintenance.extinguisher.create"><MatafuegoNuevoPage /></RequirePermiso> },
      { path: '/mantenimiento', element: <RequirePermiso permiso="maintenance.failure.view"><PanelPage /></RequirePermiso> },
      { path: '/mantenimiento/unidad/:id', element: <RequirePermiso permiso="maintenance.failure.view"><HistorialUnidadPage /></RequirePermiso> },
      { path: '/lecturas', element: <RequirePermiso permiso="maintenance.reading.view"><MisLecturasPage /></RequirePermiso> },
      { path: '/integracion', element: <RequirePermiso permiso="integration.view-history"><IntegracionPage /></RequirePermiso> },
      { path: '/frentes', element: <RequirePermiso permiso="fronts.view"><FrentesPage /></RequirePermiso> },
      { path: '/maquinaria', element: <RequirePermiso permiso="machinery.view"><MaquinariaPage /></RequirePermiso> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <UpdatePrompt />
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  </StrictMode>,
)
