// ============================================
// TIPOS DE INTEGRAÇÕES - HUB CENTRAL DE DADOS
// Sistema de Gestão Urbana Parnamirim
// ============================================

// Status de conexão das integrações
export type IntegrationStatus = 'online' | 'offline' | 'degraded' | 'maintenance' | 'error';

// Categoria de integração
export type IntegrationCategory = 
  | 'comunicacao' 
  | 'monitoramento' 
  | 'fiscalizacao' 
  | 'infraestrutura' 
  | 'meio_ambiente' 
  | 'seguranca'
  | 'administrativo';

// Base para todas as integrações
export interface IntegrationBase {
  id: string;
  nome: string;
  descricao: string;
  categoria: IntegrationCategory;
  status: IntegrationStatus;
  ultimaAtualizacao: Date;
  dadosRecebidos: number;
  taxaAtualizacao: string; // ex: "tempo real", "a cada 5min", "diário"
  apiEndpoint?: string;
  icone: string;
  cor: string;
}

// ============================================
// 1. WHATSAPP OUVIDORIA
// ============================================
export interface WhatsAppOuvidoria extends IntegrationBase {
  tipo: 'whatsapp';
  mensagensHoje: number;
  mensagensSemana: number;
  conversasAtivas: number;
  tempoMedioResposta: number; // minutos
  satisfacaoMedia: number; // 0-5
  canaisAtivos: string[];
  filaEspera: number;
  atendentesOnline: number;
  mensagensPorCategoria: {
    categoria: string;
    quantidade: number;
  }[];
  ultimasMensagens: {
    id: string;
    telefone: string;
    mensagem: string;
    dataHora: Date;
    status: 'pendente' | 'respondida' | 'encaminhada';
    categoria?: string;
    sentimento?: 'positivo' | 'neutro' | 'negativo';
  }[];
}

// ============================================
// 2. CÂMERAS DA CIDADE
// ============================================
export interface CameraUrbana {
  id: string;
  nome: string;
  localizacao: {
    lat: number;
    lng: number;
    endereco: string;
    bairro: string;
  };
  tipo: 'fixa' | 'ptz' | 'lpr' | 'termica';
  status: 'online' | 'offline' | 'manutencao';
  resolucao: string;
  streamUrl?: string;
  ultimaDeteccao?: {
    tipo: string;
    dataHora: Date;
    confianca: number;
  };
  alertasAtivos: number;
  gravando: boolean;
  armazenamentoDias: number;
}

export interface CamerasIntegracao extends IntegrationBase {
  tipo: 'cameras';
  totalCameras: number;
  camerasOnline: number;
  camerasOffline: number;
  camerasManutencao: number;
  deteccoesHoje: number;
  alertasAtivos: number;
  armazenamentoUsado: number; // GB
  armazenamentoTotal: number; // GB
  cameras: CameraUrbana[];
  zonasCriticas: {
    bairro: string;
    cameras: number;
    alertas: number;
  }[];
}

// ============================================
// 3. DRONES
// ============================================
export interface Drone {
  id: string;
  modelo: string;
  matricula: string;
  status: 'em_voo' | 'base' | 'carregando' | 'manutencao';
  bateria: number; // %
  autonomia: number; // minutos restantes
  altitude?: number; // metros
  velocidade?: number; // km/h
  posicaoAtual?: {
    lat: number;
    lng: number;
  };
  missaoAtual?: {
    id: string;
    tipo: 'patrulha' | 'emergencia' | 'mapeamento' | 'inspecao';
    inicio: Date;
    previsaoFim: Date;
    area: string;
  };
  operador: string;
  ultimoVoo: Date;
  horasVoo: number;
}

export interface DronesIntegracao extends IntegrationBase {
  tipo: 'drones';
  totalDrones: number;
  dronesEmVoo: number;
  dronesBase: number;
  dronesCarregando: number;
  dronesManutencao: number;
  missoesConcluidas: number;
  areaMonitoradaKm2: number;
  imagensCapturadas: number;
  alertasGerados: number;
  drones: Drone[];
  missoesProgramadas: {
    id: string;
    tipo: string;
    area: string;
    horarioPrevisto: Date;
    droneDesignado?: string;
  }[];
}

// ============================================
// 4. SISTEMA IPTU
// ============================================
export interface ImovelIPTU {
  inscricao: string;
  endereco: string;
  bairro: string;
  proprietario: string;
  areaTerreno: number; // m²
  areaConstruida: number; // m²
  tipoImovel: 'residencial' | 'comercial' | 'industrial' | 'terreno' | 'misto';
  valorVenal: number;
  iptuAnual: number;
  statusPagamento: 'em_dia' | 'atrasado' | 'isento' | 'negociando';
  ultimoPagamento?: Date;
  debitoTotal?: number;
}

