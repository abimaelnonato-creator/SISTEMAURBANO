// User and Authentication Types
// Supports both frontend (admin, coordenador) and backend (ADMIN, COORDINATOR) role formats
export type UserRole = 'admin' | 'coordenador' | 'secretario' | 'operador' | 'visualizador' | 'ADMIN' | 'COORDINATOR' | 'OPERATOR' | 'VIEWER'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  secretariaId?: string
  secretaria?: Secretaria
  phone?: string
  isActive: boolean
  lastLogin?: string
  createdAt: string
  updatedAt: string
}

export interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

// Secretaria Types
export interface Secretaria {
  id: string
  name: string
  slug: string
  acronym?: string
  description: string
  icon: string
  color: string
  phone?: string
  email?: string
  address?: string
  responsibleId?: string
  responsible?: User
  categories: Category[]
  totalDemandas: number
  demandasAbertas: number
  demandasEmAndamento: number
  demandasResolvidas: number
}

// Category Types
export interface Category {
  id: string
  name: string
  slug: string
  secretariaId: string
  description?: string
  icon?: string
  slaHours: number
  slaDays?: number
  isActive: boolean
}

// Demand Types
export type DemandStatus = 'aberta' | 'em_andamento' | 'resolvida' | 'arquivada' | 'cancelada'
export type DemandPriority = 'baixa' | 'media' | 'alta' | 'urgente'
export type DemandSource = 'whatsapp' | 'telefone' | 'presencial' | 'site' | 'app' | 'interno'

export interface Demand {
  id: string
  protocol: string
  title: string
  description: string
  status: DemandStatus
  priority: DemandPriority
  source: DemandSource
  
  // Location
  address: string
  neighborhood: string
  latitude: number
  longitude: number
  referencePoint?: string
  
  // Classification
  categoryId: string
  category?: Category
  secretariaId: string
  secretaria?: Secretaria
  
  // Assignment
  assignedToId?: string
  assignedTo?: User
  teamId?: string
  team?: Team
  
  // Citizen
  citizenName?: string
  citizenPhone?: string
  citizenEmail?: string
  citizenCpf?: string
  
  // Media
  images: string[]
  attachments: Attachment[]
  
  // Timeline
  history: DemandHistoryItem[]
  comments: Comment[]
  
  // Dates
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  deadline?: string
  slaDeadline?: string
  
  // Metrics
  resolutionTime?: number // in hours
  satisfactionRating?: number // 1-5
}

export interface DemandHistoryItem {
  id: string
  demandId: string
  action: string
  description: string
  userId: string
  user?: User
  previousStatus?: DemandStatus
  newStatus?: DemandStatus
  createdAt: string
}

export interface Comment {
  id: string
  demandId: string
  userId: string
  user?: User
  content: string
  isInternal: boolean
  createdAt: string
}

export interface Attachment {
  id: string
  name: string
  url: string
  type: string
  size: number
  createdAt: string
}

// Team Types
export interface Team {
  id: string
  name: string
  secretariaId: string
  secretaria?: Secretaria
  leaderId?: string
  leader?: User
  members: User[]
  isActive: boolean
  createdAt: string
}

// Notification Types
export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  isRead: boolean
  link?: string
  userId: string
  createdAt: string
}

// Activity Feed
export interface Activity {
  id: string
  type: 'demand_created' | 'demand_updated' | 'demand_resolved' | 'comment_added' | 'assignment_changed'
  title: string
  description: string
  demandId?: string
  demand?: Demand
  userId: string
  user?: User
  createdAt: string
}

// Dashboard Stats
export interface DashboardStats {
  totalDemandas: number
  demandasAbertas: number
  demandasEmAndamento: number
  demandasResolvidas: number
  demandasHoje: number
  resolvidasHoje: number
  resolvidasSemana: number
  resolvidasMes: number
  tempoMedioResolucao: number // hours
  satisfacaoMedia: number // 0-5
  demandasUrgentes: number
  demandasAtrasadas: number
}

