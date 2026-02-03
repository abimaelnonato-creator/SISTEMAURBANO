import { lazy, Suspense, useMemo } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { LoadingSpinner } from '@/components/ui/loading'

// Lazy load pages for better performance
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const MapPage = lazy(() => import('@/pages/map/MapPage').then(m => ({ default: m.MapPage })))
const DemandasPage = lazy(() => import('@/pages/demandas/DemandasPage').then(m => ({ default: m.DemandasPage })))
const DemandaDetalhePage = lazy(() => import('@/pages/demandas/DemandaDetalhePage').then(m => ({ default: m.DemandaDetalhePage })))
const NovaDemandaPage = lazy(() => import('@/pages/demandas/NovaDemandaPage').then(m => ({ default: m.NovaDemandaPage })))
const EditarDemandaPage = lazy(() => import('@/pages/demandas/EditarDemandaPage').then(m => ({ default: m.EditarDemandaPage })))
const UsuariosPage = lazy(() => import('@/pages/usuarios/UsuariosPage').then(m => ({ default: m.UsuariosPage })))
const RelatoriosPage = lazy(() => import('@/pages/relatorios/RelatoriosPage').then(m => ({ default: m.RelatoriosPage })))
const ConfiguracoesPage = lazy(() => import('@/pages/configuracoes/ConfiguracoesPage').then(m => ({ default: m.ConfiguracoesPage })))
const WhatsAppConfigPage = lazy(() => import('@/pages/whatsapp/WhatsAppConfigPage').then(m => ({ default: m.WhatsAppConfigPage })))

// Smart City Pages
const PriorizacaoPage = lazy(() => import('@/pages/priorizacao/PriorizacaoPage').then(m => ({ default: m.PriorizacaoPage })))
const MonitoramentoPage = lazy(() => import('@/pages/monitoramento/MonitoramentoPage').then(m => ({ default: m.MonitoramentoPage })))
const CrisePage = lazy(() => import('@/pages/crise/CrisePage').then(m => ({ default: m.CrisePage })))
const AssistentePage = lazy(() => import('@/pages/assistente/AssistentePage').then(m => ({ default: m.AssistentePage })))
const OntologiaPage = lazy(() => import('@/pages/ontologia/OntologiaPage').then(m => ({ default: m.OntologiaPage })))
const IntegracoesPage = lazy(() => import('@/pages/integracoes/IntegracoesPage'))
const CidadeDigitalPage = lazy(() => import('@/pages/cidade-digital/CidadeDigitalPage').then(m => ({ default: m.CidadeDigitalPage })))
const FoundryUrbanoPage = lazy(() => import('@/pages/foundry-urbano/FoundryUrbanoPage').then(m => ({ default: m.FoundryUrbanoPage })))
const DigitalTwinPage = lazy(() => import('@/pages/DigitalTwin').then(m => ({ default: m.DigitalTwinPage })))

// Page loader component
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-[50vh]">
      <LoadingSpinner size="lg" />
    </div>
  )
}