export interface IPTUIntegracao extends IntegrationBase {
  tipo: 'iptu';
  totalImoveis: number;
  imoveisAdimplentes: number;
  imoveisInadimplentes: number;
  imoveisIsentos: number;
  arrecadacaoAnual: number;
  arrecadacaoMes: number;
  inadimplenciaPercent: number;
  valorVenalTotal: number;
  distribuicaoPorTipo: {
    tipo: string;
    quantidade: number;
    valorTotal: number;
  }[];
  bairrosMaisValiosos: {
    bairro: string;
    valorMedio: number;
    imoveis: number;
  }[];
  tendenciaArrecadacao: {
    mes: string;
    valor: number;
  }[];
}

// ============================================
// 5. HISTÓRICO DE DEMANDAS
// ============================================
export interface DemandaHistorico {
  id: string;
  protocolo: string;
  titulo: string;
  descricao: string;
  categoria: string;
  subcategoria: string;
  status: 'aberta' | 'em_andamento' | 'resolvida' | 'cancelada';
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  dataAbertura: Date;
  dataResolucao?: Date;
  tempoResolucao?: number; // horas
  secretariaResponsavel: string;
  bairro: string;
  endereco: string;
  origem: 'whatsapp' | 'site' | 'presencial' | 'telefone' | 'app';
  cidadao?: {
    nome: string;
    contato: string;
  };
  avaliacaoSatisfacao?: number;
}

export interface DemandasHistoricoIntegracao extends IntegrationBase {
  tipo: 'demandas_historico';
  totalDemandas: number;
  demandasAbertas: number;
  demandasEmAndamento: number;
  demandasResolvidas: number;
  demandasCanceladas: number;
  tempoMedioResolucao: number; // horas
  satisfacaoMedia: number;
  demandaPorCategoria: {
    categoria: string;
    quantidade: number;
    tempoMedio: number;
  }[];
  demandaPorBairro: {
    bairro: string;
    quantidade: number;
    resolvidas: number;
  }[];
  tendenciaMensal: {
    mes: string;
    abertas: number;
    resolvidas: number;
  }[];
  topProblemas: {
    problema: string;
    ocorrencias: number;
    taxaResolucao: number;
  }[];
}

// ============================================
// 6. SATÉLITES
// ============================================
export interface ImagemSatelite {
  id: string;
  satelite: string;
  dataCaptura: Date;
  resolucao: string;
  coberturaNuvens: number; // %
  area: {
    norte: number;
    sul: number;
    leste: number;
    oeste: number;
  };
  tipo: 'visivel' | 'infravermelho' | 'radar' | 'multiespectral';
  tamanhoMB: number;
  urlPreview?: string;
}

export interface SatelitesIntegracao extends IntegrationBase {
  tipo: 'satelites';
  satelitesMonitorando: string[];
  imagensDisponiveis: number;
  ultimaCaptura: Date;
  coberturaPercent: number;
  alertasVegetacao: number;
  alertasOcupacao: number;
  alertasAlagamento: number;
  imagens: ImagemSatelite[];
  analisesRecentes: {
    tipo: string;
    resultado: string;
    dataAnalise: Date;
    confianca: number;
  }[];
}

// ============================================
// 7. RADARES INTELIGENTES
// ============================================
export interface RadarInteligente {
  id: string;
  localizacao: {
    lat: number;
    lng: number;
    endereco: string;
    sentido: string;
  };
  tipo: 'velocidade' | 'avanco_sinal' | 'faixa_exclusiva' | 'rodizio' | 'multiuso';
  velocidadeLimite?: number;
  status: 'ativo' | 'inativo' | 'manutencao';
  infracoesDia: number;
  infracoesMes: number;
  fluxoVeiculos: number; // veículos/hora
  velocidadeMedia: number;
}

export interface RadaresIntegracao extends IntegrationBase {
  tipo: 'radares';
  totalRadares: number;
  radaresAtivos: number;
  radaresInativos: number;
  radaresManutencao: number;
  infracoesDia: number;
  infracoesMes: number;
  arrecadacaoMultas: number;
  velocidadeMediaCidade: number;
  radares: RadarInteligente[];
  pontosQuentes: {
    local: string;
    infracoes: number;
    tipoMaisComum: string;
  }[];
  tendenciaInfracoes: {
    dia: string;
    quantidade: number;
  }[];
}

// ============================================
// 8. DADOS DE TRÂNSITO
// ============================================
export interface ViaTransito {
  id: string;
  nome: string;
  tipo: 'avenida' | 'rua' | 'rodovia' | 'estrada';
  nivelCongestionamento: 0 | 1 | 2 | 3 | 4 | 5; // 0=livre, 5=parado
  velocidadeMedia: number;
  incidentes: number;
  previsaoNormalizacao?: Date;
}

