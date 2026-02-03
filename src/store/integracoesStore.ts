// ============================================
// STORE DE INTEGRAÇÕES - HUB CENTRAL DE DADOS
// Sistema de Gestão Urbana Parnamirim
// "Tudo cai num só lugar" - Integração Total
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  HubIntegracoes,
  EventoTempoReal,
  WhatsAppOuvidoria,
  CamerasIntegracao,
  DronesIntegracao,
  IPTUIntegracao,
  DemandasHistoricoIntegracao,
  SatelitesIntegracao,
  RadaresIntegracao,
  TransitoIntegracao,
  IluminacaoIntegracao,
  ProblemasUrbanosIntegracao,
  ClimaIntegracao,
  SecretariasIntegracao,
} from '@/types/integracoes';

// ============================================
// DADOS MOCK - PARNAMIRIM
// ============================================

const mockWhatsApp: WhatsAppOuvidoria = {
  id: 'whatsapp-ouvidoria',
  nome: 'WhatsApp Ouvidoria',
  descricao: 'Canal oficial de atendimento via WhatsApp',
  categoria: 'comunicacao',
  tipo: 'whatsapp',
  status: 'online',
  ultimaAtualizacao: new Date(),
  dadosRecebidos: 15847,
  taxaAtualizacao: 'tempo real',
  icone: 'MessageCircle',
  cor: 'green',
  mensagensHoje: 342,
  mensagensSemana: 2156,
  conversasAtivas: 47,
  tempoMedioResposta: 8,
  satisfacaoMedia: 4.2,
  canaisAtivos: ['Ouvidoria Geral', 'Saúde', 'Obras', 'Trânsito', 'Iluminação'],
  filaEspera: 12,
  atendentesOnline: 8,
  mensagensPorCategoria: [
    { categoria: 'Infraestrutura', quantidade: 89 },
    { categoria: 'Saúde', quantidade: 67 },
    { categoria: 'Segurança', quantidade: 54 },
    { categoria: 'Trânsito', quantidade: 48 },
    { categoria: 'Iluminação', quantidade: 41 },
    { categoria: 'Limpeza', quantidade: 43 },
  ],
  ultimasMensagens: [
    {
      id: 'msg-1',
      telefone: '84999****12',
      mensagem: 'Buraco grande na Rua das Flores, Nova Parnamirim',
      dataHora: new Date(Date.now() - 5 * 60000),
      status: 'pendente',
      categoria: 'Infraestrutura',
      sentimento: 'negativo',
    },
    {
      id: 'msg-2',
      telefone: '84988****45',
      mensagem: 'Lâmpada queimada há 3 dias na Av. Ayrton Senna',
      dataHora: new Date(Date.now() - 12 * 60000),
      status: 'encaminhada',
      categoria: 'Iluminação',
      sentimento: 'neutro',
    },
    {
      id: 'msg-3',
      telefone: '84977****78',
      mensagem: 'Agradecimento pelo reparo rápido do vazamento',
      dataHora: new Date(Date.now() - 25 * 60000),
      status: 'respondida',
      categoria: 'Saneamento',
      sentimento: 'positivo',
    },
  ],
};

const mockCameras: CamerasIntegracao = {
  id: 'cameras-cidade',
  nome: 'Câmeras da Cidade',
  descricao: 'Sistema de videomonitoramento urbano',
  categoria: 'monitoramento',
  tipo: 'cameras',
  status: 'online',
  ultimaAtualizacao: new Date(),
  dadosRecebidos: 2458000,
  taxaAtualizacao: 'tempo real',
  icone: 'Camera',
  cor: 'blue',
  totalCameras: 245,
  camerasOnline: 231,
  camerasOffline: 8,
  camerasManutencao: 6,
  deteccoesHoje: 1247,
  alertasAtivos: 3,
  armazenamentoUsado: 8500,
  armazenamentoTotal: 12000,
  cameras: [
    {
      id: 'cam-001',
      nome: 'Av. Ayrton Senna x Av. Maria Lacerda',
      localizacao: { lat: -5.9167, lng: -35.2167, endereco: 'Av. Ayrton Senna, 1500', bairro: 'Nova Parnamirim' },
      tipo: 'ptz',
      status: 'online',
      resolucao: '4K',
      alertasAtivos: 0,
      gravando: true,
      armazenamentoDias: 30,
    },
    {
      id: 'cam-002',
      nome: 'Centro - Praça Getúlio Vargas',
      localizacao: { lat: -5.9089, lng: -35.2628, endereco: 'Praça Getúlio Vargas', bairro: 'Centro' },
      tipo: 'ptz',
      status: 'online',
      resolucao: '4K',
      alertasAtivos: 1,
      gravando: true,
      armazenamentoDias: 30,
    },
  ],
  zonasCriticas: [
    { bairro: 'Centro', cameras: 45, alertas: 2 },
    { bairro: 'Nova Parnamirim', cameras: 38, alertas: 1 },
    { bairro: 'Emaús', cameras: 28, alertas: 0 },
  ],
};

