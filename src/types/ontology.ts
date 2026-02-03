// ==========================================
// NÚCLEO DE ONTOLOGIA URBANA - PARNAMIRIM
// Modelo Digital da Cidade como Organismo Vivo
// ==========================================

// Coordenadas geográficas
export interface GeoLocation {
  lat: number
  lng: number
  altitude?: number
}

// Base para todas as entidades do grafo
export interface UrbanEntity {
  id: string
  type: EntityType
  name: string
  description?: string
  location: GeoLocation
  status: EntityStatus
  connections: EntityConnection[]
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export type EntityType = 
  | 'pessoa'
  | 'endereco'
  | 'infraestrutura'
  | 'veiculo'
  | 'equipamento_publico'
  | 'fluxo'
  | 'evento'
  | 'demanda'

export type EntityStatus = 'ativo' | 'inativo' | 'manutencao' | 'emergencia' | 'alerta'

// Conexões entre entidades (arestas do grafo)
export interface EntityConnection {
  id: string
  sourceId: string
  targetId: string
  type: ConnectionType
  strength: number // 0-1 força da conexão
  bidirectional: boolean
  metadata?: Record<string, unknown>
}

export type ConnectionType = 
  | 'reside_em'           // Pessoa -> Endereço
  | 'trabalha_em'         // Pessoa -> Equipamento
  | 'atende'              // Equipamento -> Endereço
  | 'fornece'             // Fluxo -> Endereço
  | 'monitora'            // Infraestrutura -> Área
  | 'transita'            // Veículo -> Via
  | 'responde_a'          // Veículo -> Demanda
  | 'localizado_em'       // Infraestrutura -> Endereço
  | 'proximo_a'           // Qualquer -> Qualquer
  | 'depende_de'          // Fluxo -> Infraestrutura
  | 'afeta'               // Evento -> Entidades
  | 'gera'                // Pessoa -> Demanda

// ==========================================
// ENTIDADES ESPECÍFICAS
// ==========================================

// PESSOAS
export interface Pessoa extends UrbanEntity {
  type: 'pessoa'
  categoria: 'morador' | 'servidor' | 'visitante'
  cpfHash?: string // Hash para privacidade
  bairro: string
  enderecoId?: string
  ocupacao?: string
  secretariaId?: string // Se servidor
  cargo?: string
  contatoEmergencia?: string
  vulnerabilidade?: 'nenhuma' | 'baixa' | 'media' | 'alta' | 'critica'
}

// ENDEREÇOS
export interface Endereco extends UrbanEntity {
  type: 'endereco'
  logradouro: string
  numero: string
  complemento?: string
  bairro: string
  cep: string
  tipoOcupacao: 'residencial' | 'comercial' | 'industrial' | 'misto' | 'publico' | 'vazio'
  zonaUrbana: 'centro' | 'periferia' | 'rural'
  acessibilidade: boolean
  populacaoEstimada?: number
  infraestruturaIds: string[]
  fluxosIds: string[]
}

// INFRAESTRUTURA
export type InfrastructureCategory = 
  | 'iluminacao'    // Postes, lâmpadas
  | 'seguranca'     // Câmeras, alarmes
  | 'sinalizacao'   // Semáforos, placas
  | 'viario'        // Ruas, calçadas
  | 'drenagem'      // Bueiros, galerias
  | 'comunicacao'   // Antenas, fibra
  | 'outros'

export interface Infraestrutura extends UrbanEntity {
  type: 'infraestrutura'
  categoria: InfrastructureCategory
  subtipo: string // 'poste', 'camera', 'semaforo', 'buraco', etc
  fabricante?: string
  modelo?: string
  dataInstalacao?: string
  ultimaManutencao?: string
  proximaManutencao?: string
  vidaUtilRestante?: number // em meses
  custoManutencao?: number
  nivelCriticidade: 1 | 2 | 3 | 4 | 5
  sensores?: SensorData[]
  cobertura?: GeoLocation[] // Área de cobertura (polígono)
}

export interface SensorData {
  tipo: string
  valor: number
  unidade: string
  timestamp: string
  limiteMinimo?: number
  limiteMaximo?: number
  emAlerta: boolean
}

// VEÍCULOS
export type VehicleCategory = 
  | 'viatura'
  | 'ambulancia'
  | 'caminhao_lixo'
  | 'caminhao_pipa'
  | 'carro_oficial'
  | 'onibus'
  | 'maquinario'

export interface Veiculo extends UrbanEntity {
  type: 'veiculo'
  categoria: VehicleCategory
  placa: string
  modelo: string
  ano: number
  secretariaId: string
  motoristaAtualId?: string
  disponivel: boolean
  emMissao: boolean
  missaoAtualId?: string
  combustivel: number // 0-100%
  quilometragem: number
  ultimaRevisao?: string
  rastreamento: VehicleTracking
}

export interface VehicleTracking {
  velocidade: number
  direcao: number // graus
  ultimaAtualizacao: string
  historicoRota: GeoLocation[]
}

// EQUIPAMENTOS PÚBLICOS
export type PublicEquipmentCategory = 
  | 'saude'         // Postos, UPAs, hospitais
  | 'educacao'      // Escolas, creches
  | 'seguranca'     // Delegacias, quartéis
  | 'assistencia'   // CRAS, abrigos
  | 'esporte'       // Praças, quadras
  | 'cultura'       // Bibliotecas, centros culturais
  | 'administrativo' // Prefeitura, secretarias

export interface EquipamentoPublico extends UrbanEntity {
  type: 'equipamento_publico'
  categoria: PublicEquipmentCategory
  subtipo: string
  secretariaId: string
  capacidade?: number
  ocupacaoAtual?: number
  horarioFuncionamento: {
    abertura: string
    fechamento: string
    diasSemana: number[]
  }
  servicosOferecidos: string[]
  areaAtendimentoKm?: number
  populacaoAtendida?: number
  telefone?: string
  responsavelId?: string
  avaliacaoMedia?: number
  equipamentos: string[]
}

// FLUXOS URBANOS
export type FlowCategory = 
  | 'energia'
  | 'agua'
  | 'esgoto'
  | 'gas'
  | 'internet'
  | 'transito'
  | 'transporte_publico'

export interface Fluxo extends UrbanEntity {
  type: 'fluxo'
  categoria: FlowCategory
  fornecedor?: string
  capacidadeTotal: number
  capacidadeUtilizada: number
  unidade: string
  qualidade: number // 0-100
  ultimaMedicao: string
  historico: FlowMeasurement[]
  alertas: FlowAlert[]
  zonasAfetadas: string[] // IDs de bairros/áreas
}

export interface FlowMeasurement {
  timestamp: string
  valor: number
  qualidade: number
}

export interface FlowAlert {
  id: string
  tipo: 'interrupcao' | 'baixa_pressao' | 'vazamento' | 'sobrecarga' | 'manutencao'
  severidade: 1 | 2 | 3 | 4 | 5
  inicio: string
  previsaoRetorno?: string
  descricao: string
  areasAfetadas: string[]
}

// EVENTOS URBANOS
export type EventCategory = 
  | 'acidente'
  | 'alagamento'
  | 'incendio'
  | 'queda_arvore'
  | 'manifestacao'
  | 'evento_publico'
  | 'obra'
  | 'crime'
  | 'emergencia_saude'

export interface EventoUrbano extends UrbanEntity {
  type: 'evento'
  categoria: EventCategory
  severidade: 1 | 2 | 3 | 4 | 5
  inicio: string
  fim?: string
  emAndamento: boolean
  entidadesAfetadas: string[]
  recursosMobilizados: string[]
  populacaoAfetada?: number
  custoEstimado?: number
  responsavelId?: string
  acoes: EventAction[]
}

export interface EventAction {
  id: string
  descricao: string
  responsavel: string
  status: 'pendente' | 'em_andamento' | 'concluida'
  timestamp: string
}

// ==========================================
// GRAFO URBANO
// ==========================================

export interface UrbanGraph {
  nodes: Map<string, UrbanEntity>
  edges: Map<string, EntityConnection>
  bairros: BairroData[]
  metricas: CityMetrics
  ultimaAtualizacao: string
}

export interface BairroData {
  id: string
  nome: string
  populacao: number
  area: number // km²
  densidade: number
  centroide: GeoLocation
  limites: GeoLocation[]
  indiceSaude: number
  indiceEducacao: number
  indiceSeguranca: number
  indiceInfraestrutura: number
  indiceGeral: number
  entidadesCount: Record<EntityType, number>
}

export interface CityMetrics {
  populacaoTotal: number
  areaTotalKm2: number
  totalEntidades: number
  totalConexoes: number
  saudeGeral: number // 0-100
  
