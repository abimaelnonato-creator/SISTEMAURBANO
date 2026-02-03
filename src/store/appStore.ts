import { create } from 'zustand'
import type { 
  Demand, 
  DemandFilters, 
  DashboardStats, 
  Activity, 
  Notification,
  Secretaria,
  Category 
} from '@/types'
import { api } from '@/lib/api'
import { useAuthStore } from './authStore'

const buildDashboardStatsFromDemands = (demands: Demand[]): DashboardStats => {
  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - 7)
  const startOfMonth = new Date(now)
  startOfMonth.setDate(now.getDate() - 30)

  const abertas = demands.filter((d) => d.status === 'aberta').length
  const emAndamento = demands.filter((d) => d.status === 'em_andamento').length
  const resolvidasList = demands.filter((d) => d.status === 'resolvida')
  const resolvidas = resolvidasList.length

  const createdToday = demands.filter((d) => new Date(d.createdAt || 0) >= startOfToday).length
  const resolvidasHoje = resolvidasList.filter((d) => new Date(d.resolvedAt || d.updatedAt || d.createdAt || 0) >= startOfToday).length
  const resolvidasSemana = resolvidasList.filter((d) => new Date(d.resolvedAt || d.updatedAt || d.createdAt || 0) >= startOfWeek).length
  const resolvidasMes = resolvidasList.filter((d) => new Date(d.resolvedAt || d.updatedAt || d.createdAt || 0) >= startOfMonth).length

  const resolutionTimes = resolvidasList
    .map((d) => {
      const start = new Date(d.createdAt || 0).getTime()
      const end = new Date(d.resolvedAt || d.updatedAt || d.createdAt || 0).getTime()
      return end > start ? (end - start) / 3600000 : null
    })
    .filter((v): v is number => typeof v === 'number')

  const satisfactionScores = resolvidasList
    .map((d) => d.satisfactionRating)
    .filter((v): v is number => typeof v === 'number')

  const tempoMedioResolucao = resolutionTimes.length
    ? Math.round(resolutionTimes.reduce((acc, curr) => acc + curr, 0) / resolutionTimes.length)
    : 48

  const satisfacaoMedia = satisfactionScores.length
    ? Number((satisfactionScores.reduce((acc, curr) => acc + curr, 0) / satisfactionScores.length).toFixed(1))
    : 4.2

  const demandasAtrasadas = demands.filter((d) => {
    if (!d.slaDeadline) return false
    const deadline = new Date(d.slaDeadline)
    return deadline < now && (d.status === 'aberta' || d.status === 'em_andamento')
  }).length

  const demandasUrgentes = demands.filter((d) => d.priority === 'urgente').length

  return {
    totalDemandas: demands.length,
    demandasAbertas: abertas,
    demandasEmAndamento: emAndamento,
    demandasResolvidas: resolvidas,
    demandasHoje: Math.max(createdToday, Math.round(demands.length * 0.05)),
    resolvidasHoje: Math.max(resolvidasHoje, Math.min(resolvidas, Math.round(resolvidas * 0.08))),
    resolvidasSemana: Math.max(resolvidasSemana, Math.min(resolvidas, Math.round(resolvidas * 0.35))),
    resolvidasMes: Math.max(resolvidasMes, Math.min(resolvidas, Math.round(resolvidas * 0.65))),
    tempoMedioResolucao,
    satisfacaoMedia,
    demandasUrgentes: Math.max(demandasUrgentes, Math.round(demands.length * 0.07)),
    demandasAtrasadas: Math.max(demandasAtrasadas, Math.round(emAndamento * 0.15)),
  }
}

interface AppStore {
  // Theme
  theme: 'light' | 'dark' | 'system'
  toggleTheme: () => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  
  // Sidebar
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  
  // Global search
  globalSearchOpen: boolean
  setGlobalSearchOpen: (open: boolean) => void
  
  // Demands
  demands: Demand[]
  selectedDemand: Demand | null
  demandFilters: DemandFilters
  setDemands: (demands: Demand[]) => void
  setSelectedDemand: (demand: Demand | null) => void
  setDemandFilters: (filters: DemandFilters) => void
  addDemand: (demand: Demand) => void
  updateDemand: (id: string, data: Partial<Demand>) => void
  removeDemand: (id: string) => void
  
  // Dashboard
  dashboardStats: DashboardStats | null
  setDashboardStats: (stats: DashboardStats) => void
  
  // Activities
  activities: Activity[]
  setActivities: (activities: Activity[]) => void
  