const mockDrones: DronesIntegracao = {
  id: 'drones-frota',
  nome: 'Frota de Drones',
  descricao: 'Veículos aéreos não tripulados para monitoramento',
  categoria: 'monitoramento',
  tipo: 'drones',
  status: 'online',
  ultimaAtualizacao: new Date(),
  dadosRecebidos: 45600,
  taxaAtualizacao: 'a cada 30s',
  icone: 'Plane',
  cor: 'indigo',
  totalDrones: 8,
  dronesEmVoo: 2,
  dronesBase: 4,
  dronesCarregando: 1,
  dronesManutencao: 1,
  missoesConcluidas: 156,
  areaMonitoradaKm2: 45.6,
  imagensCapturadas: 12400,
  alertasGerados: 23,
  drones: [
    {
      id: 'drone-001',
      modelo: 'DJI Matrice 300',
      matricula: 'PNM-D001',
      status: 'em_voo',
      bateria: 72,
      autonomia: 28,
      altitude: 120,
      velocidade: 45,
      posicaoAtual: { lat: -5.9234, lng: -35.2456 },
      missaoAtual: {
        id: 'mission-001',
        tipo: 'patrulha',
        inicio: new Date(Date.now() - 45 * 60000),
        previsaoFim: new Date(Date.now() + 35 * 60000),
        area: 'Nova Parnamirim / Emaús',
      },
      operador: 'Op. Carlos Silva',
      ultimoVoo: new Date(),
      horasVoo: 234,
    },
    {
      id: 'drone-002',
      modelo: 'DJI Mavic 3 Enterprise',
      matricula: 'PNM-D002',
      status: 'em_voo',
      bateria: 45,
      autonomia: 18,
      altitude: 80,
      velocidade: 35,
      posicaoAtual: { lat: -5.9089, lng: -35.2789 },
      missaoAtual: {
        id: 'mission-002',
        tipo: 'inspecao',
        inicio: new Date(Date.now() - 25 * 60000),
        previsaoFim: new Date(Date.now() + 15 * 60000),
        area: 'Centro - Rede de Iluminação',
      },
      operador: 'Op. Maria Santos',
      ultimoVoo: new Date(),
      horasVoo: 189,
    },
  ],
  missoesProgramadas: [
    { id: 'prog-001', tipo: 'mapeamento', area: 'Pium - Expansão Urbana', horarioPrevisto: new Date(Date.now() + 2 * 3600000) },
    { id: 'prog-002', tipo: 'emergencia', area: 'Reserva - Monitoramento Ambiental', horarioPrevisto: new Date(Date.now() + 4 * 3600000) },
  ],
};

const mockIPTU: IPTUIntegracao = {
  id: 'iptu-sistema',
  nome: 'Sistema IPTU',
  descricao: 'Cadastro imobiliário e arrecadação',
  categoria: 'fiscalizacao',
  tipo: 'iptu',
  status: 'online',
  ultimaAtualizacao: new Date(),
  dadosRecebidos: 89456,
  taxaAtualizacao: 'diário',
  icone: 'Building2',
  cor: 'amber',
  totalImoveis: 89456,
  imoveisAdimplentes: 67234,
  imoveisInadimplentes: 18567,
  imoveisIsentos: 3655,
  arrecadacaoAnual: 45600000,
  arrecadacaoMes: 3800000,
  inadimplenciaPercent: 20.7,
  valorVenalTotal: 12500000000,
  distribuicaoPorTipo: [
    { tipo: 'Residencial', quantidade: 72345, valorTotal: 8900000000 },
    { tipo: 'Comercial', quantidade: 12456, valorTotal: 2800000000 },
    { tipo: 'Terreno', quantidade: 3567, valorTotal: 650000000 },
    { tipo: 'Industrial', quantidade: 1088, valorTotal: 150000000 },
  ],
  bairrosMaisValiosos: [
    { bairro: 'Nova Parnamirim', valorMedio: 380000, imoveis: 15234 },
    { bairro: 'Emaús', valorMedio: 320000, imoveis: 12456 },
    { bairro: 'Centro', valorMedio: 280000, imoveis: 8967 },
  ],
  tendenciaArrecadacao: [
    { mes: 'Jul', valor: 3200000 },
    { mes: 'Ago', valor: 3400000 },
    { mes: 'Set', valor: 3600000 },
    { mes: 'Out', valor: 3500000 },
    { mes: 'Nov', valor: 3700000 },
    { mes: 'Dez', valor: 3800000 },
  ],
};