// Verificar token no localStorage diretamente
function isLoggedIn(): boolean {
  try {
    const savedAuth = localStorage.getItem('parnamirim-auth')
    if (savedAuth) {
      const parsed = JSON.parse(savedAuth)
      return !!parsed?.state?.token
    }
  } catch (e) {
    console.error('Erro ao verificar auth:', e)
  }
  return false
}

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const hasAuth = useMemo(() => isLoggedIn(), [])

  if (!hasAuth) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Public route wrapper (redirects to dashboard if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const hasAuth = useMemo(() => isLoggedIn(), [])

  if (hasAuth) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

// Not found page
function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <h2 className="text-2xl font-semibold mt-4">Página não encontrada</h2>
      <p className="text-muted-foreground mt-2">
        A página que você está procurando não existe ou foi removida.
      </p>
      <a href="/" className="mt-6 text-primary hover:underline">
        Voltar para o início
      </a>
    </div>
  )
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Suspense fallback={<PageLoader />}>
                <LoginPage />
              </Suspense>
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route
            index
            element={
              <Suspense fallback={<PageLoader />}>
                <DashboardPage />
              </Suspense>
            }
          />

          {/* Mapa */}
          <Route
            path="mapa"
            element={
              <Suspense fallback={<PageLoader />}>
                <MapPage />
              </Suspense>
            }
          />

          {/* Demandas */}
          <Route
            path="demandas"
            element={
              <Suspense fallback={<PageLoader />}>
                <DemandasPage />
              </Suspense>
            }
          />
          <Route
            path="demandas/nova"
            element={
              <Suspense fallback={<PageLoader />}>
                <NovaDemandaPage />
              </Suspense>
            }
          />
          <Route
            path="demandas/:id/editar"
            element={
              <Suspense fallback={<PageLoader />}>
                <EditarDemandaPage />
              </Suspense>
            }
          />
          <Route
            path="demandas/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <DemandaDetalhePage />
              </Suspense>
            }
          />

          {/* Usuários */}
          <Route
            path="usuarios"
            element={
              <Suspense fallback={<PageLoader />}>
                <UsuariosPage />
              </Suspense>
            }
          />

          {/* Relatórios */}
          <Route
            path="relatorios"
            element={
              <Suspense fallback={<PageLoader />}>
                <RelatoriosPage />
              </Suspense>
            }
          />

          {/* Configurações */}
          <Route
            path="configuracoes"
            element={
              <Suspense fallback={<PageLoader />}>
                <ConfiguracoesPage />
              </Suspense>
            }
          />

          {/* WhatsApp */}
          <Route
            path="whatsapp"
            element={
              <Suspense fallback={<PageLoader />}>
                <WhatsAppConfigPage />
              </Suspense>
            }
          />

          {/* Smart City - Priorização */}
          <Route
            path="priorizacao"
            element={
              <Suspense fallback={<PageLoader />}>
                <PriorizacaoPage />
              </Suspense>
            }
          />

          {/* Smart City - Monitoramento */}
          <Route
            path="monitoramento"
            element={
              <Suspense fallback={<PageLoader />}>
                <MonitoramentoPage />
              </Suspense>
            }
          />

          {/* Smart City - Crise */}
          <Route
            path="crise"
            element={
              <Suspense fallback={<PageLoader />}>
                <CrisePage />
              </Suspense>
            }
          />

          {/* Smart City - Assistente IA */}
          <Route
            path="assistente"
            element={
              <Suspense fallback={<PageLoader />}>
                <AssistentePage />
              </Suspense>
            }
          />

          {/* Smart City - Núcleo de Ontologia */}
          <Route
            path="ontologia"
            element={
              <Suspense fallback={<PageLoader />}>
                <OntologiaPage />
              </Suspense>
            }
          />

          {/* Hub de Integrações */}
          <Route
            path="integracoes"
            element={
              <Suspense fallback={<PageLoader />}>
                <IntegracoesPage />
              </Suspense>
            }
          />

          {/* Cidade Digital 3D */}
          <Route
            path="digital-twin"
            element={
              <Suspense fallback={<PageLoader />}>
                <DigitalTwinPage />
              </Suspense>
            }
          />
          <Route
            path="mapa-3d"
            element={
              <Suspense fallback={<PageLoader />}>
                <DigitalTwinPage />
              </Suspense>
            }
          />

          {/* Cidade Digital 3D */}
          <Route
            path="cidade-digital"
            element={
              <Suspense fallback={<PageLoader />}>
                <CidadeDigitalPage />
              </Suspense>
            }
          />

          {/* Foundry Urbano - IA Infraestrutura */}
          <Route
            path="foundry-urbano"
            element={
              <Suspense fallback={<PageLoader />}>
                <FoundryUrbanoPage />
              </Suspense>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