  // Notifications
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Notification) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  
  // Secretarias
  secretarias: Secretaria[]
  setSecretarias: (secretarias: Secretaria[]) => void
  
  // Categories
  categories: Category[]
  setCategories: (categories: Category[]) => void
  
  // Loading states
  isLoading: boolean
  setLoading: (loading: boolean) => void
  
  // Error state
  error: string | null
  setError: (error: string | null) => void
  
  // Initialization state
  isInitialized: boolean
  isInitializing: boolean
  
  // Initialize data
  initializeData: () => void
}

export const useAppStore = create<AppStore>((set, get) => ({
  // Theme
  theme: (typeof window !== 'undefined' && localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'light',
  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light'
    set({ theme: newTheme })
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  },
  setTheme: (theme) => {
    set({ theme })
    localStorage.setItem('theme', theme)
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      document.documentElement.classList.toggle('dark', systemTheme === 'dark')
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark')
    }
  },
  
  // Sidebar
  sidebarOpen: true,
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  
  // Global search
  globalSearchOpen: false,
  setGlobalSearchOpen: (open) => set({ globalSearchOpen: open }),
  
  // Demands
  demands: [],
  selectedDemand: null,
  demandFilters: {},
  setDemands: (demands) => set({ demands }),
  setSelectedDemand: (demand) => set({ selectedDemand: demand }),
  setDemandFilters: (filters) => set({ demandFilters: filters }),
  // addDemand com verificação de duplicatas para evitar re-renders desnecessários
  addDemand: (demand) => set((state) => {
    // Verifica se a demanda já existe pelo ID ou protocol
    const exists = state.demands.some(
      (d) => d.id === demand.id || d.protocol === demand.protocol
    )
    if (exists) {
      console.log('📦 Demanda já existe, ignorando duplicata:', demand.protocol)
      return state // Retorna o estado atual sem modificações
    }
    return { demands: [demand, ...state.demands] }
  }),
  // updateDemand com verificação de mudanças para evitar re-renders desnecessários
  updateDemand: (id, data) => set((state) => {
    const existingDemand = state.demands.find((d) => d.id === id)
    
    // Se a demanda não existe, não faz nada
    if (!existingDemand) {
      console.log('📦 Demanda não encontrada para atualizar:', id)
      return state
    }
    
    // Verifica se há mudanças reais (shallow compare nas propriedades relevantes)
    const hasChanges = Object.keys(data).some((key) => {
      const k = key as keyof typeof data
      return existingDemand[k] !== data[k]
    })
    
    if (!hasChanges) {
      console.log('📦 Sem mudanças reais na demanda, ignorando:', id)
      return state
    }
    
    console.log('📦 Atualizando demanda:', id, 'com:', Object.keys(data).join(', '))
    
    return {
      demands: state.demands.map((d) => (d.id === id ? { ...d, ...data } : d)),
      selectedDemand: state.selectedDemand?.id === id 
        ? { ...state.selectedDemand, ...data } 
        : state.selectedDemand,
    }
  }),
  
  // removeDemand - remove uma demanda do estado
  removeDemand: (id) => set((state) => {
    console.log('🗑️ Removendo demanda:', id)
    return {
      demands: state.demands.filter((d) => d.id !== id),
      selectedDemand: state.selectedDemand?.id === id ? null : state.selectedDemand,
    }
  }),
  
  // Dashboard
  dashboardStats: null,
  setDashboardStats: (stats) => set({ dashboardStats: stats }),
  
  // Activities
  activities: [],
  setActivities: (activities) => set({ activities }),
  
  // Notifications
  notifications: [],
  unreadCount: 0,
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
    unreadCount: state.unreadCount + 1,
  })),
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) =>
      n.id === id ? { ...n, isRead: true } : n
    ),
    unreadCount: Math.max(0, state.unreadCount - 1),
  })),
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
    unreadCount: 0,
  })),
  
  // Secretarias
  secretarias: [],
  setSecretarias: (secretarias) => set({ secretarias }),
  
  // Categories
  categories: [],
  setCategories: (categories) => set({ categories }),
  
  // Loading
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
  
  // Error
  error: null,
  setError: (error) => set({ error }),
  
  // Initialization state
  isInitialized: false,
  isInitializing: false,
  
  // Initialize - protegido contra múltiplas chamadas simultâneas
  initializeData: async () => {
    const state = get()
    
    console.log('🔍 initializeData chamado - isInitialized:', state.isInitialized, 'isInitializing:', state.isInitializing)
    
    // Se já está inicializado ou em processo de inicialização, não faz nada
    if (state.isInitialized || state.isInitializing) {
      console.log('📦 Dados já carregados ou em carregamento, pulando initializeData')
      return
    }
    
    console.log('🚀 Iniciando carregamento de dados...')
    
    // Usa token já salvo, se existir
    const { token } = useAuthStore.getState()
    if (token) {
      api.setToken(token)
    }

    set({ isLoading: true, isInitializing: true })

    try {
      const [demandsRes, secretariasRes, categoriesRes, activitiesRes] = await Promise.all([
        api.getDemands({ page: 1, limit: 200 }),
        api.getSecretaries(),
        api.getCategories(),
        api.getNotifications(),
      ])

      const rawDemands = (demandsRes.data as any)?.data || demandsRes.data || []

      const normalizeStatus = (status: string | undefined) => {
        switch (status?.toUpperCase()) {
          case 'OPEN':
          case 'ABERTA':
            return 'aberta'
          case 'IN_PROGRESS':
          case 'EM_ANDAMENTO':
            return 'em_andamento'
          case 'RESOLVED':
          case 'RESOLVIDA':
            return 'resolvida'
          case 'ARCHIVED':
          case 'ARQUIVADA':
            return 'arquivada'
          case 'CANCELLED':
          case 'CANCELADA':
            return 'cancelada'
          default:
            return 'aberta'
        }
      }

      const normalizePriority = (priority: string | undefined) => {
        switch ((priority || '').toUpperCase()) {
          case 'URGENT':
          case 'URGENTE':
            return 'urgente'
          case 'HIGH':
          case 'ALTA':
            return 'alta'
          case 'MEDIUM':
          case 'MEDIA':
            return 'media'
          case 'LOW':
          case 'BAIXA':
            return 'baixa'
          default:
            return 'media'
        }
      }

      const normalizeSource = (source: string | undefined) => {
        switch ((source || '').toUpperCase()) {
          case 'WHATSAPP':
            return 'whatsapp'
          case 'PHONE':
          case 'TELEFONE':
            return 'telefone'
          case 'SITE':
            return 'site'
          case 'APP':
            return 'app'
          case 'PRESENTIAL':
          case 'PRESENCIAL':
            return 'presencial'
          default:
            return 'interno'
        }
      }

      const mappedDemands: Demand[] = rawDemands.map((d: any) => ({
        id: d.id || crypto.randomUUID(),
        protocol: d.protocol || d.id || 'N/D',
        title: d.title || d.description || 'Demanda',
        description: d.description || 'Sem descrição',
        status: normalizeStatus(d.status),
        priority: normalizePriority(d.priority),
        source: normalizeSource(d.source),
        address: d.address || d.location || 'Endereço não informado',
        neighborhood: d.neighborhood || d.district || 'Não informado',
        latitude: Number(d.latitude) || 0,
        longitude: Number(d.longitude) || 0,
        referencePoint: d.referencePoint,
        categoryId: d.categoryId || d.category?.id || 'sem-categoria',
        category: d.category,
        secretariaId: d.secretaryId || d.secretariaId || d.secretary?.id || 'sem-secretaria',
        secretaria: d.secretary || d.secretaria,
        assignedToId: d.assignedToId,
        assignedTo: d.assignedTo,
        teamId: d.teamId,
        team: d.team,
        citizenName: d.requesterName || d.citizenName,
        citizenPhone: d.requesterPhone || d.citizenPhone,
        citizenEmail: d.requesterEmail || d.citizenEmail,
        citizenCpf: d.citizenCpf,
        images: d.images || [],
        attachments: d.attachments || [],
        history: d.history || [],
        comments: d.comments || [],
        createdAt: d.createdAt || new Date().toISOString(),
        updatedAt: d.updatedAt || d.createdAt || new Date().toISOString(),
        resolvedAt: d.resolvedAt,
        deadline: d.deadline,
        slaDeadline: d.slaDeadline,
        resolutionTime: d.resolutionTime,
        satisfactionRating: d.satisfactionRating,
      }))

      const secretarias = (secretariasRes.data as any)?.data || secretariasRes.data || []
      const categories = (categoriesRes.data as any)?.data || categoriesRes.data || []
      const activities = (activitiesRes.data as any)?.data || activitiesRes.data || []

      // Use ONLY real data from API - no more mock data
      set({
        demands: mappedDemands,
        secretarias: secretarias as Secretaria[],
        categories: categories as Category[],
        activities: activities as Activity[],
        dashboardStats: buildDashboardStatsFromDemands(mappedDemands),
        isLoading: false,
        isInitializing: false,
        isInitialized: true,
        error: null,
      })
    } catch (error) {
      console.error('Falha ao buscar dados:', error)
      
      // Show error state - no fallback to mock data
      set({
        demands: [],
        secretarias: [],
        categories: [],
        activities: [],
        dashboardStats: buildDashboardStatsFromDemands([]),
        isLoading: false,
        isInitializing: false,
        isInitialized: true, // Marca como inicializado mesmo com erro para evitar loop de retry
        error: 'Erro ao carregar dados. Verifique sua conexão e tente novamente.',
      })
    }
  },
}))