const mockDemandas: DemandasHistoricoIntegracao = {
  id: 'demandas-historico',
  nome: 'Histórico de Demandas',
  descricao: 'Base histórica de todas as demandas da cidade',
  categoria: 'administrativo',
  tipo: 'demandas_historico',
  status: 'online',
  ultimaAtualizacao: new Date(),
  dadosRecebidos: 156789,
  taxaAtualizacao: 'tempo real',
  icone: 'FileText',
  cor: 'violet',
  totalDemandas: 156789,
  demandasAbertas: 1247,
  demandasEmAndamento: 892,
  demandasResolvidas: 152456,
  demandasCanceladas: 2194,
  tempoMedioResolucao: 72,
  satisfacaoMedia: 4.1,
  demandaPorCategoria: [
    { categoria: 'Infraestrutura', quantidade: 45678, tempoMedio: 96 },
    { categoria: 'Iluminação', quantidade: 34567, tempoMedio: 48 },
    { categoria: 'Saúde', quantidade: 28934, tempoMedio: 24 },
    { categoria: 'Trânsito', quantidade: 21456, tempoMedio: 36 },
    { categoria: 'Limpeza Urbana', quantidade: 18234, tempoMedio: 72 },
  ],
  demandaPorBairro: [
    { bairro: 'Nova Parnamirim', quantidade: 28456, resolvidas: 27123 },
    { bairro: 'Centro', quantidade: 23456, resolvidas: 22345 },
    { bairro: 'Emaús', quantidade: 19234, resolvidas: 18456 },
    { bairro: 'Boa Vista', quantidade: 15678, resolvidas: 14890 },
  ],
  tendenciaMensal: [
    { mes: 'Jul', abertas: 1890, resolvidas: 1756 },
    { mes: 'Ago', abertas: 2034, resolvidas: 1923 },
    { mes: 'Set', abertas: 1756, resolvidas: 1834 },
    { mes: 'Out', abertas: 1923, resolvidas: 1890 },
    { mes: 'Nov', abertas: 1678, resolvidas: 1756 },
    { mes: 'Dez', abertas: 1456, resolvidas: 1567 },
  ],
  topProblemas: [
    { problema: 'Buraco na via', ocorrencias: 12456, taxaResolucao: 94.5 },
    { problema: 'Lâmpada queimada', ocorrencias: 10234, taxaResolucao: 97.8 },
    { problema: 'Lixo irregular', ocorrencias: 8567, taxaResolucao: 91.2 },
    { problema: 'Vazamento', ocorrencias: 6234, taxaResolucao: 88.4 },
  ],
};

const mockSatelites: SatelitesIntegracao = {
  id: 'satelites-monitoramento',
  nome: 'Satélites',
  descricao: 'Imageamento por satélite para análise territorial',
  categoria: 'monitoramento',
  tipo: 'satelites',
  status: 'online',
  ultimaAtualizacao: new Date(Date.now() - 6 * 3600000),
  dadosRecebidos: 2456,
  taxaAtualizacao: 'a cada 6h',
  icone: 'Satellite',
  cor: 'cyan',
  satelitesMonitorando: ['Sentinel-2', 'Landsat-8', 'CBERS-4A', 'Planet'],
  imagensDisponiveis: 2456,
  ultimaCaptura: new Date(Date.now() - 2 * 3600000),
  coberturaPercent: 100,
  alertasVegetacao: 3,
  alertasOcupacao: 7,
  alertasAlagamento: 2,
  imagens: [
    {
      id: 'sat-img-001',
      satelite: 'Sentinel-2',
      dataCaptura: new Date(Date.now() - 2 * 3600000),
      resolucao: '10m',
      coberturaNuvens: 15,
      area: { norte: -5.85, sul: -5.98, leste: -35.18, oeste: -35.32 },
      tipo: 'multiespectral',
      tamanhoMB: 450,
    },
  ],
  analisesRecentes: [
    { tipo: 'Expansão urbana', resultado: 'Detectadas 12 novas construções irregulares em Pium', dataAnalise: new Date(Date.now() - 24 * 3600000), confianca: 0.92 },
    { tipo: 'Vegetação', resultado: 'Área verde preservada dentro dos limites', dataAnalise: new Date(Date.now() - 48 * 3600000), confianca: 0.95 },
    { tipo: 'Alagamento', resultado: '2 áreas de risco identificadas em Passagem de Areia', dataAnalise: new Date(Date.now() - 12 * 3600000), confianca: 0.88 },
  ],
};

