import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Crisis,
  CrisisEvent,
  CrisisTask,
  PriorityWeights,
  PrioritizedDemand,
  RealTimeAlert,
  MonitoringKPI,
  AIConversation,
  AIMessage,
  HeatmapData,
  NeighborhoodRisk,
  SLAMetrics,
  Demand,
  DemandPriorityMetrics,
  AIQuickAction,
} from '@/types'
import { sendChatMessage, type SystemDataContext, type ChatMessage } from '@/lib/gemini'

// ==========================================
// Algoritmo de Priorização
// ==========================================

const DEFAULT_PRIORITY_WEIGHTS: PriorityWeights = {
  gravidade: 3,
  impactoPessoas: 2,
  urgencia: 2,
  criticidadeLocal: 2,
  tempoEspera: 1,
  reincidencia: 1,
}

function normalizarTempoEspera(dias: number): number {
  if (dias <= 2) return 1
  if (dias <= 5) return 2
  if (dias <= 10) return 3
  if (dias <= 20) return 4
  return 5
}

function calcularDiasEspera(createdAt: string): number {
  const created = new Date(createdAt)
  const now = new Date()
  const diff = now.getTime() - created.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function calcularPrioridadeScore(
  metrics: Omit<DemandPriorityMetrics, 'prioridadeScore'>,
  weights: PriorityWeights
): number {
  const tempoNorm = normalizarTempoEspera(metrics.diasEspera)

  const score =
    metrics.gravidade * weights.gravidade +
    metrics.impactoPessoas * weights.impactoPessoas +
    metrics.urgencia * weights.urgencia +
    metrics.criticidadeLocal * weights.criticidadeLocal +
    tempoNorm * weights.tempoEspera +
    metrics.reincidencia * weights.reincidencia

  return score
}

// Estima métricas automaticamente baseado na demanda
export function estimarMetricas(demand: Demand): Omit<DemandPriorityMetrics, 'prioridadeScore'> {
  const diasEspera = calcularDiasEspera(demand.createdAt)
  
  // Estimar gravidade baseado na prioridade existente e tipo
  let gravidade = 2
  if (demand.priority === 'urgente') gravidade = 5
  else if (demand.priority === 'alta') gravidade = 4
  else if (demand.priority === 'media') gravidade = 3
  else gravidade = 2
  
  // Estimar impacto baseado no bairro (simplificado)
  const impactoPessoas = Math.min(5, Math.floor(Math.random() * 3) + 2)
  
  // Urgência baseada na prioridade
  const urgencia = demand.priority === 'urgente' ? 5 : 
                   demand.priority === 'alta' ? 4 : 
                   demand.priority === 'media' ? 3 : 2
  
  // Criticidade do local (simplificado - idealmente viria de um banco de dados de POIs)
  const criticidadeLocal = Math.floor(Math.random() * 3) + 2
  
  // Reincidência (simplificado)
  const reincidencia = Math.floor(Math.random() * 3)
  
  return {
    gravidade,
    impactoPessoas,
    urgencia,
    criticidadeLocal,
    diasEspera,
    reincidencia,
  }
}

// ==========================================
// Store de Priorização
// ==========================================

interface PrioritizationState {
  weights: PriorityWeights
  prioritizedDemands: PrioritizedDemand[]
  isCalculating: boolean
  lastCalculated: string | null
  
  // Actions
  setWeights: (weights: PriorityWeights) => void
  recalculatePriorities: (demands: Demand[]) => void
  getPrioritizedDemands: () => PrioritizedDemand[]
}

export const usePrioritizationStore = create<PrioritizationState>()(
  persist(
    (set, get) => ({
      weights: DEFAULT_PRIORITY_WEIGHTS,
      prioritizedDemands: [],
      isCalculating: false,
      lastCalculated: null,

      setWeights: (weights) => {
        set({ weights })
      },

      recalculatePriorities: (demands) => {
        set({ isCalculating: true })
        
        const weights = get().weights
        const prioritized: PrioritizedDemand[] = demands
          .filter(d => d.status !== 'resolvida' && d.status !== 'arquivada')
          .map(demand => {
            const metrics = estimarMetricas(demand)
            const prioridadeScore = calcularPrioridadeScore(metrics, weights)
            
            return {
              ...demand,
              priorityMetrics: {
                ...metrics,
                prioridadeScore,
              },
            }
          })
          .sort((a, b) => b.priorityMetrics.prioridadeScore - a.priorityMetrics.prioridadeScore)
        
        set({
          prioritizedDemands: prioritized,
          isCalculating: false,
          lastCalculated: new Date().toISOString(),
        })
      },

      getPrioritizedDemands: () => get().prioritizedDemands,
    }),
    {
      name: 'prioritization-store',
      partialize: (state) => ({ weights: state.weights }),
    }
  )
)

// ==========================================
// Store de Crises
// ==========================================

interface CrisisState {
  crises: Crisis[]
  activeCrisis: Crisis | null
  isLoading: boolean
  
  // Actions
  createCrisis: (crisis: Omit<Crisis, 'id' | 'events' | 'tasks' | 'createdAt' | 'updatedAt'>) => Crisis
  updateCrisis: (id: string, updates: Partial<Crisis>) => void
  deleteCrisis: (id: string) => void
  setCrisisStatus: (id: string, status: Crisis['status']) => void
  addEvent: (crisisId: string, event: Omit<CrisisEvent, 'id' | 'crisisId' | 'createdAt'>) => void
  addTask: (crisisId: string, task: Omit<CrisisTask, 'id' | 'crisisId' | 'createdAt' | 'updatedAt'>) => void
  updateTask: (crisisId: string, taskId: string, updates: Partial<CrisisTask>) => void
  setActiveCrisis: (id: string | null) => void
  getActiveCrises: () => Crisis[]
  getCrisisById: (id: string) => Crisis | undefined
  linkDemandToCrisis: (crisisId: string, demandId: string) => void
  initializeMockCrises: () => void
}

export const useCrisisStore = create<CrisisState>()((set, get) => ({
  crises: [],
  activeCrisis: null,
  isLoading: false,

  createCrisis: (crisisData) => {
    const newCrisis: Crisis = {
      ...crisisData,
      id: `crisis-${Date.now()}`,
      events: [],
      tasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    set(state => ({
      crises: [...state.crises, newCrisis],
    }))
    
    return newCrisis
  },

  updateCrisis: (id, updates) => {
    set(state => ({
      crises: state.crises.map(c =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
      ),
    }))
  },

  deleteCrisis: (id) => {
    set(state => ({
      crises: state.crises.filter(c => c.id !== id),
      activeCrisis: state.activeCrisis?.id === id ? null : state.activeCrisis,
    }))
  },

  setCrisisStatus: (id, status) => {
    const updates: Partial<Crisis> = { status }
    if (status === 'encerrada') {
      updates.endedAt = new Date().toISOString()
    }
    get().updateCrisis(id, updates)
  },

  addEvent: (crisisId, eventData) => {
    const event: CrisisEvent = {
      ...eventData,
      id: `event-${Date.now()}`,
      crisisId,
      createdAt: new Date().toISOString(),
    }
    
    set(state => ({
      crises: state.crises.map(c =>
        c.id === crisisId
          ? { ...c, events: [...c.events, event], updatedAt: new Date().toISOString() }
          : c
      ),
    }))
  },

  addTask: (crisisId, taskData) => {
    const task: CrisisTask = {
      ...taskData,
      id: `task-${Date.now()}`,
      crisisId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    set(state => ({
      crises: state.crises.map(c =>
        c.id === crisisId
          ? { ...c, tasks: [...c.tasks, task], updatedAt: new Date().toISOString() }
          : c
      ),
    }))
  },

  updateTask: (crisisId, taskId, updates) => {
    set(state => ({
      crises: state.crises.map(c =>
        c.id === crisisId
          ? {
              ...c,
              tasks: c.tasks.map(t =>
                t.id === taskId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
              ),
              updatedAt: new Date().toISOString(),
            }
          : c
      ),
    }))
  },

  setActiveCrisis: (id) => {
    const crisis = id ? get().crises.find(c => c.id === id) : null
    set({ activeCrisis: crisis || null })
  },

  getActiveCrises: () => get().crises.filter(c => c.status === 'ativa'),

  getCrisisById: (id) => get().crises.find(c => c.id === id),

  linkDemandToCrisis: (crisisId, demandId) => {
    set(state => ({
      crises: state.crises.map(c =>
        c.id === crisisId && !c.relatedDemandIds.includes(demandId)
          ? { ...c, relatedDemandIds: [...c.relatedDemandIds, demandId] }
          : c
      ),
    }))
  },

  initializeMockCrises: () => {
    const mockCrises: Crisis[] = [
      {
        id: 'crisis-1',
        name: 'Alagamento Centro - Janeiro 2026',
        type: 'climatica',
        description: 'Fortes chuvas causaram alagamentos em múltiplos pontos do centro da cidade',
        status: 'ativa',
        severity: 4,
        affectedNeighborhoods: ['Centro', 'Nova Parnamirim', 'Emaús'],
        affectedPopulation: 15000,
        secretariasEnvolvidas: ['1', '3', '4'],
        relatedDemandIds: ['1', '2', '5'],
        events: [
          {
            id: 'event-1',
            crisisId: 'crisis-1',
            type: 'alerta',
            title: 'Alerta Meteorológico',
            description: 'Defesa Civil emite alerta de chuvas intensas para as próximas 24h',
            userId: 'user-1',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'event-2',
            crisisId: 'crisis-1',
            type: 'decisao',
            title: 'Ativação do Gabinete de Crise',
            description: 'Prefeito determina ativação do gabinete de crise e mobilização de equipes',
            userId: 'user-1',
            createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          },
        ],
        tasks: [
          {
            id: 'task-1',
            crisisId: 'crisis-1',
            title: 'Desobstrução de bueiros',
            description: 'Limpar bueiros nas áreas mais críticas do centro',
            secretariaId: '3',
            priority: 'critica',
            status: 'em_andamento',
            deadline: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
            comments: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'task-2',
            crisisId: 'crisis-1',
            title: 'Interditação de vias',
            description: 'Interditar Rua Principal e Av. Central',
            secretariaId: '4',
            priority: 'alta',
            status: 'concluida',
            deadline: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            comments: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]
    
    set({ crises: mockCrises })
  },
}))

// ==========================================
// Store de Monitoramento
// ==========================================

interface MonitoringState {
  kpis: MonitoringKPI[]
  alerts: RealTimeAlert[]
  heatmapData: HeatmapData[]
  neighborhoodRisks: NeighborhoodRisk[]
  slaMetrics: SLAMetrics[]
  isTVMode: boolean
  isFullscreen: boolean
  activeView: 'overview' | 'infraestrutura' | 'iluminacao' | 'saneamento' | 'transito' | 'seguranca'
  refreshInterval: number
  lastRefresh: string | null
  
  // Actions
  setTVMode: (enabled: boolean) => void
  setFullscreen: (enabled: boolean) => void
  setActiveView: (view: MonitoringState['activeView']) => void
  acknowledgeAlert: (id: string, userId: string) => void
  dismissAlert: (id: string) => void
  refreshData: () => void
  initializeMockData: () => void
}

export const useMonitoringStore = create<MonitoringState>()((set) => ({
  kpis: [],
  alerts: [],
  heatmapData: [],
  neighborhoodRisks: [],
  slaMetrics: [],
  isTVMode: false,
  isFullscreen: false,
  activeView: 'overview',
  refreshInterval: 30,
  lastRefresh: null,

  setTVMode: (enabled) => set({ isTVMode: enabled }),
  
  setFullscreen: (enabled) => set({ isFullscreen: enabled }),
  
  setActiveView: (view) => set({ activeView: view }),

  acknowledgeAlert: (id, userId) => {
    set(state => ({
      alerts: state.alerts.map(a =>
        a.id === id ? { ...a, isAcknowledged: true, acknowledgedBy: userId } : a
      ),
    }))
  },

  dismissAlert: (id) => {
    set(state => ({
      alerts: state.alerts.filter(a => a.id !== id),
    }))
  },

  refreshData: () => {
    set({ lastRefresh: new Date().toISOString() })
  },

  initializeMockData: () => {
    const kpis: MonitoringKPI[] = [
      { id: '1', name: 'Demandas Abertas', value: 127, unit: '', trend: 'down', trendValue: -12, category: 'demandas', color: '#F59E0B', icon: 'FileText' },
      { id: '2', name: 'Em Execução', value: 45, unit: '', trend: 'up', trendValue: 8, category: 'demandas', color: '#3B82F6', icon: 'Clock' },
      { id: '3', name: 'Resolvidas Hoje', value: 23, unit: '', trend: 'up', trendValue: 15, category: 'demandas', color: '#10B981', icon: 'CheckCircle' },
      { id: '4', name: 'Tempo Médio', value: 4.2, unit: 'dias', trend: 'down', trendValue: -0.5, category: 'performance', color: '#8B5CF6', icon: 'Timer' },
      { id: '5', name: 'SLA Compliance', value: 87, unit: '%', trend: 'up', trendValue: 3, category: 'performance', color: '#06B6D4', icon: 'Target' },
      { id: '6', name: 'Satisfação', value: 4.3, unit: '/5', trend: 'stable', trendValue: 0, category: 'qualidade', color: '#EC4899', icon: 'Star' },
    ]

    const alerts: RealTimeAlert[] = [
      {
        id: 'alert-1',
        type: 'anomalia',
        severity: 'warning',
        title: 'Aumento de ocorrências',
        message: 'Bairro Centro com 40% mais demandas que a média',
        location: 'Centro',
        isAcknowledged: false,
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      {
        id: 'alert-2',
        type: 'sla',
        severity: 'critical',
        title: 'SLA em risco',
        message: 'Iluminação Pública com 15 demandas próximas do prazo',
        isAcknowledged: false,
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
      {
        id: 'alert-3',
        type: 'crise',
        severity: 'critical',
        title: 'Crise Ativa',
        message: 'Gabinete de crise ativo: Alagamento Centro',
        isAcknowledged: true,
        acknowledgedBy: 'Prefeito',
        createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      },
    ]

    const neighborhoodRisks: NeighborhoodRisk[] = [
      { neighborhood: 'Centro', riskScore: 85, mainIssues: ['Alagamento', 'Buracos'], demandCount: 45, avgResolutionDays: 5.2, trend: 'worsening' },
      { neighborhood: 'Nova Parnamirim', riskScore: 72, mainIssues: ['Iluminação', 'Limpeza'], demandCount: 38, avgResolutionDays: 4.1, trend: 'stable' },
      { neighborhood: 'Emaús', riskScore: 65, mainIssues: ['Buracos', 'Sinalização'], demandCount: 28, avgResolutionDays: 3.8, trend: 'improving' },
      { neighborhood: 'Pium', riskScore: 58, mainIssues: ['Saneamento', 'Iluminação'], demandCount: 22, avgResolutionDays: 4.5, trend: 'stable' },
      { neighborhood: 'Rosa dos Ventos', riskScore: 45, mainIssues: ['Limpeza'], demandCount: 15, avgResolutionDays: 2.9, trend: 'improving' },
    ]

    const slaMetrics: SLAMetrics[] = [
      { secretariaId: '1', secretariaName: 'Infraestrutura', avgResolutionHours: 96, slaTarget: 72, slaCompliance: 78, totalResolved: 120, resolvedWithinSLA: 94, resolvedOutsideSLA: 26 },
      { secretariaId: '2', secretariaName: 'Iluminação Pública', avgResolutionHours: 48, slaTarget: 48, slaCompliance: 85, totalResolved: 95, resolvedWithinSLA: 81, resolvedOutsideSLA: 14 },
      { secretariaId: '3', secretariaName: 'Saneamento', avgResolutionHours: 72, slaTarget: 96, slaCompliance: 92, totalResolved: 65, resolvedWithinSLA: 60, resolvedOutsideSLA: 5 },
      { secretariaId: '4', secretariaName: 'Trânsito', avgResolutionHours: 24, slaTarget: 24, slaCompliance: 90, totalResolved: 45, resolvedWithinSLA: 41, resolvedOutsideSLA: 4 },
    ]

    set({ kpis, alerts, neighborhoodRisks, slaMetrics, lastRefresh: new Date().toISOString() })
  },
}))

// ==========================================
// Store do Assistente IA
// ==========================================

interface AIAssistantState {
  conversations: AIConversation[]
  activeConversation: AIConversation | null
  isLoading: boolean
  isTyping: boolean
  error: string | null
  quickActions: AIQuickAction[]
  
  // Actions
  createConversation: (title?: string) => AIConversation
  setActiveConversation: (conversation: AIConversation | null) => void
  addMessage: (conversationId: string, message: Omit<AIMessage, 'id' | 'createdAt'>) => void
  sendMessage: (conversationId: string, content: string, systemData: SystemDataContext) => Promise<void>
  deleteConversation: (id: string) => void
  clearError: () => void
}

export const useAIAssistantStore = create<AIAssistantState>()((set, get) => ({
  conversations: [],
  activeConversation: null,
  isLoading: false,
  isTyping: false,
  error: null,
  quickActions: [
    { id: '1', label: 'Resumo da cidade hoje', prompt: 'Me dê um resumo da situação da cidade hoje, incluindo demandas críticas, crises ativas e principais indicadores.', icon: 'LayoutDashboard', category: 'visao_geral' },
    { id: '2', label: 'Prioridades do dia', prompt: 'Quais são as 5 demandas mais prioritárias que precisam de atenção imediata hoje?', icon: 'ListOrdered', category: 'prioridades' },
    { id: '3', label: 'Bairros críticos', prompt: 'Quais são os três bairros com maior risco de problemas urbanos e por quê?', icon: 'MapPin', category: 'visao_geral' },
    { id: '4', label: 'Simular aumento de equipes', prompt: 'Se eu dobrar as equipes de tapa-buraco, em quantos dias reduzo o backlog de infraestrutura?', icon: 'Calculator', category: 'simulacao' },
    { id: '5', label: 'Plano de ação 30 dias', prompt: 'Me sugira um plano de ação para reduzir o número de demandas abertas em 30 dias.', icon: 'Target', category: 'prioridades' },
    { id: '6', label: 'Relatório para imprensa', prompt: 'Gere um relatório resumido para a imprensa sobre as ações da prefeitura esta semana.', icon: 'FileText', category: 'relatorio' },
  ],

  createConversation: (title) => {
    const conversation: AIConversation = {
      id: `conv-${Date.now()}`,
      title: title || `Conversa ${new Date().toLocaleDateString('pt-BR')}`,
      messages: [
        {
          id: 'welcome',
          role: 'assistant',
          content: 'Olá! Sou o Assistente de Gestão da Cidade de Parnamirim, equipado com inteligência artificial Quimera. Posso analisar dados em tempo real, gerar relatórios, recomendar prioridades e ajudar na tomada de decisões estratégicas. O que gostaria de saber?',
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    set(state => ({
      conversations: [...state.conversations, conversation],
      activeConversation: conversation,
    }))
    
    return conversation
  },

  setActiveConversation: (conversation) => {
    set({ activeConversation: conversation })
  },

  addMessage: (conversationId, messageData) => {
    const message: AIMessage = {
      ...messageData,
      id: `msg-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    
    set(state => ({
      conversations: state.conversations.map(c =>
        c.id === conversationId
          ? { ...c, messages: [...c.messages, message], updatedAt: new Date().toISOString() }
          : c
      ),
      activeConversation: state.activeConversation?.id === conversationId
        ? { ...state.activeConversation, messages: [...state.activeConversation.messages, message] }
        : state.activeConversation,
    }))
  },

  sendMessage: async (conversationId, content, systemData) => {
    set({ isLoading: true, isTyping: true, error: null })
    
    // Add user message
    get().addMessage(conversationId, { role: 'user', content })
    
    try {
      // Get conversation messages for context
      const conversation = get().conversations.find(c => c.id === conversationId)
      const chatMessages: ChatMessage[] = conversation?.messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })) || []
      
      // Add current message
      chatMessages.push({ role: 'user', content })
      
      // Call OpenAI API
      const response = await sendChatMessage(chatMessages, systemData)
      
      get().addMessage(conversationId, { role: 'assistant', content: response })
      
    } catch (error) {
      console.error('Erro na API OpenAI:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro ao processar sua mensagem'
      set({ error: errorMessage })
      
      // Add error message to conversation
      get().addMessage(conversationId, { 
        role: 'assistant', 
        content: `⚠️ Desculpe, ocorreu um erro ao processar sua solicitação: ${errorMessage}. Por favor, tente novamente.` 
      })
    } finally {
      set({ isLoading: false, isTyping: false })
    }
  },

  deleteConversation: (id) => {
    set(state => ({
      conversations: state.conversations.filter(c => c.id !== id),
      activeConversation: state.activeConversation?.id === id ? null : state.activeConversation,
    }))
  },

  clearError: () => set({ error: null }),
}))