export interface ChartData {
  name: string
  value: number
  color?: string
}

export interface TimeSeriesData {
  date: string
  abertas: number
  resolvidas: number
  [key: string]: string | number
}

export interface DemandsByNeighborhood {
  neighborhood: string
  total: number
  abertas: number
  resolvidas: number
}

export interface DemandsByCategory {
  category: string
  total: number
  percentage: number
  color: string
}

// Filter Types
export interface DemandFilters {
  search?: string
  status?: DemandStatus[]
  priority?: DemandPriority[]
  secretariaId?: string[]
  categoryId?: string[]
  neighborhood?: string[]
  dateFrom?: string
  dateTo?: string
  assignedToId?: string
  source?: DemandSource[]
}

// Map Types
export interface MapMarker {
  id: string
  latitude: number
  longitude: number
  type: string
  status: DemandStatus
  priority: DemandPriority
  title: string
  address: string
  demandId: string
}

export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// API Response
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string[]>
}

// Form Types
export interface LoginFormData {
  email: string
  password: string
  remember?: boolean
}

export interface DemandFormData {
  title: string
  description: string
  priority: DemandPriority
  categoryId: string
  secretariaId: string
  address: string
  neighborhood: string
  latitude: number
  longitude: number
  referencePoint?: string
  citizenName?: string
  citizenPhone?: string
  citizenEmail?: string
  images?: File[]
}

export interface UserFormData {
  name: string
  email: string
  password?: string
  role: UserRole
  secretariaId?: string
  phone?: string
  isActive: boolean
}

// ==========================================
// SMART CITY UPGRADE - Novos Tipos
// ==========================================

// Priorização de Demandas
export interface DemandPriorityMetrics {
  gravidade: number // 1-5: risco à vida, segurança ou dano ao patrimônio
  impactoPessoas: number // 1-5: quantas pessoas são diretamente afetadas
  urgencia: number // 1-5: prazo legal, risco imediato
  criticidadeLocal: number // 1-5: proximidade de escola, hospital, via arterial
  diasEspera: number // calculado automaticamente
  reincidencia: number // 0-5: reclamações semelhantes na região
  prioridadeScore: number // calculado pelo algoritmo
}

export interface PriorityWeights {
  gravidade: number
  impactoPessoas: number
  urgencia: number
  criticidadeLocal: number
  tempoEspera: number
  reincidencia: number
}

export interface PrioritizedDemand extends Demand {
  priorityMetrics: DemandPriorityMetrics
}

export interface SimulationScenario {
  id: string
  name: string
  description: string
  changes: {
    secretariaId?: string
    addTeams?: number
    addBudget?: number
    focusNeighborhoods?: string[]
  }
  projectedImpact: {
    backlogReduction: number
    avgResolutionTimeChange: number
    priorityCoverage: number
  }
}

// Gabinete Virtual de Crise
export type CrisisType = 'climatica' | 'seguranca' | 'infraestrutura' | 'saude' | 'transporte' | 'outro'
export type CrisisStatus = 'ativa' | 'monitoramento' | 'encerrada'
export type CrisisEventType = 'alerta' | 'decisao' | 'acao' | 'atualizacao' | 'conclusao'

export interface Crisis {
  id: string
  name: string
  type: CrisisType
  description: string
  status: CrisisStatus
  severity: 1 | 2 | 3 | 4 | 5 // 1=baixa, 5=crítica
  affectedNeighborhoods: string[]
  affectedPopulation?: number
  commanderId?: string
  commander?: User
  secretariasEnvolvidas: string[]
  relatedDemandIds: string[]
  events: CrisisEvent[]
  tasks: CrisisTask[]
  startedAt: string
  endedAt?: string
  createdAt: string
  updatedAt: string
}

export interface CrisisEvent {
  id: string
  crisisId: string
  type: CrisisEventType
  title: string
  description: string
  userId: string
  user?: User
  attachments?: Attachment[]
  location?: {
    latitude: number
    longitude: number
    address: string
  }
  createdAt: string
}