const mockRadares: RadaresIntegracao = {
  id: 'radares-transito',
  nome: 'Radares Inteligentes',
  descricao: 'Sistema de fiscalização eletrônica de trânsito',
  categoria: 'fiscalizacao',
  tipo: 'radares',
  status: 'online',
  ultimaAtualizacao: new Date(),
  dadosRecebidos: 567890,
  taxaAtualizacao: 'tempo real',
  icone: 'Radar',
  cor: 'orange',
  totalRadares: 42,
  radaresAtivos: 39,
  radaresInativos: 2,
  radaresManutencao: 1,
  infracoesDia: 456,
  infracoesMes: 12456,
  arrecadacaoMultas: 890000,
  velocidadeMediaCidade: 42,
  radares: [
    {
      id: 'radar-001',
      localizacao: { lat: -5.9167, lng: -35.2167, endereco: 'Av. Ayrton Senna, 2000', sentido: 'Natal-Parnamirim' },
      tipo: 'velocidade',
      velocidadeLimite: 60,
      status: 'ativo',
      infracoesDia: 23,
      infracoesMes: 567,
      fluxoVeiculos: 1250,
      velocidadeMedia: 58,
    },
    {
      id: 'radar-002',
      localizacao: { lat: -5.9089, lng: -35.2628, endereco: 'Av. Brigadeiro Everaldo Breves', sentido: 'Centro-BR101' },
      tipo: 'multiuso',
      velocidadeLimite: 50,
      status: 'ativo',
      infracoesDia: 34,
      infracoesMes: 789,
      fluxoVeiculos: 980,
      velocidadeMedia: 48,
    },
  ],
  pontosQuentes: [
    { local: 'Av. Ayrton Senna', infracoes: 234, tipoMaisComum: 'Excesso de velocidade' },
    { local: 'BR-101 (trecho urbano)', infracoes: 189, tipoMaisComum: 'Avanço de sinal' },
    { local: 'Av. Maria Lacerda', infracoes: 156, tipoMaisComum: 'Excesso de velocidade' },
  ],
  tendenciaInfracoes: [
    { dia: 'Seg', quantidade: 89 },
    { dia: 'Ter', quantidade: 78 },
    { dia: 'Qua', quantidade: 92 },
    { dia: 'Qui', quantidade: 85 },
    { dia: 'Sex', quantidade: 112 },
    { dia: 'Sáb', quantidade: 45 },
    { dia: 'Dom', quantidade: 34 },
  ],
};

const mockTransito: TransitoIntegracao = {
  id: 'transito-dados',
  nome: 'Dados de Trânsito',
  descricao: 'Monitoramento em tempo real do fluxo viário',
  categoria: 'monitoramento',
  tipo: 'transito',
  status: 'online',
  ultimaAtualizacao: new Date(),
  dadosRecebidos: 1234567,
  taxaAtualizacao: 'tempo real',
  icone: 'Car',
  cor: 'red',
  nivelGeralCidade: 35,
  viasMonitoradas: 156,
  incidentesAtivos: 4,
  tempoMedioDeslocamento: 18,
  veiculosCirculando: 45600,
  semaforos: {
    total: 89,
    sincronizados: 78,
    comProblema: 3,
  },
  vias: [
    { id: 'via-001', nome: 'Av. Ayrton Senna', tipo: 'avenida', nivelCongestionamento: 2, velocidadeMedia: 48, incidentes: 0 },
    { id: 'via-002', nome: 'BR-101', tipo: 'rodovia', nivelCongestionamento: 3, velocidadeMedia: 55, incidentes: 1 },
    { id: 'via-003', nome: 'Av. Maria Lacerda', tipo: 'avenida', nivelCongestionamento: 1, velocidadeMedia: 52, incidentes: 0 },
  ],
  incidentes: [
    {
      id: 'inc-001',
      tipo: 'acidente',
      local: 'BR-101, km 12',
      inicio: new Date(Date.now() - 45 * 60000),
      impacto: 'medio',
      descricao: 'Colisão entre dois veículos, faixa da direita interditada',
    },
    {
      id: 'inc-002',
      tipo: 'obra',
      local: 'Rua João XXIII, Centro',
      inicio: new Date(Date.now() - 3 * 3600000),
      impacto: 'baixo',
      descricao: 'Reparo na rede de água, desvio sinalizado',
    },
  ],
  horariosRush: [
    { periodo: 'Manhã', inicio: '06:30', fim: '08:30', intensidade: 85 },
    { periodo: 'Almoço', inicio: '11:30', fim: '13:30', intensidade: 60 },
    { periodo: 'Tarde', inicio: '17:00', fim: '19:00', intensidade: 90 },
  ],
};