export interface TransitoIntegracao extends IntegrationBase {
  tipo: 'transito';
  nivelGeralCidade: number; // 0-100
  viasMonitoradas: number;
  incidentesAtivos: number;
  tempoMedioDeslocamento: number; // minutos
  veiculosCirculando: number;
  semaforos: {
    total: number;
    sincronizados: number;
    comProblema: number;
  };
  vias: ViaTransito[];
  incidentes: {
    id: string;
    tipo: 'acidente' | 'obra' | 'evento' | 'alagamento' | 'obstrucao';
    local: string;
    inicio: Date;
    impacto: 'baixo' | 'medio' | 'alto' | 'critico';
    descricao: string;
  }[];
  horariosRush: {
    periodo: string;
    inicio: string;
    fim: string;
    intensidade: number;
  }[];
}

// ============================================
// 9. DADOS DE ILUMINAÇÃO
// ============================================
export interface PontoIluminacao {
  id: string;
  codigo: string;
  localizacao: {
    lat: number;
    lng: number;
    endereco: string;
    bairro: string;
  };
  tipo: 'led' | 'vapor_sodio' | 'vapor_mercurio' | 'halogenio';
  potencia: number; // watts
  status: 'funcionando' | 'queimada' | 'intermitente' | 'manutencao';
  ultimaManutencao: Date;
  consumoMensal: number; // kWh
  horasUso: number;
}

export interface IluminacaoIntegracao extends IntegrationBase {
  tipo: 'iluminacao';
  totalPontos: number;
  pontosFuncionando: number;
  pontosQueimados: number;
  pontosIntermitentes: number;
  pontosManutencao: number;
  consumoMensalMWh: number;
  custoMensalEnergia: number;
  chamadosAbertos: number;
  tempoMedioReparo: number; // horas
  pontos: PontoIluminacao[];
  bairrosCriticos: {
    bairro: string;
    pontosProblema: number;
    percentualOperante: number;
  }[];
  economiaLED: {
    pontosConvertidos: number;
    economiaAnual: number;
    reducaoCO2: number;
  };
}

// ============================================
// 10. BANCO DE PROBLEMAS URBANOS
// ============================================
export type TipoProblemaUrbano = 
  | 'buraco' 
  | 'lampada_queimada' 
  | 'lixo_irregular' 
  | 'entulho' 
  | 'arvore_risco' 
  | 'bueiro_entupido' 
  | 'calcada_danificada' 
  | 'sinalizacao_danificada'
  | 'vazamento_agua'
  | 'esgoto_aberto'
  | 'mato_alto'
  | 'pichacao'
  | 'abandono_veiculo'
  | 'animal_risco';

export interface ProblemaUrbano {
  id: string;
  tipo: TipoProblemaUrbano;
  descricao: string;
  localizacao: {
    lat: number;
    lng: number;
    endereco: string;
    bairro: string;
  };
  gravidade: 'baixa' | 'media' | 'alta' | 'critica';
  status: 'reportado' | 'confirmado' | 'em_reparo' | 'resolvido';
  dataReporte: Date;
  dataResolucao?: Date;
  origem: 'cidadao' | 'patrulha' | 'drone' | 'camera' | 'satelite' | 'sensor';
  fotos?: string[];
  responsavel?: string;
  custo_estimado?: number;
}

export interface ProblemasUrbanosIntegracao extends IntegrationBase {
  tipo: 'problemas_urbanos';
  totalProblemas: number;
  problemasAbertos: number;
  problemasEmReparo: number;
  problemasResolvidos: number;
  custoEstimadoTotal: number;
  tempoMedioResolucao: number; // dias
  problemas: ProblemaUrbano[];
  distribuicaoTipo: {
    tipo: TipoProblemaUrbano;
    quantidade: number;
    percentual: number;
  }[];
  distribuicaoBairro: {
    bairro: string;
    quantidade: number;
    gravidade_media: number;
  }[];
  evolucaoMensal: {
    mes: string;
    novos: number;
    resolvidos: number;
  }[];
}

// ============================================
// 11. CLIMA E ENCHENTES
// ============================================
export interface AlertaMeteorologico {
  id: string;
  tipo: 'chuva_forte' | 'tempestade' | 'vendaval' | 'calor_extremo' | 'seca' | 'granizo' | 'alagamento';
  nivel: 'amarelo' | 'laranja' | 'vermelho';
  titulo: string;
  descricao: string;
  inicio: Date;
  fim?: Date;
  areesAfetadas: string[];
  recomendacoes: string[];
  fonte: string;
}

