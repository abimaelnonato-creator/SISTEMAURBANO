import { useEffect, useRef } from 'react'
import { AppRoutes } from '@/routes'
import { useAppStore } from '@/store/appStore'
import { useAuthStore } from '@/store/authStore'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Debug: contador de renders
let appRenderCount = 0

function App() {
  const initializeData = useAppStore((state) => state.initializeData)
  const checkAuth = useAuthStore((state) => state.checkAuth)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  
  // Debug: log cada render
  appRenderCount++
  console.log(`🔄 App render #${appRenderCount}, isAuthenticated: ${isAuthenticated}`)
  
  // Refs para garantir que só executamos uma vez
  const hasCheckedAuth = useRef(false)
  const hasInitialized = useRef(false)

  // Check authentication on mount - APENAS UMA VEZ
  useEffect(() => {
    if (!hasCheckedAuth.current) {
      hasCheckedAuth.current = true
      console.log('🔐 App: chamando checkAuth()')
      checkAuth()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize data only when authenticated - APENAS UMA VEZ
  useEffect(() => {
    if (isAuthenticated && !hasInitialized.current) {
      hasInitialized.current = true
      console.log('📦 App: chamando initializeData()')
      initializeData()
    }
  }, [isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppRoutes />
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