const mockIluminacao: IluminacaoIntegracao = {
  id: 'iluminacao-publica',
  nome: 'Iluminação Pública',
  descricao: 'Gestão da rede de iluminação urbana',
  categoria: 'infraestrutura',
  tipo: 'iluminacao',
  status: 'online',
  ultimaAtualizacao: new Date(),
  dadosRecebidos: 12500,
  taxaAtualizacao: 'a cada 5min',
  icone: 'Lightbulb',
  cor: 'yellow',
  totalPontos: 12500,
  pontosFuncionando: 11850,
  pontosQueimados: 456,
  pontosIntermitentes: 89,
  pontosManutencao: 105,
  consumoMensalMWh: 2340,
  custoMensalEnergia: 890000,
  chamadosAbertos: 234,
  tempoMedioReparo: 36,
  pontos: [],
  bairrosCriticos: [
    { bairro: 'Passagem de Areia', pontosProblema: 67, percentualOperante: 87.5 },
    { bairro: 'Cohabinal', pontosProblema: 54, percentualOperante: 89.2 },
    { bairro: 'Pium', pontosProblema: 43, percentualOperante: 91.0 },
  ],
  economiaLED: {
    pontosConvertidos: 8500,
    economiaAnual: 1200000,
    reducaoCO2: 450,
  },
};

const mockProblemasUrbanos: ProblemasUrbanosIntegracao = {
  id: 'problemas-urbanos',
  nome: 'Banco de Problemas Urbanos',
  descricao: 'Catálogo de problemas reportados na cidade',
  categoria: 'infraestrutura',
  tipo: 'problemas_urbanos',
  status: 'online',
  ultimaAtualizacao: new Date(),
  dadosRecebidos: 45678,
  taxaAtualizacao: 'tempo real',
  icone: 'AlertTriangle',
  cor: 'rose',
  totalProblemas: 45678,
  problemasAbertos: 1234,
  problemasEmReparo: 456,
  problemasResolvidos: 43567,
  custoEstimadoTotal: 2340000,
  tempoMedioResolucao: 5.2,
  problemas: [
    {
      id: 'prob-001',
      tipo: 'buraco',
      descricao: 'Buraco de 50cm de diâmetro na via',
      localizacao: { lat: -5.9234, lng: -35.2567, endereco: 'Rua das Flores, 234', bairro: 'Nova Parnamirim' },
      gravidade: 'alta',
      status: 'confirmado',
      dataReporte: new Date(Date.now() - 2 * 24 * 3600000),
      origem: 'cidadao',
      custo_estimado: 1500,
    },
    {
      id: 'prob-002',
      tipo: 'lampada_queimada',
      descricao: 'Poste sem iluminação há 5 dias',
      localizacao: { lat: -5.9189, lng: -35.2689, endereco: 'Av. Ayrton Senna, 890', bairro: 'Nova Parnamirim' },
      gravidade: 'media',
      status: 'em_reparo',
      dataReporte: new Date(Date.now() - 5 * 24 * 3600000),
      origem: 'whatsapp',
      custo_estimado: 250,
    },
  ],
  distribuicaoTipo: [
    { tipo: 'buraco', quantidade: 12456, percentual: 27.3 },
    { tipo: 'lampada_queimada', quantidade: 10234, percentual: 22.4 },
    { tipo: 'lixo_irregular', quantidade: 8567, percentual: 18.8 },
    { tipo: 'bueiro_entupido', quantidade: 5234, percentual: 11.5 },
    { tipo: 'calcada_danificada', quantidade: 4567, percentual: 10.0 },
    { tipo: 'mato_alto', quantidade: 2345, percentual: 5.1 },
    { tipo: 'sinalizacao_danificada', quantidade: 2275, percentual: 4.9 },
  ],
  distribuicaoBairro: [
    { bairro: 'Centro', quantidade: 4567, gravidade_media: 2.3 },
    { bairro: 'Nova Parnamirim', quantidade: 5678, gravidade_media: 2.1 },
    { bairro: 'Emaús', quantidade: 3456, gravidade_media: 1.9 },
    { bairro: 'Passagem de Areia', quantidade: 2890, gravidade_media: 2.5 },
  ],
  evolucaoMensal: [
    { mes: 'Jul', novos: 890, resolvidos: 823 },
    { mes: 'Ago', novos: 934, resolvidos: 912 },
    { mes: 'Set', novos: 856, resolvidos: 889 },
    { mes: 'Out', novos: 923, resolvidos: 945 },
    { mes: 'Nov', novos: 789, resolvidos: 834 },
    { mes: 'Dez', novos: 678, resolvidos: 756 },
  ],
};