export interface PontoAlagamento {
  id: string;
  nome: string;
  localizacao: {
    lat: number;
    lng: number;
    endereco: string;
    bairro: string;
  };
  nivelAtual: number; // cm
  nivelCritico: number; // cm
  status: 'normal' | 'atencao' | 'alerta' | 'critico';
  ultimaMedicao: Date;
  historico: {
    data: Date;
    nivel: number;
  }[];
}

export interface ClimaIntegracao extends IntegrationBase {
  tipo: 'clima';
  temperaturaAtual: number;
  sensacaoTermica: number;
  umidade: number;
  pressao: number;
  ventoVelocidade: number;
  ventoDirecao: string;
  condicao: 'sol' | 'nublado' | 'parcialmente_nublado' | 'chuva_fraca' | 'chuva' | 'chuva_forte' | 'tempestade';
  probabilidadeChuva: number;
  indiceUV: number;
  qualidadeAr: number; // 0-500
  alertasAtivos: AlertaMeteorologico[];
  pontosAlagamento: PontoAlagamento[];
  previsao: {
    data: Date;
    tempMin: number;
    tempMax: number;
    condicao: string;
    probabilidadeChuva: number;
  }[];
  historicoPluviometrico: {
    mes: string;
    precipitacao: number;
    mediaNormal: number;
  }[];
}

// ============================================
// 12. DADOS DAS SECRETARIAS
// ============================================
export interface SecretariaData {
  id: string;
  sigla: string;
  nome: string;
  secretario: string;
  email: string;
  telefone: string;
  endereco: string;
  funcionarios: number;
  orcamentoAnual: number;
  orcamentoExecutado: number;
  demandasAtivas: number;
  demandasResolvidas: number;
  satisfacaoMedia: number;
  projetosEmAndamento: number;
  indicadores: {
    nome: string;
    valor: number;
    meta: number;
    unidade: string;
  }[];
  ultimasAtualizacoes: {
    tipo: string;
    descricao: string;
    data: Date;
  }[];
}

export interface SecretariasIntegracao extends IntegrationBase {
  tipo: 'secretarias';
  totalSecretarias: number;
  orcamentoTotal: number;
  execucaoMedia: number; // %
  funcionariosTotais: number;
  demandasTotais: number;
  taxaResolucao: number; // %
  secretarias: SecretariaData[];
  rankingDesempenho: {
    secretaria: string;
    score: number;
    posicao: number;
  }[];
  alertasOrcamentarios: {
    secretaria: string;
    tipo: 'subexecucao' | 'excesso' | 'prazo';
    mensagem: string;
  }[];
}

// ============================================
// HUB DE INTEGRAÇÕES - CONSOLIDADO
// ============================================
export type IntegracaoTipo = 
  | WhatsAppOuvidoria
  | CamerasIntegracao
  | DronesIntegracao
  | IPTUIntegracao
  | DemandasHistoricoIntegracao
  | SatelitesIntegracao
  | RadaresIntegracao
  | TransitoIntegracao
  | IluminacaoIntegracao
  | ProblemasUrbanosIntegracao
  | ClimaIntegracao
  | SecretariasIntegracao;

export interface HubIntegracoes {
  ultimaAtualizacaoGeral: Date;
  integracoesOnline: number;
  integracoesOffline: number;
  integracoesDegradadas: number;
  totalDadosProcessados: number;
  alertasGerais: {
    id: string;
    tipo: 'info' | 'warning' | 'error' | 'success';
    origem: string;
    mensagem: string;
    dataHora: Date;
    lido: boolean;
  }[];
  integracoes: {
    whatsapp: WhatsAppOuvidoria;
    cameras: CamerasIntegracao;
    drones: DronesIntegracao;
    iptu: IPTUIntegracao;
    demandas: DemandasHistoricoIntegracao;
    satelites: SatelitesIntegracao;
    radares: RadaresIntegracao;
    transito: TransitoIntegracao;
    iluminacao: IluminacaoIntegracao;
    problemasUrbanos: ProblemasUrbanosIntegracao;
    clima: ClimaIntegracao;
    secretarias: SecretariasIntegracao;
  };
  metricsUnificadas: {
    populacaoAtendida: number;
    areaCobertaKm2: number;
    dispositivosConectados: number;
    eventosProcessadosHoje: number;
    tempoMedioResposta: number;
    satisfacaoCidadao: number;
    economia: number;
    sustentabilidade: number; // score 0-100
  };
}

// Eventos em tempo real
export interface EventoTempoReal {
  id: string;
  timestamp: Date;
  origem: string;
  tipo: 'alerta' | 'dado' | 'status' | 'acao';
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  titulo: string;
  descricao: string;
  dados?: Record<string, unknown>;
  localizacao?: {
    lat: number;
    lng: number;
    endereco?: string;
  };
  acaoNecessaria?: boolean;
}
