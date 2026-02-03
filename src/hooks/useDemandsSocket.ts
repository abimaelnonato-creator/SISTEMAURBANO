import { useEffect, useCallback, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/store/authStore'

export interface DemandData {
  id: string
  protocol: string
  title: string
  description?: string
  address?: string
  neighborhood?: string
  latitude?: number
  longitude?: number
  status?: string
  priority?: string
  secretaryId?: string
  categoryId?: string
  category?: { name: string }
  requesterName?: string
  requesterPhone?: string
  createdAt?: string
  updatedAt?: string
}

interface UseDemandSocketOptions {
  onDemandCreated?: (demand: DemandData) => void
  onDemandUpdated?: (demand: DemandData) => void
  onDemandStatusChanged?: (data: { demand: DemandData; oldStatus: string; newStatus: string }) => void
  enabled?: boolean
  /** Intervalo mínimo entre atualizações em ms (padrão: 2000ms = 2 segundos) */
  throttleMs?: number
}

/**
 * Cria uma função com throttle que limita a frequência de chamadas
 * Diferente de debounce, throttle garante uma execução a cada intervalo
 */
function createThrottledBatcher<T>(
  callback: (items: T[]) => void,
  minInterval: number
): { add: (item: T) => void; cancel: () => void; flush: () => void } {
  let pendingItems: T[] = []
  let lastExecutionTime = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let isWaiting = false

  const execute = () => {
    if (pendingItems.length > 0) {
      const itemsToProcess = [...pendingItems]
      pendingItems = []
      lastExecutionTime = Date.now()
      isWaiting = false
      callback(itemsToProcess)
    }
    timeoutId = null
  }

  const add = (item: T) => {
    // Evita duplicatas baseado no ID - mantém apenas o mais recente
    const existingIndex = pendingItems.findIndex(
      (existing) => (existing as DemandData).id === (item as DemandData).id
    )
    if (existingIndex >= 0) {
      pendingItems[existingIndex] = item
    } else {
      pendingItems.push(item)
    }

    // Se já está aguardando, não agenda nova execução
    if (isWaiting || timeoutId) {
      return
    }

    const timeSinceLastExecution = Date.now() - lastExecutionTime
    
    if (timeSinceLastExecution >= minInterval) {
      // Pode executar imediatamente
      execute()
    } else {
      // Agenda para executar após o intervalo mínimo
      isWaiting = true
      const waitTime = minInterval - timeSinceLastExecution
      timeoutId = setTimeout(execute, waitTime)
    }
  }

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    pendingItems = []
    isWaiting = false
  }

  const flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    execute()
  }

  return { add, cancel, flush }
}

/**
 * Hook para receber atualizações em tempo real de demandas via WebSocket
 * 
 * Otimizações implementadas:
 * - Usa refs para callbacks para evitar reconexões desnecessárias
 * - Throttle para garantir máximo 1 atualização por intervalo
 * - Prevenção de duplicatas baseada em ID
 * - Reconexão automática com backoff exponencial
 */
export function useDemandsSocket(options: UseDemandSocketOptions = {}) {
  const { 
    onDemandCreated, 
    onDemandUpdated, 
    onDemandStatusChanged, 
    enabled = true,
    throttleMs = 2000  // Padrão: 2 segundos entre atualizações
  } = options
  
  const { token } = useAuthStore()
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const isConnectingRef = useRef(false)
  
  // Usar refs para callbacks para evitar reconexões quando callbacks mudam
  const callbacksRef = useRef({
    onDemandCreated,
    onDemandUpdated,
    onDemandStatusChanged,
  })
  
  // Refs para os batchers de throttle
  const createdBatcherRef = useRef<ReturnType<typeof createThrottledBatcher<DemandData>> | null>(null)
  const updatedBatcherRef = useRef<ReturnType<typeof createThrottledBatcher<DemandData>> | null>(null)
  
  // Atualiza refs quando callbacks mudam (sem causar reconexão)
  useEffect(() => {
    callbacksRef.current = {
      onDemandCreated,
      onDemandUpdated,
      onDemandStatusChanged,
    }
  }, [onDemandCreated, onDemandUpdated, onDemandStatusChanged])

  // Inicializa os batchers com throttle
  useEffect(() => {
    createdBatcherRef.current = createThrottledBatcher<DemandData>((items) => {
      console.log(`📦 Processando lote de ${items.length} demanda(s) criada(s)`)
      // Processa cada item único do lote
      items.forEach(item => {
        callbacksRef.current.onDemandCreated?.(item)
      })
    }, throttleMs)

    updatedBatcherRef.current = createThrottledBatcher<DemandData>((items) => {
      console.log(`📦 Processando lote de ${items.length} demanda(s) atualizada(s)`)
      items.forEach(item => {
        callbacksRef.current.onDemandUpdated?.(item)
      })
    }, throttleMs)

    return () => {
      createdBatcherRef.current?.cancel()
      updatedBatcherRef.current?.cancel()
    }
  }, [throttleMs])

  const connect = useCallback(() => {
    // Previne múltiplas conexões simultâneas
    if (!enabled || !token || socketRef.current?.connected || isConnectingRef.current) {
      return
    }

    isConnectingRef.current = true
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    
    socketRef.current = io(`${apiUrl}/events`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    })

    const socket = socketRef.current

    socket.on('connect', () => {
      console.log('🔌 WebSocket conectado - Demandas')
      setIsConnected(true)
      isConnectingRef.current = false
      // Subscreve para receber todas as demandas (SEMSUR)
      socket.emit('subscribe:demands', {})
    })

    socket.on('demand:created', (demand: DemandData) => {
      console.log('📢 Nova demanda recebida:', demand.protocol)
      // Usa o batcher para agrupar múltiplos eventos
      createdBatcherRef.current?.add(demand)
    })

    socket.on('demand:updated', (demand: DemandData) => {
      console.log('📝 Demanda atualizada:', demand.protocol)
      // Usa o batcher para agrupar múltiplos eventos
      updatedBatcherRef.current?.add(demand)
    })

    socket.on('demand:status-changed', (data: { demand: DemandData; oldStatus: string; newStatus: string }) => {
      console.log('🔄 Status alterado:', data.demand.protocol, data.oldStatus, '->', data.newStatus)
      // Status change não usa debounce pois é um evento importante
      callbacksRef.current.onDemandStatusChanged?.(data)
    })

    socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket desconectado:', reason)
      setIsConnected(false)
      isConnectingRef.current = false
    })

    socket.on('connect_error', (error) => {
      console.error('❌ Erro na conexão WebSocket:', error.message)
      setIsConnected(false)
      isConnectingRef.current = false
    })
  }, [enabled, token])

  const disconnect = useCallback(() => {
    // Cancela batchers pendentes
    createdBatcherRef.current?.cancel()
    updatedBatcherRef.current?.cancel()
    
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
      setIsConnected(false)
      isConnectingRef.current = false
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    isConnected,
    connect,
    disconnect,
  }
}