const mockClima: ClimaIntegracao = {
  id: 'clima-enchentes',
  nome: 'Clima e Enchentes',
  descricao: 'Monitoramento meteorológico e pontos de alagamento',
  categoria: 'meio_ambiente',
  tipo: 'clima',
  status: 'online',
  ultimaAtualizacao: new Date(),
  dadosRecebidos: 8760,
  taxaAtualizacao: 'a cada 15min',
  icone: 'CloudRain',
  cor: 'sky',
  temperaturaAtual: 28,
  sensacaoTermica: 31,
  umidade: 72,
  pressao: 1013,
  ventoVelocidade: 12,
  ventoDirecao: 'SE',
  condicao: 'parcialmente_nublado',
  probabilidadeChuva: 35,
  indiceUV: 8,
  qualidadeAr: 45,
  alertasAtivos: [
    {
      id: 'alerta-001',
      tipo: 'chuva_forte',
      nivel: 'amarelo',
      titulo: 'Possibilidade de chuva forte',
      descricao: 'Previsão de chuvas intensas para o final da tarde',
      inicio: new Date(),
      areesAfetadas: ['Centro', 'Passagem de Areia', 'Cohabinal'],
      recomendacoes: ['Evite áreas alagáveis', 'Redobre atenção no trânsito'],
      fonte: 'INMET',
    },
  ],
  pontosAlagamento: [
    {
      id: 'alag-001',
      nome: 'Baixada do Centro',
      localizacao: { lat: -5.9089, lng: -35.2628, endereco: 'Rua da Baixada, Centro', bairro: 'Centro' },
      nivelAtual: 15,
      nivelCritico: 50,
      status: 'normal',
      ultimaMedicao: new Date(),
      historico: [],
    },
    {
      id: 'alag-002',
      nome: 'Passagem de Areia - Canal',
      localizacao: { lat: -5.9345, lng: -35.2789, endereco: 'Av. Principal', bairro: 'Passagem de Areia' },
      nivelAtual: 32,
      nivelCritico: 45,
      status: 'atencao',
      ultimaMedicao: new Date(),
      historico: [],
    },
  ],
  previsao: [
    { data: new Date(), tempMin: 24, tempMax: 30, condicao: 'parcialmente_nublado', probabilidadeChuva: 35 },
    { data: new Date(Date.now() + 24 * 3600000), tempMin: 23, tempMax: 29, condicao: 'chuva_fraca', probabilidadeChuva: 60 },
    { data: new Date(Date.now() + 48 * 3600000), tempMin: 24, tempMax: 31, condicao: 'sol', probabilidadeChuva: 15 },
  ],
  historicoPluviometrico: [
    { mes: 'Jul', precipitacao: 45, mediaNormal: 52 },
    { mes: 'Ago', precipitacao: 32, mediaNormal: 38 },
    { mes: 'Set', precipitacao: 18, mediaNormal: 22 },
    { mes: 'Out', precipitacao: 12, mediaNormal: 15 },
    { mes: 'Nov', precipitacao: 28, mediaNormal: 35 },
    { mes: 'Dez', precipitacao: 89, mediaNormal: 78 },
  ],
};