  // Por categoria
  infraestrutura: {
    postesTotal: number
    postesAtivos: number
    camerasTotal: number
    camerasAtivas: number
    semaforosTotal: number
    semaforosAtivos: number
    buracosReportados: number
  }
  
  veiculos: {
    total: number
    disponiveis: number
    emMissao: number
    manutencao: number
  }
  
  equipamentos: {
    escolas: number
    postosSaude: number
    delegacias: number
    pracas: number
  }
  
  fluxos: {
    coberturaEnergia: number
    coberturaAgua: number
    coberturaEsgoto: number
    coberturaInternet: number
    qualidadeTransito: number
  }
  
  eventos: {
    ativos: number
    ultimas24h: number
    criticosAtivos: number
  }
}

// ==========================================
// ANÁLISE E PREVISÕES (QUIMERA)
// ==========================================

export interface QuimeraAnalysis {
  id: string
  tipo: 'previsao' | 'recomendacao' | 'alerta' | 'insight'
  titulo: string
  descricao: string
  confianca: number // 0-100
  impacto: 'baixo' | 'medio' | 'alto' | 'critico'
  entidadesRelacionadas: string[]
  acoesSugeridas: SuggestedAction[]
  dadosBase: Record<string, unknown>
  geradoEm: string
  validoAte?: string
}

export interface SuggestedAction {
  id: string
  descricao: string
  prioridade: number
  custoEstimado?: number
  tempoEstimado?: string
  responsavelSugerido?: string
  impactoEsperado: string
}

export interface QuimeraPrediction {
  tipo: 'demanda' | 'manutencao' | 'crise' | 'fluxo' | 'recurso'
  horizonte: string // "1h", "24h", "7d", "30d"
  previsao: string
  probabilidade: number
  fatoresContribuintes: string[]
  acoesPreventivas: string[]
}

// ==========================================
// DASHBOARD DA ONTOLOGIA
// ==========================================

export interface OntologyDashboardData {
  resumo: CityMetrics
  alertasAtivos: FlowAlert[]
  eventosRecentes: EventoUrbano[]
  previsoes: QuimeraPrediction[]
  analises: QuimeraAnalysis[]
  bairrosCriticos: BairroData[]
  entidadesCriticas: UrbanEntity[]
  fluxosCriticos: Fluxo[]
}
