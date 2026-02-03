// ==========================================
// STORE - Núcleo de Ontologia Urbana
// Gerenciamento do Grafo da Cidade
// ==========================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  UrbanEntity,
  EntityConnection,
  CityMetrics,
  BairroData,
  Pessoa,
  Endereco,
  Infraestrutura,
  Veiculo,
  EquipamentoPublico,
  Fluxo,
  EventoUrbano,
  FlowAlert,
  QuimeraAnalysis,
  QuimeraPrediction,
  OntologyDashboardData
} from '@/types/ontology'

interface OntologyState {
  // Grafo urbano
  entities: Map<string, UrbanEntity>
  connections: Map<string, EntityConnection>
  
  // Dados agregados
  bairros: BairroData[]
  metricas: CityMetrics
  
  // Alertas e eventos
  alertasAtivos: FlowAlert[]
  eventosRecentes: EventoUrbano[]
  
  // Análises da Quimera
  analises: QuimeraAnalysis[]
  previsoes: QuimeraPrediction[]
  
  // Estado
  isLoading: boolean
  lastUpdate: string | null
  selectedEntityId: string | null
  viewMode: 'grafo' | 'mapa' | 'lista' | 'dashboard'
  filterType: string | null
  
  // Actions
  initializeData: () => void
  setSelectedEntity: (id: string | null) => void
  setViewMode: (mode: 'grafo' | 'mapa' | 'lista' | 'dashboard') => void
  setFilterType: (type: string | null) => void
  addEntity: (entity: UrbanEntity) => void
  updateEntity: (id: string, updates: Partial<UrbanEntity>) => void
  removeEntity: (id: string) => void
  addConnection: (connection: EntityConnection) => void
  removeConnection: (id: string) => void
  addAnalysis: (analysis: QuimeraAnalysis) => void
  getEntityById: (id: string) => UrbanEntity | undefined
  getEntitiesByType: (type: string) => UrbanEntity[]
  getConnectedEntities: (entityId: string) => UrbanEntity[]
  getDashboardData: () => OntologyDashboardData
}