const mockSecretarias: SecretariasIntegracao = {
  id: 'secretarias-dados',
  nome: 'Dados das Secretarias',
  descricao: 'Indicadores e dados das secretarias municipais',
  categoria: 'administrativo',
  tipo: 'secretarias',
  status: 'online',
  ultimaAtualizacao: new Date(),
  dadosRecebidos: 12,
  taxaAtualizacao: 'diário',
  icone: 'Building',
  cor: 'slate',
  totalSecretarias: 12,
  orcamentoTotal: 450000000,
  execucaoMedia: 78.5,
  funcionariosTotais: 4500,
  demandasTotais: 156789,
  taxaResolucao: 92.3,
  secretarias: [
    {
      id: 'sec-obras',
      sigla: 'SEMOB',
      nome: 'Secretaria de Obras',
      secretario: 'João Silva',
      email: 'obras@parnamirim.rn.gov.br',
      telefone: '(84) 3644-8000',
      endereco: 'Rua das Flores, 100',
      funcionarios: 450,
      orcamentoAnual: 85000000,
      orcamentoExecutado: 68000000,
      demandasAtivas: 234,
      demandasResolvidas: 45678,
      satisfacaoMedia: 4.0,
      projetosEmAndamento: 23,
      indicadores: [
        { nome: 'Obras concluídas', valor: 45, meta: 60, unidade: 'unid' },
        { nome: 'Km de vias recuperadas', valor: 12.5, meta: 20, unidade: 'km' },
      ],
      ultimasAtualizacoes: [],
    },
    {
      id: 'sec-saude',
      sigla: 'SMS',
      nome: 'Secretaria de Saúde',
      secretario: 'Maria Santos',
      email: 'saude@parnamirim.rn.gov.br',
      telefone: '(84) 3644-8100',
      endereco: 'Av. Central, 500',
      funcionarios: 1200,
      orcamentoAnual: 180000000,
      orcamentoExecutado: 156000000,
      demandasAtivas: 156,
      demandasResolvidas: 28934,
      satisfacaoMedia: 3.8,
      projetosEmAndamento: 12,
      indicadores: [
        { nome: 'Atendimentos/mês', valor: 45000, meta: 50000, unidade: 'atend' },
        { nome: 'Tempo espera UBS', valor: 25, meta: 20, unidade: 'min' },
      ],
      ultimasAtualizacoes: [],
    },
  ],
  rankingDesempenho: [
    { secretaria: 'SMS', score: 87, posicao: 1 },
    { secretaria: 'SEMOB', score: 82, posicao: 2 },
    { secretaria: 'SEMUT', score: 79, posicao: 3 },
  ],
  alertasOrcamentarios: [
    { secretaria: 'SEMOB', tipo: 'subexecucao', mensagem: 'Execução orçamentária 20% abaixo do esperado' },
  ],
};

// ============================================
// HUB CONSOLIDADO
// ============================================

const mockHub: HubIntegracoes = {
  ultimaAtualizacaoGeral: new Date(),
  integracoesOnline: 11,
  integracoesOffline: 0,
  integracoesDegradadas: 1,
  totalDadosProcessados: 4567890,
  alertasGerais: [
    {
      id: 'alert-001',
      tipo: 'warning',
      origem: 'Clima',
      mensagem: 'Possibilidade de chuva forte no final da tarde',
      dataHora: new Date(),
      lido: false,
    },
    {
      id: 'alert-002',
      tipo: 'info',
      origem: 'Drones',
      mensagem: 'Drone PNM-D001 iniciou patrulha em Nova Parnamirim',
      dataHora: new Date(Date.now() - 45 * 60000),
      lido: true,
    },
    {
      id: 'alert-003',
      tipo: 'error',
      origem: 'Trânsito',
      mensagem: 'Acidente na BR-101 km 12 - faixa interditada',
      dataHora: new Date(Date.now() - 45 * 60000),
      lido: false,
    },
  ],
  integracoes: {
    whatsapp: mockWhatsApp,
    cameras: mockCameras,
    drones: mockDrones,
    iptu: mockIPTU,
    demandas: mockDemandas,
    satelites: mockSatelites,
    radares: mockRadares,
    transito: mockTransito,
    iluminacao: mockIluminacao,
    problemasUrbanos: mockProblemasUrbanos,
    clima: mockClima,
    secretarias: mockSecretarias,
  },
  metricsUnificadas: {
    populacaoAtendida: 268000,
    areaCobertaKm2: 123.4,
    dispositivosConectados: 12987,
    eventosProcessadosHoje: 45678,
    tempoMedioResposta: 8,
    satisfacaoCidadao: 4.1,
    economia: 2500000,
    sustentabilidade: 72,
  },
};

// ============================================
// INTERFACE DO STORE
// ============================================