export interface CrisisTask {
  id: string
  crisisId: string
  title: string
  description: string
  secretariaId: string
  secretaria?: Secretaria
  assignedToId?: string
  assignedTo?: User
  priority: 'baixa' | 'media' | 'alta' | 'critica'
  status: 'pendente' | 'em_andamento' | 'concluida' | 'bloqueada'
  deadline: string
  completedAt?: string
  comments: string[]
  createdAt: string
  updatedAt: string
}

export interface CrisisReport {
  id: string
  crisisId: string
  title: string
  content: string
  type: 'interno' | 'imprensa' | 'populacao' | 'mp'
  generatedBy: 'manual' | 'ia'
  createdAt: string
  pdfUrl?: string
}

// Sala de Monitoramento
export interface MonitoringKPI {
  id: string
  name: string
  value: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  trendValue: number
  category: string
  secretariaId?: string
  color: string
  icon: string
}

export interface RealTimeAlert {
  id: string
  type: 'anomalia' | 'threshold' | 'crise' | 'sla'
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  metric?: string
  location?: string
  neighborhoodId?: string
  isAcknowledged: boolean
  acknowledgedBy?: string
  createdAt: string
}

export interface HeatmapData {
  latitude: number
  longitude: number
  intensity: number
  type?: string
}

export interface NeighborhoodRisk {
  neighborhood: string
  riskScore: number
  mainIssues: string[]
  demandCount: number
  avgResolutionDays: number
  trend: 'improving' | 'stable' | 'worsening'
}

// Assistente de Decisão com IA
export interface AIConversation {
  id: string
  userId?: string
  title: string
  messages: AIMessage[]
  context?: AIContext
  createdAt: string
  updatedAt: string
}

export interface AIMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata?: {
    tokensUsed?: number
    processingTime?: number
    dataSourcesUsed?: string[]
  }
  createdAt: string
}

export interface AIContext {
  cityStats: DashboardStats
  activeCrises: number
  topPriorityDemands: number
  criticalNeighborhoods: string[]
  pendingTasks: number
  userRole: UserRole
  userSecretariaId?: string
}

export interface AIQuickAction {
  id: string
  label: string
  prompt: string
  icon: string
  category: 'visao_geral' | 'prioridades' | 'simulacao' | 'relatorio' | 'crise'
}

export interface AIAssistantRequest {
  conversationId?: string
  message: string
  context?: Partial<AIContext>
}

export interface AIAssistantResponse {
  message: string
  conversationId: string
  suggestions?: string[]
  actions?: {
    type: 'navigate' | 'filter' | 'export' | 'simulate'
    label: string
    payload: Record<string, unknown>
  }[]
}

// SLA e Métricas de Performance
export interface SLAMetrics {
  secretariaId: string
  secretariaName: string
  categoryId?: string
  categoryName?: string
  avgResolutionHours: number
  slaTarget: number // em horas
  slaCompliance: number // percentual
  totalResolved: number
  resolvedWithinSLA: number
  resolvedOutsideSLA: number
}

export interface PerformanceTrend {
  date: string
  demandsClosed: number
  avgResolutionTime: number
  slaCompliance: number
  satisfactionScore: number
}

// Configurações do Sistema Smart City
export interface SmartCityConfig {
  priorityWeights: PriorityWeights
  slaDefaultHours: Record<string, number>
  alertThresholds: {
    demandSpike: number // % aumento para gerar alerta
    slaWarning: number // % compliance para warning
    slaCritical: number // % compliance para critical
    neighborhoodRisk: number // score de risco
  }
  aiSettings: {
    enabled: boolean
    maxTokensPerRequest: number
    dailyLimit: number
    allowedRoles: UserRole[]
  }
  monitoringSettings: {
    refreshInterval: number // segundos
    autoRotateViews: boolean
    rotationInterval: number // segundos
    tvModeEnabled: boolean
  }
}
