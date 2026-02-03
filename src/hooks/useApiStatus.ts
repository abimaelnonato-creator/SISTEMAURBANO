import { useState, useEffect, useCallback } from 'react'

interface UseApiStatusOptions {
  /** Intervalo em ms para verificar o status (padrão: 30000ms = 30 segundos) */
  checkInterval?: number
  /** Se deve verificar automaticamente */
  enabled?: boolean
}

/**
 * Hook para verificar o status de conexão com a API
 * Retorna true se a API está respondendo corretamente
 */
export function useApiStatus(options: UseApiStatusOptions = {}) {
  const { checkInterval = 30000, enabled = true } = options
  
  const [isOnline, setIsOnline] = useState(true) // Assume online inicialmente
  const [lastCheck, setLastCheck] = useState<Date | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const checkStatus = useCallback(async () => {
    if (isChecking) return
    
    setIsChecking(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000), // 5 segundos timeout
      })
      
      const data = await response.json()
      const online = response.ok && data?.status === 'ok'
      setIsOnline(online)
      setLastCheck(new Date())
    } catch (error) {
      console.warn('API health check failed:', error)
      setIsOnline(false)
      setLastCheck(new Date())
    } finally {
      setIsChecking(false)
    }
  }, [isChecking])

  // Verifica ao montar o componente
  useEffect(() => {
    if (enabled) {
      checkStatus()
    }
  }, [enabled]) // eslint-disable-line react-hooks/exhaustive-deps

  // Configura verificação periódica
  useEffect(() => {
    if (!enabled) return

    const intervalId = setInterval(checkStatus, checkInterval)
    
    return () => clearInterval(intervalId)
  }, [enabled, checkInterval, checkStatus])

  // Listener para eventos de online/offline do navegador
  useEffect(() => {
    const handleOnline = () => {
      checkStatus()
    }
    
    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [checkStatus])

  return {
    isOnline,
    lastCheck,
    isChecking,
    checkStatus,
  }
}