interface IntegracoesState {
  hub: HubIntegracoes;
  eventosTempoReal: EventoTempoReal[];
  filtroCategoria: string | null;
  filtroStatus: string | null;
  buscaTexto: string;
  visualizacao: 'grid' | 'lista' | 'mapa';
  integracaoSelecionada: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setHub: (hub: HubIntegracoes) => void;
  atualizarIntegracao: <K extends keyof HubIntegracoes['integracoes']>(
    tipo: K,
    dados: Partial<HubIntegracoes['integracoes'][K]>
  ) => void;
  adicionarEvento: (evento: EventoTempoReal) => void;
  marcarAlertaLido: (alertaId: string) => void;
  setFiltroCategoria: (categoria: string | null) => void;
  setFiltroStatus: (status: string | null) => void;
  setBuscaTexto: (texto: string) => void;
  setVisualizacao: (viz: 'grid' | 'lista' | 'mapa') => void;
  setIntegracaoSelecionada: (id: string | null) => void;
  refreshHub: () => Promise<void>;
  getIntegracoesFiltradas: () => Array<{
    key: string;
    data: HubIntegracoes['integracoes'][keyof HubIntegracoes['integracoes']];
  }>;
  getEstatisticasGerais: () => {
    online: number;
    offline: number;
    degraded: number;
    totalDados: number;
    alertasNaoLidos: number;
  };
}

// ============================================
// STORE ZUSTAND
// ============================================

export const useIntegracoesStore = create<IntegracoesState>()(
  persist(
    (set, get) => ({
      hub: mockHub,
      eventosTempoReal: [],
      filtroCategoria: null,
      filtroStatus: null,
      buscaTexto: '',
      visualizacao: 'grid',
      integracaoSelecionada: null,
      isLoading: false,
      error: null,

      setHub: (hub) => set({ hub }),

      atualizarIntegracao: (tipo, dados) =>
        set((state) => ({
          hub: {
            ...state.hub,
            integracoes: {
              ...state.hub.integracoes,
              [tipo]: { ...state.hub.integracoes[tipo], ...dados },
            },
            ultimaAtualizacaoGeral: new Date(),
          },
        })),

      adicionarEvento: (evento) =>
        set((state) => ({
          eventosTempoReal: [evento, ...state.eventosTempoReal].slice(0, 100),
        })),

      marcarAlertaLido: (alertaId) =>
        set((state) => ({
          hub: {
            ...state.hub,
            alertasGerais: state.hub.alertasGerais.map((a) =>
              a.id === alertaId ? { ...a, lido: true } : a
            ),
          },
        })),

      setFiltroCategoria: (categoria) => set({ filtroCategoria: categoria }),
      setFiltroStatus: (status) => set({ filtroStatus: status }),
      setBuscaTexto: (texto) => set({ buscaTexto: texto }),
      setVisualizacao: (viz) => set({ visualizacao: viz }),
      setIntegracaoSelecionada: (id) => set({ integracaoSelecionada: id }),

      refreshHub: async () => {
        set({ isLoading: true, error: null });
        try {
          // Simula refresh dos dados
          await new Promise((resolve) => setTimeout(resolve, 1000));
          set((state) => ({
            hub: {
              ...state.hub,
              ultimaAtualizacaoGeral: new Date(),
            },
            isLoading: false,
          }));
        } catch (error) {
          set({ error: 'Erro ao atualizar dados', isLoading: false });
        }
      },

      getIntegracoesFiltradas: () => {
        const { hub, filtroCategoria, filtroStatus, buscaTexto } = get();
        const integracoes = Object.entries(hub.integracoes).map(([key, data]) => ({
          key,
          data,
        }));

        return integracoes.filter(({ data }) => {
          if (filtroCategoria && data.categoria !== filtroCategoria) return false;
          if (filtroStatus && data.status !== filtroStatus) return false;
          if (buscaTexto && !data.nome.toLowerCase().includes(buscaTexto.toLowerCase())) {
            return false;
          }
          return true;
        });
      },

      getEstatisticasGerais: () => {
        const { hub } = get();
        const integracoes = Object.values(hub.integracoes);
        return {
          online: integracoes.filter((i) => i.status === 'online').length,
          offline: integracoes.filter((i) => i.status === 'offline').length,
          degraded: integracoes.filter((i) => i.status === 'degraded').length,
          totalDados: integracoes.reduce((acc, i) => acc + i.dadosRecebidos, 0),
          alertasNaoLidos: hub.alertasGerais.filter((a) => !a.lido).length,
        };
      },
    }),
    {
      name: 'integracoes-storage',
      partialize: (state) => ({
        filtroCategoria: state.filtroCategoria,
        visualizacao: state.visualizacao,
      }),
    }
  )
);
