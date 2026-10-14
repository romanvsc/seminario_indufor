import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, RouterProvider } from 'react-router'
import './index.css'
import { AppLayout, InicioPage } from '@/app/AppLayout'
import { LoginPage } from '@/features/auth/LoginPage'
import { RequireAuth, RequirePermiso } from '@/features/auth/RequireAuth'
import { FrentesPage } from '@/features/fronts/FrentesPage'
import { MaquinariaPage } from '@/features/machinery/MaquinariaPage'
import { ParteNuevoPage } from '@/features/production/ParteNuevoPage'
import { ProduccionPage } from '@/features/production/ProduccionPage'
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
      { path: '/usuarios', element: <RequirePermiso permiso="users.view"><UsuariosPage /></RequirePermiso> },
      { path: '/produccion', element: <RequirePermiso permiso={['production.view', 'production.view-all']}><ProduccionPage /></RequirePermiso> },
      { path: '/produccion/nuevo', element: <RequirePermiso permiso="production.create"><ParteNuevoPage /></RequirePermiso> },
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