// Dados mock para Parnamirim
const generateMockData = () => {
  const bairros: BairroData[] = [
    {
      id: 'centro',
      nome: 'Centro',
      populacao: 25000,
      area: 3.2,
      densidade: 7812,
      centroide: { lat: -5.9156, lng: -35.2630 },
      limites: [],
      indiceSaude: 78,
      indiceEducacao: 82,
      indiceSeguranca: 65,
      indiceInfraestrutura: 72,
      indiceGeral: 74,
      entidadesCount: { pessoa: 25000, endereco: 8500, infraestrutura: 450, veiculo: 0, equipamento_publico: 15, fluxo: 5, evento: 3, demanda: 45 }
    },
    {
      id: 'nova-parnamirim',
      nome: 'Nova Parnamirim',
      populacao: 45000,
      area: 8.5,
      densidade: 5294,
      centroide: { lat: -5.8890, lng: -35.2350 },
      limites: [],
      indiceSaude: 72,
      indiceEducacao: 75,
      indiceSeguranca: 70,
      indiceInfraestrutura: 68,
      indiceGeral: 71,
      entidadesCount: { pessoa: 45000, endereco: 15000, infraestrutura: 680, veiculo: 0, equipamento_publico: 22, fluxo: 5, evento: 5, demanda: 38 }
    },
    {
      id: 'boa-vista',
      nome: 'Boa Vista',
      populacao: 18000,
      area: 4.1,
      densidade: 4390,
      centroide: { lat: -5.9250, lng: -35.2450 },
      limites: [],
      indiceSaude: 68,
      indiceEducacao: 70,
      indiceSeguranca: 62,
      indiceInfraestrutura: 58,
      indiceGeral: 64,
      entidadesCount: { pessoa: 18000, endereco: 6000, infraestrutura: 280, veiculo: 0, equipamento_publico: 8, fluxo: 5, evento: 2, demanda: 52 }
    },
    {
      id: 'emaus',
      nome: 'Emaús',
      populacao: 22000,
      area: 5.2,
      densidade: 4230,
      centroide: { lat: -5.9320, lng: -35.2580 },
      limites: [],
      indiceSaude: 65,
      indiceEducacao: 68,
      indiceSeguranca: 58,
      indiceInfraestrutura: 55,
      indiceGeral: 61,
      entidadesCount: { pessoa: 22000, endereco: 7300, infraestrutura: 320, veiculo: 0, equipamento_publico: 10, fluxo: 5, evento: 4, demanda: 48 }
    },
    {
      id: 'pium',
      nome: 'Pium',
      populacao: 15000,
      area: 6.8,
      densidade: 2205,
      centroide: { lat: -5.9650, lng: -35.2100 },
      limites: [],
      indiceSaude: 62,
      indiceEducacao: 65,
      indiceSeguranca: 55,
      indiceInfraestrutura: 48,
      indiceGeral: 57,
      entidadesCount: { pessoa: 15000, endereco: 4800, infraestrutura: 180, veiculo: 0, equipamento_publico: 5, fluxo: 5, evento: 1, demanda: 35 }
    },
    {
      id: 'passagem-de-areia',
      nome: 'Passagem de Areia',
      populacao: 12000,
      area: 3.8,
      densidade: 3157,
      centroide: { lat: -5.9080, lng: -35.2750 },
      limites: [],
      indiceSaude: 70,
      indiceEducacao: 72,
      indiceSeguranca: 68,
      indiceInfraestrutura: 65,
      indiceGeral: 69,
      entidadesCount: { pessoa: 12000, endereco: 4000, infraestrutura: 220, veiculo: 0, equipamento_publico: 7, fluxo: 5, evento: 1, demanda: 22 }
    },
    {
      id: 'parque-das-nacoes',
      nome: 'Parque das Nações',
      populacao: 28000,
      area: 5.5,
      densidade: 5090,
      centroide: { lat: -5.8950, lng: -35.2480 },
      limites: [],
      indiceSaude: 75,
      indiceEducacao: 78,
      indiceSeguranca: 72,
      indiceInfraestrutura: 70,
      indiceGeral: 74,
      entidadesCount: { pessoa: 28000, endereco: 9200, infraestrutura: 420, veiculo: 0, equipamento_publico: 12, fluxo: 5, evento: 2, demanda: 28 }
    },
    {
      id: 'cohabinal',
      nome: 'Cohabinal',
      populacao: 8500,
      area: 2.1,
      densidade: 4047,
      centroide: { lat: -5.9180, lng: -35.2380 },
      limites: [],
      indiceSaude: 66,
      indiceEducacao: 69,
      indiceSeguranca: 60,
      indiceInfraestrutura: 52,
      indiceGeral: 62,
      entidadesCount: { pessoa: 8500, endereco: 2800, infraestrutura: 140, veiculo: 0, equipamento_publico: 4, fluxo: 5, evento: 1, demanda: 18 }
    }
  ]

  const metricas: CityMetrics = {
    populacaoTotal: 268000,
    areaTotalKm2: 123.4,
    totalEntidades: 156780,
    totalConexoes: 892450,
    saudeGeral: 72,
    
    infraestrutura: {
      postesTotal: 12500,
      postesAtivos: 11890,
      camerasTotal: 245,
      camerasAtivas: 228,
      semaforosTotal: 89,
      semaforosAtivos: 84,
      buracosReportados: 127
    },
    
    veiculos: {
      total: 85,
      disponiveis: 52,
      emMissao: 28,
      manutencao: 5
    },
    
    equipamentos: {
      escolas: 48,
      postosSaude: 22,
      delegacias: 4,
      pracas: 35
    },
    
    fluxos: {
      coberturaEnergia: 99.2,
      coberturaAgua: 94.5,
      coberturaEsgoto: 78.3,
      coberturaInternet: 89.7,
      qualidadeTransito: 68
    },
    
    eventos: {
      ativos: 8,
      ultimas24h: 23,
      criticosAtivos: 2
    }
  }

  const alertasAtivos: FlowAlert[] = [
    {
      id: 'alert-1',
      tipo: 'interrupcao',
      severidade: 4,
      inicio: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      previsaoRetorno: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      descricao: 'Interrupção de energia no bairro Emaús devido a manutenção emergencial',
      areasAfetadas: ['emaus', 'boa-vista']
    },
    {
      id: 'alert-2',
      tipo: 'baixa_pressao',
      severidade: 2,
      inicio: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      descricao: 'Baixa pressão de água em Nova Parnamirim - horário de pico',
      areasAfetadas: ['nova-parnamirim']
    },
    {
      id: 'alert-3',
      tipo: 'sobrecarga',
      severidade: 3,
      inicio: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      descricao: 'Trânsito intenso na Av. Ayrton Senna - acidente reportado',
      areasAfetadas: ['centro', 'parque-das-nacoes']
    }
  ]

  const eventosRecentes: EventoUrbano[] = [
    {
      id: 'evt-1',
      type: 'evento',
      name: 'Alagamento Rua das Flores',
      description: 'Alagamento após chuva forte, via interditada',
      categoria: 'alagamento',
      severidade: 4,
      location: { lat: -5.9156, lng: -35.2630 },
      status: 'emergencia',
      connections: [],
      metadata: {},
      inicio: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      emAndamento: true,
      entidadesAfetadas: ['addr-123', 'addr-124', 'addr-125'],
      recursosMobilizados: ['veh-01', 'veh-02'],
      populacaoAfetada: 350,
      acoes: [
        { id: 'act-1', descricao: 'Equipe de drenagem acionada', responsavel: 'SEMURB', status: 'em_andamento', timestamp: new Date().toISOString() }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'evt-2',
      type: 'evento',
      name: 'Queda de Árvore',
      description: 'Árvore caída bloqueando via em Pium',
      categoria: 'queda_arvore',
      severidade: 3,
      location: { lat: -5.9650, lng: -35.2100 },
      status: 'alerta',
      connections: [],
      metadata: {},
      inicio: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      emAndamento: true,
      entidadesAfetadas: ['addr-456'],
      recursosMobilizados: ['veh-05'],
      populacaoAfetada: 120,
      acoes: [
        { id: 'act-2', descricao: 'Equipe de poda a caminho', responsavel: 'SEMMA', status: 'pendente', timestamp: new Date().toISOString() }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]

  return { bairros, metricas, alertasAtivos, eventosRecentes }
}

export const useOntologyStore = create<OntologyState>()(
  persist(
    (set, get) => ({
      entities: new Map(),
      connections: new Map(),
      bairros: [],
      metricas: {
        populacaoTotal: 0,
        areaTotalKm2: 0,
        totalEntidades: 0,
        totalConexoes: 0,
        saudeGeral: 0,
        infraestrutura: { postesTotal: 0, postesAtivos: 0, camerasTotal: 0, camerasAtivas: 0, semaforosTotal: 0, semaforosAtivos: 0, buracosReportados: 0 },
        veiculos: { total: 0, disponiveis: 0, emMissao: 0, manutencao: 0 },
        equipamentos: { escolas: 0, postosSaude: 0, delegacias: 0, pracas: 0 },
        fluxos: { coberturaEnergia: 0, coberturaAgua: 0, coberturaEsgoto: 0, coberturaInternet: 0, qualidadeTransito: 0 },
        eventos: { ativos: 0, ultimas24h: 0, criticosAtivos: 0 }
      },
      alertasAtivos: [],
      eventosRecentes: [],
      analises: [],
      previsoes: [],
      isLoading: false,
      lastUpdate: null,
      selectedEntityId: null,
      viewMode: 'dashboard',
      filterType: null,

      initializeData: () => {
        const { bairros, metricas, alertasAtivos, eventosRecentes } = generateMockData()
        set({
          bairros,
          metricas,
          alertasAtivos,
          eventosRecentes,
          lastUpdate: new Date().toISOString()
        })
      },

      setSelectedEntity: (id) => set({ selectedEntityId: id }),
      
      setViewMode: (mode) => set({ viewMode: mode }),
      
      setFilterType: (type) => set({ filterType: type }),

      addEntity: (entity) => {
        const entities = new Map(get().entities)
        entities.set(entity.id, entity)
        set({ entities })
      },

      updateEntity: (id, updates) => {
        const entities = new Map(get().entities)
        const existing = entities.get(id)
        if (existing) {
          entities.set(id, { ...existing, ...updates, updatedAt: new Date().toISOString() })
          set({ entities })
        }
      },

      removeEntity: (id) => {
        const entities = new Map(get().entities)
        entities.delete(id)
        set({ entities })
      },

      addConnection: (connection) => {
        const connections = new Map(get().connections)
        connections.set(connection.id, connection)
        set({ connections })
      },

      removeConnection: (id) => {
        const connections = new Map(get().connections)
        connections.delete(id)
        set({ connections })
      },

      addAnalysis: (analysis) => {
        set(state => ({
          analises: [analysis, ...state.analises].slice(0, 50)
        }))
      },

      getEntityById: (id) => get().entities.get(id),

      getEntitiesByType: (type) => {
        return Array.from(get().entities.values()).filter(e => e.type === type)
      },

      getConnectedEntities: (entityId) => {
        const connections = get().connections
        const entities = get().entities
        const connected: UrbanEntity[] = []
        
        connections.forEach(conn => {
          if (conn.sourceId === entityId) {
            const target = entities.get(conn.targetId)
            if (target) connected.push(target)
          }
          if (conn.bidirectional && conn.targetId === entityId) {
            const source = entities.get(conn.sourceId)
            if (source) connected.push(source)
          }
        })
        
        return connected
      },

      getDashboardData: (): OntologyDashboardData => {
        const state = get()
        return {
          resumo: state.metricas,
          alertasAtivos: state.alertasAtivos,
          eventosRecentes: state.eventosRecentes,
          previsoes: state.previsoes,
          analises: state.analises,
          bairrosCriticos: state.bairros.filter(b => b.indiceGeral < 65),
          entidadesCriticas: Array.from(state.entities.values()).filter(e => e.status === 'emergencia' || e.status === 'alerta'),
          fluxosCriticos: []
        }
      }
    }),
    {
      name: 'ontology-storage',
      partialize: (state) => ({
        analises: state.analises,
        previsoes: state.previsoes
      })
    }
  )
)
