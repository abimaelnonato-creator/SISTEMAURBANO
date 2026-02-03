// Configuração geográfica real de Parnamirim/RN
// Dados baseados em coordenadas reais do município

// =============================================
// SEMSUR - Secretaria Municipal de Serviços Urbanos
// Sistema exclusivo para gestão de serviços urbanos
// =============================================

export const SEMSUR_CONFIG = {
  nome: 'Secretaria Municipal de Serviços Urbanos',
  sigla: 'SEMSUR',
  endereco: {
    sede: 'Rua Frei Henrique de Coimbra, nº 235, Emaús - Parnamirim/RN',
    mercados: 'Avenida Tenente Medeiros, 83, Centro - Parnamirim/RN',
  },
  horarios: {
    atendimento: 'Segunda a Sexta, das 7h30 às 13h30',
    callCenter: '7h às 18h',
  },
  contatos: {
    callCenter: '0800-281-6400',
    iluminacao: '(84) 3644-8243',
    protocolo: '(84) 3644-8421',
    gabinete: '(84) 3644-8420',
  },
  whatsapp: {
    numero: '', // Configurar número oficial
    ativo: true,
  },
  portalDigital: 'https://parnamirimdigital.rn.gov.br',
  servicos: [
    { id: 'iluminacao', nome: 'Iluminação Pública (LED)', icone: 'Lightbulb', cor: '#F59E0B' },
    { id: 'limpeza', nome: 'Limpeza Urbana', icone: 'Trash2', cor: '#10B981' },
    { id: 'pracas', nome: 'Praças e Jardins', icone: 'Trees', cor: '#8B5CF6' },
    { id: 'mercados', nome: 'Mercados e Cemitérios', icone: 'Store', cor: '#EC4899' },
    { id: 'drenagem', nome: 'Drenagem e Galerias', icone: 'Droplets', cor: '#0EA5E9' },
    { id: 'infraestrutura', nome: 'Infraestrutura Geral', icone: 'Building2', cor: '#6366F1' },
  ],
  categorias: {
    iluminacao: ['Poste Apagado', 'Lâmpada LED Queimada', 'Fiação Exposta', 'Poste Danificado'],
    limpeza: ['Coleta de Lixo', 'Lixo/Entulho', 'Varrição', 'Descarte Irregular'],
    pracas: ['Manutenção de Praça', 'Poda de Árvores', 'Capinação', 'Mobiliário Danificado'],
    mercados: ['Manutenção de Mercado', 'Manutenção de Cemitério'],
    drenagem: ['Bueiro Entupido', 'Alagamento', 'Galeria Obstruída'],
    infraestrutura: ['Calçada Danificada', 'Buraco em Via', 'Outros'],
  },
};

export const PARNAMIRIM_CONFIG = {
  // Centro da cidade
  center: {
    lat: -5.9157,
    lng: -35.2631,
  },
  
  // Bounding box da cidade
  bounds: {
    north: -5.8500,
    south: -6.0200,
    east: -35.1600,
    west: -35.3500,
  },
  
  // Zoom padrão
  defaultZoom: 13,
  minZoom: 11,
  maxZoom: 19,
  
  // Área aproximada em km²
  area: 123.471,
  
  // População aproximada (2024)
  population: 267036,
  
  // Informações do município
  info: {
    nome: 'Parnamirim',
    estado: 'Rio Grande do Norte',
    regiao: 'Nordeste',
    codigoIBGE: '2403251',
    gentilico: 'parnamirinense',
    prefeito: 'Rosano Taveira',
    apelido: 'Cidade Espacial', // Lei Municipal nº 2.246/2022
  },
  
  // SEMSUR - referência direta
  semsur: SEMSUR_CONFIG,
};

// =====================================
// BAIRROS OFICIAIS DE PARNAMIRIM
// =====================================

export interface Bairro {
  id: string;
  nome: string;
  coords: [number, number];
  polygon: [number, number][];
  populacao: number;
  area: number;
  cor: string;
  densidade?: number;
  tipo: 'urbano' | 'litoral' | 'rural' | 'militar';
  cepInicio?: string;
  cepFim?: string;
}

export const BAIRROS_PARNAMIRIM: Bairro[] = [
  // ========== BAIRROS URBANOS ==========
  { 
    id: 'centro',
    nome: 'Centro', 
    coords: [-5.9157, -35.2631],
    polygon: [
      [-5.9100, -35.2700], [-5.9100, -35.2550], 
      [-5.9200, -35.2550], [-5.9200, -35.2700]
    ],
    populacao: 15000,
    area: 2.5,
    cor: '#3B82F6',
    densidade: 6000,
    tipo: 'urbano',
    cepInicio: '59140-001',
    cepFim: '59140-970',
  },
  { 
    id: 'cohabinal',
    nome: 'Cohabinal', 
    coords: [-5.9100, -35.2750],
    polygon: [
      [-5.9040, -35.2810], [-5.9040, -35.2690],
      [-5.9160, -35.2690], [-5.9160, -35.2810]
    ],
    populacao: 22000,
    area: 3.2,
    cor: '#A855F7',
    densidade: 6875,
    tipo: 'urbano',
    cepInicio: '59140-670',
    cepFim: '59140-840',
  },
  { 
    id: 'liberdade',
    nome: 'Liberdade', 
    coords: [-5.9180, -35.2520],
    polygon: [
      [-5.9120, -35.2580], [-5.9120, -35.2460],
      [-5.9240, -35.2460], [-5.9240, -35.2580]
    ],
    populacao: 28000,
    area: 4.1,
    cor: '#84CC16',
    densidade: 6829,
    tipo: 'urbano',
    cepInicio: '59155-510',
    cepFim: '59156-080',
  },
  { 
    id: 'monte-castelo',
    nome: 'Monte Castelo', 
    coords: [-5.9280, -35.2780],
    polygon: [
      [-5.9200, -35.2850], [-5.9200, -35.2710],
      [-5.9360, -35.2710], [-5.9360, -35.2850]
    ],
    populacao: 18000,
    area: 3.5,
    cor: '#06B6D4',
    densidade: 5143,
    tipo: 'urbano',
    cepInicio: '59146-070',
    cepFim: '59146-970',
  },
  { 
    id: 'passagem-de-areia',
    nome: 'Passagem de Areia', 
    coords: [-5.9380, -35.2550],
    polygon: [
      [-5.9320, -35.2620], [-5.9320, -35.2480],
      [-5.9440, -35.2480], [-5.9440, -35.2620]
    ],
    populacao: 14000,
    area: 2.8,
    cor: '#14B8A6',
    densidade: 5000,
    tipo: 'urbano',
    cepInicio: '59145-000',
    cepFim: '59146-060',
  },
  { 
    id: 'rosa-dos-ventos',
    nome: 'Rosa dos Ventos', 
    coords: [-5.8920, -35.2680],
    polygon: [
      [-5.8850, -35.2750], [-5.8850, -35.2610],
      [-5.8990, -35.2610], [-5.8990, -35.2750]
    ],
    populacao: 12000,
    area: 2.4,
    cor: '#F97316',
    densidade: 5000,
    tipo: 'urbano',
    cepInicio: '59141-250',
    cepFim: '59142-170',
  },
  { 
    id: 'vale-do-sol',
    nome: 'Vale do Sol', 
    coords: [-5.9050, -35.2850],
    polygon: [
      [-5.8990, -35.2920], [-5.8990, -35.2780],
      [-5.9110, -35.2780], [-5.9110, -35.2920]
    ],
    populacao: 10000,
    area: 2.2,
    cor: '#FBBF24',
    densidade: 4545,
    tipo: 'urbano',
    cepInicio: '59143-000',
    cepFim: '59143-300',
  },
  { 
    id: 'boa-esperanca',
    nome: 'Boa Esperança', 
    coords: [-5.9000, -35.2600],
    polygon: [
      [-5.8940, -35.2660], [-5.8940, -35.2540],
      [-5.9060, -35.2540], [-5.9060, -35.2660]
    ],
    populacao: 11000,
    area: 2.0,
    cor: '#22C55E',
    densidade: 5500,
    tipo: 'urbano',
    cepInicio: '59140-340',
    cepFim: '59140-660',
  },
  { 
    id: 'bela-parnamirim',
    nome: 'Bela Parnamirim', 
    coords: [-5.8980, -35.2720],
    polygon: [
      [-5.8920, -35.2780], [-5.8920, -35.2660],
      [-5.9040, -35.2660], [-5.9040, -35.2780]
    ],
    populacao: 9000,
    area: 1.8,
    cor: '#EC4899',
    densidade: 5000,
    tipo: 'urbano',
    cepInicio: '59142-500',
    cepFim: '59142-825',
  },
  { 
    id: 'nova-parnamirim',
    nome: 'Nova Parnamirim', 
    coords: [-5.8850, -35.2350],
    polygon: [
      [-5.8700, -35.2500], [-5.8700, -35.2200],
      [-5.9000, -35.2200], [-5.9000, -35.2500]
    ],
    populacao: 55000,
    area: 9.5,
    cor: '#10B981',
    densidade: 5789,
    tipo: 'urbano',
    cepInicio: '59150-010',
    cepFim: '59153-052',
  },
  { 
    id: 'nova-esperanca',
    nome: 'Nova Esperança', 
    coords: [-5.9120, -35.2900],
    polygon: [
      [-5.9060, -35.2970], [-5.9060, -35.2830],
      [-5.9180, -35.2830], [-5.9180, -35.2970]
    ],
    populacao: 13000,
    area: 2.6,
    cor: '#8B5CF6',
    densidade: 5000,
    tipo: 'urbano',
    cepInicio: '59143-350',
    cepFim: '59144-850',
  },
  { 
    id: 'emaus',
    nome: 'Emaús', 
    coords: [-5.9050, -35.2450],
    polygon: [
      [-5.8980, -35.2550], [-5.8980, -35.2350],
      [-5.9120, -35.2350], [-5.9120, -35.2550]
    ],
    populacao: 32000,
    area: 5.2,
    cor: '#F59E0B',
    densidade: 6154,
    tipo: 'urbano',
    cepInicio: '59148-060',
    cepFim: '59149-420',
  },
  { 
    id: 'jardim-planalto',
    nome: 'Jardim Planalto', 
    coords: [-5.9250, -35.2650],
    polygon: [
      [-5.9190, -35.2720], [-5.9190, -35.2580],
      [-5.9310, -35.2580], [-5.9310, -35.2720]
    ],
    populacao: 11000,
    area: 2.3,
    cor: '#0EA5E9',
    densidade: 4783,
    tipo: 'urbano',
    cepInicio: '59155-001',
    cepFim: '59155-505',
  },
  { 
    id: 'parque-das-arvores',
    nome: 'Parque das Árvores', 
    coords: [-5.8780, -35.2280],
    polygon: [
      [-5.8720, -35.2350], [-5.8720, -35.2210],
      [-5.8840, -35.2210], [-5.8840, -35.2350]
    ],
    populacao: 8000,
    area: 1.9,
    cor: '#4ADE80',
    densidade: 4211,
    tipo: 'urbano',
    cepInicio: '59154-000',
    cepFim: '59154-350',
  },
  { 
    id: 'parque-das-nacoes',
    nome: 'Parque das Nações', 
    coords: [-5.8700, -35.2180],
    polygon: [
      [-5.8640, -35.2250], [-5.8640, -35.2110],
      [-5.8760, -35.2110], [-5.8760, -35.2250]
    ],
    populacao: 12000,
    area: 2.5,
    cor: '#7C3AED',
    densidade: 4800,
    tipo: 'urbano',
    cepInicio: '59158-002',
    cepFim: '59159-810',
  },
  { 
    id: 'parque-de-exposicoes',
    nome: 'Parque de Exposições', 
    coords: [-5.9200, -35.2850],
    polygon: [
      [-5.9140, -35.2920], [-5.9140, -35.2780],
      [-5.9260, -35.2780], [-5.9260, -35.2920]
    ],
    populacao: 6000,
    area: 3.0,
    cor: '#D97706',
    densidade: 2000,
    tipo: 'urbano',
    cepInicio: '59146-380',
    cepFim: '59146-900',
  },
  { 
    id: 'parque-do-jiqui',
    nome: 'Parque do Jiqui', 
    coords: [-5.8950, -35.2200],
    polygon: [
      [-5.8890, -35.2280], [-5.8890, -35.2120],
      [-5.9010, -35.2120], [-5.9010, -35.2280]
    ],
    populacao: 15000,
    area: 3.5,
    cor: '#0D9488',
    densidade: 4286,
    tipo: 'urbano',
    cepInicio: '59153-150',
    cepFim: '59153-903',
  },
  { 
    id: 'santa-tereza',
    nome: 'Santa Tereza', 
    coords: [-5.9080, -35.2580],
    polygon: [
      [-5.9020, -35.2640], [-5.9020, -35.2520],
      [-5.9140, -35.2520], [-5.9140, -35.2640]
    ],
    populacao: 9000,
    area: 1.8,
    cor: '#DB2777',
    densidade: 5000,
    tipo: 'urbano',
    cepInicio: '59142-180',
    cepFim: '59142-440',
  },
  { 
    id: 'santos-reis',
    nome: 'Santos Reis', 
    coords: [-5.9020, -35.2700],
    polygon: [
      [-5.8960, -35.2770], [-5.8960, -35.2630],
      [-5.9080, -35.2630], [-5.9080, -35.2770]
    ],
    populacao: 8000,
    area: 1.6,
    cor: '#9333EA',
    densidade: 5000,
    tipo: 'urbano',
    cepInicio: '59141-000',
    cepFim: '59141-900',
  },
  { 
    id: 'vida-nova',
    nome: 'Vida Nova', 
    coords: [-5.9150, -35.2950],
    polygon: [
      [-5.9090, -35.3020], [-5.9090, -35.2880],
      [-5.9210, -35.2880], [-5.9210, -35.3020]
    ],
    populacao: 7000,
    area: 1.5,
    cor: '#C026D3',
    densidade: 4667,
    tipo: 'urbano',
    cepInicio: '59147-045',
    cepFim: '59147-865',
  },
  { 
    id: 'encanto-verde',
    nome: 'Encanto Verde', 
    coords: [-5.8920, -35.2550],
    polygon: [
      [-5.8860, -35.2620], [-5.8860, -35.2480],
      [-5.8980, -35.2480], [-5.8980, -35.2620]
    ],
    populacao: 6000,
    area: 1.4,
    cor: '#16A34A',
    densidade: 4286,
    tipo: 'urbano',
    cepInicio: '59149-455',
    cepFim: '59149-892',
  },
  
  // ========== BAIRROS/DISTRITOS LITORÂNEOS ==========
  { 
    id: 'cotovelo',
    nome: 'Cotovelo', 
    coords: [-5.9400, -35.1900],
    polygon: [
      [-5.9300, -35.2050], [-5.9300, -35.1750],
      [-5.9500, -35.1750], [-5.9500, -35.2050]
    ],
    populacao: 8000,
    area: 5.5,
    cor: '#0891B2',
    densidade: 1455,
    tipo: 'litoral',
    cepInicio: '59161-000',
    cepFim: '59161-900',
  },
  { 
    id: 'pirangi-do-norte',
    nome: 'Pirangi do Norte', 
    coords: [-5.9820, -35.1800],
    polygon: [
      [-5.9700, -35.1950], [-5.9700, -35.1650],
      [-5.9940, -35.1650], [-5.9940, -35.1950]
    ],
    populacao: 5500,
    area: 4.5,
    cor: '#EA580C',
    densidade: 1222,
    tipo: 'litoral',
    cepInicio: '59161-250',
    cepFim: '59161-902',
  },
  { 
    id: 'pium',
    nome: 'Pium', 
    coords: [-5.8650, -35.2050],
    polygon: [
      [-5.8550, -35.2180], [-5.8550, -35.1920],
      [-5.8750, -35.1920], [-5.8750, -35.2180]
    ],
    populacao: 12000,
    area: 7.0,
    cor: '#0284C7',
    densidade: 1714,
    tipo: 'litoral',
    cepInicio: '59160-390',
    cepFim: '59160-906',
  },
  
  // ========== ÁREA RURAL ==========
  { 
    id: 'area-rural',
    nome: 'Área Rural', 
    coords: [-5.9500, -35.2800],
    polygon: [
      [-5.9350, -35.3100], [-5.9350, -35.2500],
      [-5.9650, -35.2500], [-5.9650, -35.3100]
    ],
    populacao: 3000,
    area: 25.0,
    cor: '#65A30D',
    densidade: 120,
    tipo: 'rural',
    cepInicio: '59161-899',
    cepFim: '59161-899',
  },
  
  // ========== ÁREA MILITAR ==========
  { 
    id: 'base-aerea-bant',
    nome: 'Base Aérea de Natal (BANT)', 
    coords: [-5.9110, -35.2470],
    polygon: [
      [-5.9000, -35.2600], [-5.9000, -35.2340],
      [-5.9220, -35.2340], [-5.9220, -35.2600]
    ],
    populacao: 2000,
    area: 12.0,
    cor: '#475569',
    densidade: 167,
    tipo: 'militar',
  },
  { 
    id: 'clbi',
    nome: 'CLBI - Barreira do Inferno', 
    coords: [-5.9280, -35.1950],
    polygon: [
      [-5.9180, -35.2100], [-5.9180, -35.1800],
      [-5.9380, -35.1800], [-5.9380, -35.2100]
    ],
    populacao: 500,
    area: 8.0,
    cor: '#334155',
    densidade: 63,
    tipo: 'militar',
  },
];

// =====================================
// TIPOS DE PONTOS DE INTERESSE
// =====================================

export type TipoPOI = 
  | 'publico' 
  | 'militar' 
  | 'saude' 
  | 'educacao' 
  | 'comercio' 
  | 'lazer' 
  | 'praia' 
  | 'turismo' 
  | 'seguranca' 
  | 'transporte'
  | 'patrimonio'
  | 'religioso'
  | 'esporte';

export interface PontoInteresse {
  id: string;
  nome: string;
  tipo: TipoPOI;
  coords: [number, number];
  icone: string;
  descricao?: string;
  telefone?: string;
  endereco?: string;
  bairro?: string;
  nivelImportancia?: 1 | 2 | 3 | 4 | 5;
  patrimonioOficial?: boolean;
}

// =====================================
// PONTOS DE INTERESSE REAIS DE PARNAMIRIM
// =====================================

export const PONTOS_INTERESSE: PontoInteresse[] = [
  // ========== PATRIMÔNIOS HISTÓRICOS E CULTURAIS ==========
  { 
    id: 'clbi-barreira-inferno', 
    nome: 'Centro de Lançamento Barreira do Inferno (CLBI)', 
    tipo: 'patrimonio', 
    coords: [-5.9280, -35.1950], 
    icone: 'rocket',
    descricao: 'Primeira base de lançamento de foguetes da América do Sul. Marco da vocação espacial de Parnamirim.',
    bairro: 'CLBI',
    nivelImportancia: 5,
    patrimonioOficial: true,
  },
  { 
    id: 'cajueiro-pirangi', 
    nome: 'Maior Cajueiro do Mundo', 
    tipo: 'turismo', 
    coords: [-5.9820, -35.1780], 
    icone: 'tree',
    descricao: 'Patrimônio natural e turístico reconhecido. Maior cajueiro do mundo com mais de 8.500 m².',
    bairro: 'Pirangi do Norte',
    nivelImportancia: 5,
    patrimonioOficial: true,
  },
  { 
    id: 'feirinha-pium', 
    nome: 'Feirinha de Frutas de Pium', 
    tipo: 'patrimonio', 
    coords: [-5.8670, -35.2080], 
    icone: 'apple',
    descricao: 'Patrimônio Cultural, Histórico, Turístico e Social do RN (Lei 2025)',
    bairro: 'Pium',
    nivelImportancia: 4,
    patrimonioOficial: true,
  },
  { 
    id: 'parque-exposicoes', 
    nome: 'Parque de Exposições Aristófanes Fernandes', 
    tipo: 'patrimonio', 
    coords: [-5.9200, -35.2850], 
    icone: 'tent',
    descricao: 'Maior exposição agropecuária do Nordeste. Patrimônio histórico, cultural e turístico do RN.',
    bairro: 'Parque de Exposições',
    nivelImportancia: 5,
    patrimonioOficial: true,
  },
  { 
    id: 'feira-santos-reis', 
    nome: 'Feira Livre de Santos Reis', 
    tipo: 'patrimonio', 
    coords: [-5.9020, -35.2700], 
    icone: 'store',
    descricao: 'Patrimônio Cultural Imaterial de Parnamirim (Lei Municipal 2025)',
    bairro: 'Santos Reis',
    nivelImportancia: 4,
    patrimonioOficial: true,
  },
  
  // ========== ÓRGÃOS PÚBLICOS ==========
  { 
    id: 'prefeitura', 
    nome: 'Prefeitura Municipal de Parnamirim', 
    tipo: 'publico', 
    coords: [-5.9157, -35.2631], 
    icone: 'building',
    endereco: 'Av. Marechal Castelo Branco, 1000 - Centro',
    telefone: '(84) 3644-8000',
    bairro: 'Centro',
    nivelImportancia: 5,
  },
  { 
    id: 'camara', 
    nome: 'Câmara Municipal de Parnamirim', 
    tipo: 'publico', 
    coords: [-5.9145, -35.2625], 
    icone: 'landmark',
    endereco: 'Rua Coronel Estevam, 143 - Centro',
    bairro: 'Centro',
    nivelImportancia: 4,
  },
  { 
    id: 'forum', 
    nome: 'Fórum de Parnamirim', 
    tipo: 'publico', 
    coords: [-5.8880, -35.2360], 
    icone: 'scale',
    endereco: 'Av. Abel Cabral, 3500 - Nova Parnamirim',
    bairro: 'Nova Parnamirim',
    nivelImportancia: 4,
  },
  
  // ========== ÁREA MILITAR ==========
  { 
    id: 'base-aerea', 
    nome: 'Base Aérea de Natal (BANT)', 
    tipo: 'militar', 
    coords: [-5.9110, -35.2470], 
    icone: 'plane',
    descricao: 'Maior base aérea do Nordeste brasileiro. História ligada à 2ª Guerra Mundial.',
    bairro: 'Base Aérea',
    nivelImportancia: 5,
  },
  
  // ========== HOSPITAIS E SAÚDE ==========
  { 
    id: 'hospital-maria-alice', 
    nome: 'Hospital Maria Alice Fernandes', 
    tipo: 'saude', 
    coords: [-5.9180, -35.2520], 
    icone: 'hospital',
    endereco: 'Liberdade',
    telefone: '(84) 3644-8200',
    bairro: 'Liberdade',
    nivelImportancia: 5,
  },
  { 
    id: 'upa-parnamirim', 
    nome: 'UPA 24h Parnamirim', 
    tipo: 'saude', 
    coords: [-5.8900, -35.2420], 
    icone: 'hospital',
    endereco: 'Av. Maria Lacerda Montenegro, 1200',
    telefone: '(84) 3644-8300',
    bairro: 'Nova Parnamirim',
    nivelImportancia: 4,
  },
  { 
    id: 'ubs-centro', 
    nome: 'UBS Centro', 
    tipo: 'saude', 
    coords: [-5.9160, -35.2620], 
    icone: 'stethoscope',
    endereco: 'Rua Doutor José Augusto, 150 - Centro',
    bairro: 'Centro',
    nivelImportancia: 3,
  },
  { 
    id: 'ubs-nova-parnamirim', 
    nome: 'UBS Nova Parnamirim', 
    tipo: 'saude', 
    coords: [-5.8870, -35.2380], 
    icone: 'stethoscope',
    endereco: 'Rua Minas Novas, 2200 - Nova Parnamirim',
    bairro: 'Nova Parnamirim',
    nivelImportancia: 3,
  },
  { 
    id: 'ubs-emaus', 
    nome: 'UBS Emaús', 
    tipo: 'saude', 
    coords: [-5.9050, -35.2460], 
    icone: 'stethoscope',
    bairro: 'Emaús',
    nivelImportancia: 3,
  },
  { 
    id: 'ubs-liberdade', 
    nome: 'UBS Liberdade', 
    tipo: 'saude', 
    coords: [-5.9190, -35.2530], 
    icone: 'stethoscope',
    bairro: 'Liberdade',
    nivelImportancia: 3,
  },
  { 
    id: 'ubs-monte-castelo', 
    nome: 'UBS Monte Castelo', 
    tipo: 'saude', 
    coords: [-5.9285, -35.2785], 
    icone: 'stethoscope',
    bairro: 'Monte Castelo',
    nivelImportancia: 3,
  },
  
  // ========== EDUCAÇÃO ==========
  { 
    id: 'ifrn', 
    nome: 'IFRN Campus Parnamirim', 
    tipo: 'educacao', 
    coords: [-5.8880, -35.2380], 
    icone: 'school',
    descricao: 'Instituto Federal do Rio Grande do Norte',
    endereco: 'Av. Brigadeiro Everaldo Breves, 100 - Nova Parnamirim',
    bairro: 'Nova Parnamirim',
    nivelImportancia: 5,
  },
  { 
    id: 'escola-maria-cristina', 
    nome: 'Escola Estadual Profª Maria Cristina', 
    tipo: 'educacao', 
    coords: [-5.9160, -35.2640], 
    icone: 'school',
    endereco: 'Rua São José, 100 - Centro',
    bairro: 'Centro',
    nivelImportancia: 3,
  },
  { 
    id: 'escola-emaus', 
    nome: 'Escola Municipal Emaús', 
    tipo: 'educacao', 
    coords: [-5.9055, -35.2455], 
    icone: 'school',
    bairro: 'Emaús',
    nivelImportancia: 3,
  },
  { 
    id: 'senai', 
    nome: 'SENAI Parnamirim', 
    tipo: 'educacao', 
    coords: [-5.8900, -35.2500], 
    icone: 'graduation-cap',
    endereco: 'Av. Abel Cabral, 2000 - Nova Parnamirim',
    bairro: 'Nova Parnamirim',
    nivelImportancia: 4,
  },
  { 
    id: 'escola-cohabinal', 
    nome: 'Escola Municipal Cohabinal', 
    tipo: 'educacao', 
    coords: [-5.9095, -35.2745], 
    icone: 'school',
    bairro: 'Cohabinal',
    nivelImportancia: 3,
  },
  { 
    id: 'escola-liberdade', 
    nome: 'Escola Municipal Liberdade', 
    tipo: 'educacao', 
    coords: [-5.9175, -35.2515], 
    icone: 'school',
    bairro: 'Liberdade',
    nivelImportancia: 3,
  },
  
  // ========== COMÉRCIO ==========
  { 
    id: 'shopping-partage', 
    nome: 'Partage Norte Shopping', 
    tipo: 'comercio', 
    coords: [-5.8820, -35.2350], 
    icone: 'shopping-bag',
    endereco: 'Av. Maria Lacerda Montenegro, 5000 - Nova Parnamirim',
    descricao: 'Principal shopping center da cidade',
    bairro: 'Nova Parnamirim',
    nivelImportancia: 4,
  },
  { 
    id: 'nordestao-nova-parnamirim', 
    nome: 'Nordestão Nova Parnamirim', 
    tipo: 'comercio', 
    coords: [-5.8900, -35.2420], 
    icone: 'store',
    bairro: 'Nova Parnamirim',
    nivelImportancia: 3,
  },
  { 
    id: 'extra-parnamirim', 
    nome: 'Extra Parnamirim', 
    tipo: 'comercio', 
    coords: [-5.8850, -35.2380], 
    icone: 'store',
    bairro: 'Nova Parnamirim',
    nivelImportancia: 3,
  },
  { 
    id: 'atacadao', 
    nome: 'Atacadão', 
    tipo: 'comercio', 
    coords: [-5.8950, -35.2300], 
    icone: 'store',
    endereco: 'BR-101, km 10 - Nova Parnamirim',
    bairro: 'Nova Parnamirim',
    nivelImportancia: 3,
  },
  { 
    id: 'mercado-centro', 
    nome: 'Mercado Público do Centro', 
    tipo: 'comercio', 
    coords: [-5.9155, -35.2635], 
    icone: 'store',
    bairro: 'Centro',
    nivelImportancia: 3,
  },
  
  // ========== LAZER E PRAÇAS ==========
  { 
    id: 'praca-getulio-vargas', 
    nome: 'Praça Getúlio Vargas', 
    tipo: 'lazer', 
    coords: [-5.9155, -35.2628], 
    icone: 'trees',
    descricao: 'Praça central de Parnamirim',
    bairro: 'Centro',
    nivelImportancia: 3,
  },
  { 
    id: 'parque-dom-nivaldo', 
    nome: 'Parque Dom Nivaldo Monte', 
    tipo: 'lazer', 
    coords: [-5.8880, -35.2500], 
    icone: 'tree-deciduous',
    bairro: 'Nova Parnamirim',
    nivelImportancia: 3,
  },
  { 
    id: 'cidade-crianca', 
    nome: 'Parque Aluízio Alves - Cidade da Criança', 
    tipo: 'lazer', 
    coords: [-5.8920, -35.2600], 
    icone: 'ferris-wheel',
    descricao: 'Espaço de lazer e cultura com planetário',
    bairro: 'Boa Esperança',
    nivelImportancia: 4,
  },
  { 
    id: 'praca-liberdade', 
    nome: 'Praça da Liberdade', 
    tipo: 'lazer', 
    coords: [-5.9178, -35.2518], 
    icone: 'trees',
    bairro: 'Liberdade',
    nivelImportancia: 2,
  },
  { 
    id: 'praca-monte-castelo', 
    nome: 'Praça de Monte Castelo', 
    tipo: 'lazer', 
    coords: [-5.9280, -35.2780], 
    icone: 'trees',
    bairro: 'Monte Castelo',
    nivelImportancia: 2,
  },
  { 
    id: 'praca-boa-esperanca', 
    nome: 'Praça Boa Esperança', 
    tipo: 'lazer', 
    coords: [-5.9000, -35.2600], 
    icone: 'trees',
    bairro: 'Boa Esperança',
    nivelImportancia: 2,
  },
  
  // ========== PRAIAS ==========
  { 
    id: 'praia-cotovelo', 
    nome: 'Praia de Cotovelo', 
    tipo: 'praia', 
    coords: [-5.9420, -35.1820], 
    icone: 'umbrella-beach',
    descricao: 'Praia com falésias e águas tranquilas',
    bairro: 'Cotovelo',
    nivelImportancia: 4,
  },
  { 
    id: 'praia-pirangi', 
    nome: 'Praia de Pirangi do Norte', 
    tipo: 'praia', 
    coords: [-5.9850, -35.1780], 
    icone: 'umbrella-beach',
    descricao: 'Famosa por seus passeios de barco e proximidade do cajueiro',
    bairro: 'Pirangi do Norte',
    nivelImportancia: 5,
  },
  { 
    id: 'praia-pium', 
    nome: 'Praia de Pium', 
    tipo: 'praia', 
    coords: [-5.8600, -35.1950], 
    icone: 'umbrella-beach',
    descricao: 'Praia tranquila com dunas',
    bairro: 'Pium',
    nivelImportancia: 4,
  },
  
  // ========== SEGURANÇA ==========
  { 
    id: 'delegacia-civil', 
    nome: 'Delegacia de Polícia Civil', 
    tipo: 'seguranca', 
    coords: [-5.9165, -35.2615], 
    icone: 'shield',
    endereco: 'Rua Dr. José Augusto, 200 - Centro',
    telefone: '(84) 3232-1234',
    bairro: 'Centro',
    nivelImportancia: 4,
  },
  { 
    id: 'batalhao-pm', 
    nome: '17º Batalhão de Polícia Militar', 
    tipo: 'seguranca', 
    coords: [-5.9140, -35.2650], 
    icone: 'shield-check',
    endereco: 'Av. Marechal Castelo Branco, 500 - Centro',
    telefone: '190',
    bairro: 'Centro',
    nivelImportancia: 4,
  },
  { 
    id: 'bombeiros', 
    nome: 'Corpo de Bombeiros', 
    tipo: 'seguranca', 
    coords: [-5.9120, -35.2580], 
    icone: 'flame',
    telefone: '193',
    bairro: 'Centro',
    nivelImportancia: 4,
  },
  { 
    id: 'guarda-municipal', 
    nome: 'Guarda Municipal de Parnamirim', 
    tipo: 'seguranca', 
    coords: [-5.9150, -35.2625], 
    icone: 'shield',
    bairro: 'Centro',
    nivelImportancia: 3,
  },
  
  // ========== TRANSPORTE ==========
  { 
    id: 'terminal-integracao', 
    nome: 'Terminal de Integração', 
    tipo: 'transporte', 
    coords: [-5.8920, -35.2450], 
    icone: 'bus',
    endereco: 'Av. Maria Lacerda Montenegro - Nova Parnamirim',
    bairro: 'Nova Parnamirim',
    nivelImportancia: 4,
  },
  { 
    id: 'rodoviaria', 
    nome: 'Rodoviária de Parnamirim', 
    tipo: 'transporte', 
    coords: [-5.9175, -35.2600], 
    icone: 'bus',
    bairro: 'Centro',
    nivelImportancia: 3,
  },
  
  // ========== ESPORTES ==========
  { 
    id: 'estadio-palacio-popular', 
    nome: 'Estádio Palácio Popular da Cidade Espacial', 
    tipo: 'esporte', 
    coords: [-5.9100, -35.2700], 
    icone: 'circle-dot',
    bairro: 'Cohabinal',
    nivelImportancia: 3,
  },
  { 
    id: 'ginasio-nova-parnamirim', 
    nome: 'Ginásio Poliesportivo Nova Parnamirim', 
    tipo: 'esporte', 
    coords: [-5.8870, -35.2400], 
    icone: 'dumbbell',
    bairro: 'Nova Parnamirim',
    nivelImportancia: 3,
  },
];

// =====================================
// VIAS E RODOVIAS PRINCIPAIS
// =====================================

export type TipoVia = 'federal' | 'estadual' | 'municipal' | 'local';

export interface Via {
  id: string;
  nome: string;
  tipo: TipoVia;
  coords: [number, number][];
  velocidadeMaxima?: number;
  faixas?: number;
  descricao?: string;
}

export const VIAS_PRINCIPAIS: Via[] = [
  // ========== RODOVIAS FEDERAIS ==========
  { 
    id: 'br-101', 
    nome: 'BR-101', 
    tipo: 'federal', 
    coords: [
      [-5.8500, -35.2600], 
      [-5.8700, -35.2580],
      [-5.8900, -35.2560],
      [-5.9100, -35.2580], 
      [-5.9300, -35.2600],
      [-5.9500, -35.2620],
      [-5.9800, -35.2650]
    ],
    velocidadeMaxima: 80,
    faixas: 4,
    descricao: 'Principal ligação com Natal (norte) e João Pessoa/Recife (sul). Viadutos: Neópolis, Emaús, Abel Cabral, Cohabinal.',
  },
  { 
    id: 'br-304', 
    nome: 'BR-304', 
    tipo: 'federal', 
    coords: [
      [-5.9200, -35.2700], 
      [-5.9300, -35.2900],
      [-5.9400, -35.3100],
      [-5.9500, -35.3300]
    ],
    velocidadeMaxima: 80,
    faixas: 2,
    descricao: 'Ligação com Macaíba, Mossoró e Ceará.',
  },
  
  // ========== RODOVIA ESTADUAL ==========
  { 
    id: 'rn-063', 
    nome: 'RN-063 (Rota do Sol)', 
    tipo: 'estadual', 
    coords: [
      [-5.8800, -35.2400], 
      [-5.9000, -35.2200],
      [-5.9200, -35.2000],
      [-5.9400, -35.1900],
      [-5.9700, -35.1850],
      [-5.9900, -35.1800]
    ],
    velocidadeMaxima: 60,
    faixas: 2,
    descricao: 'Acesso às praias do litoral sul.',
  },
  
  // ========== AVENIDAS MUNICIPAIS ==========
  { 
    id: 'av-brigadeiro-everaldo', 
    nome: 'Av. Brigadeiro Everaldo Breves', 
    tipo: 'municipal', 
    coords: [
      [-5.9050, -35.2700], 
      [-5.9100, -35.2650],
      [-5.9150, -35.2600],
      [-5.9200, -35.2550]
    ],
    velocidadeMaxima: 50,
    faixas: 4,
    descricao: 'Eixo central do Centro, grande concentração comercial.',
  },
  { 
    id: 'av-abel-cabral', 
    nome: 'Av. Abel Cabral', 
    tipo: 'municipal', 
    coords: [
      [-5.8750, -35.2400], 
      [-5.8850, -35.2400],
      [-5.8950, -35.2400],
      [-5.9050, -35.2400]
    ],
    velocidadeMaxima: 50,
    faixas: 4,
    descricao: 'Corredor de comércio e serviços em Nova Parnamirim; acesso à BR-101.',
  },
  { 
    id: 'av-maria-lacerda', 
    nome: 'Av. Maria Lacerda Montenegro', 
    tipo: 'municipal', 
    coords: [
      [-5.8800, -35.2500], 
      [-5.8900, -35.2450],
      [-5.9000, -35.2400],
      [-5.9100, -35.2350],
      [-5.9200, -35.2250]
    ],
    velocidadeMaxima: 60,
    faixas: 4,
    descricao: 'Liga Nova Parnamirim à área litorânea.',
  },
  { 
    id: 'av-ayrton-senna', 
    nome: 'Av. Ayrton Senna', 
    tipo: 'municipal', 
    coords: [
      [-5.8700, -35.2350], 
      [-5.8800, -35.2350],
      [-5.8900, -35.2350],
      [-5.9000, -35.2350]
    ],
    velocidadeMaxima: 60,
    faixas: 4,
    descricao: 'Influencia trânsito de Nova Parnamirim.',
  },
  { 
    id: 'av-clementino-camara', 
    nome: 'Av. Clementino Câmara', 
    tipo: 'municipal', 
    coords: [
      [-5.9050, -35.2700], 
      [-5.9100, -35.2750],
      [-5.9150, -35.2800]
    ],
    velocidadeMaxima: 40,
    faixas: 2,
    descricao: 'Acesso a Cohabinal e viaduto da BR-101.',
  },
  { 
    id: 'av-castelo-branco', 
    nome: 'Av. Marechal Castelo Branco', 
    tipo: 'municipal', 
    coords: [
      [-5.9100, -35.2700], 
      [-5.9150, -35.2650],
      [-5.9200, -35.2600],
      [-5.9250, -35.2550]
    ],
    velocidadeMaxima: 40,
    faixas: 2,
    descricao: 'Avenida principal do Centro.',
  },
  { 
    id: 'av-joao-xxiii', 
    nome: 'Av. João XXIII', 
    tipo: 'municipal', 
    coords: [
      [-5.9200, -35.2750], 
      [-5.9280, -35.2780],
      [-5.9360, -35.2800]
    ],
    velocidadeMaxima: 40,
    faixas: 2,
    descricao: 'Eixo de Monte Castelo.',
  },
  { 
    id: 'estrada-cotovelo', 
    nome: 'Estrada de Cotovelo', 
    tipo: 'municipal', 
    coords: [
      [-5.9200, -35.2300], 
      [-5.9280, -35.2150],
      [-5.9360, -35.2000],
      [-5.9420, -35.1900]
    ],
    velocidadeMaxima: 40,
    faixas: 2,
    descricao: 'Acesso à Praia de Cotovelo.',
  },
  { 
    id: 'estrada-pirangi', 
    nome: 'Estrada de Pirangi', 
    tipo: 'municipal', 
    coords: [
      [-5.9450, -35.1920], 
      [-5.9550, -35.1880],
      [-5.9700, -35.1850],
      [-5.9820, -35.1800]
    ],
    velocidadeMaxima: 40,
    faixas: 2,
    descricao: 'Acesso à Praia de Pirangi e Cajueiro.',
  },
];

// =====================================
// CONFIGURAÇÕES DE SENSORES IoT
// =====================================

export type TipoSensor = 
  | 'semaforo' 
  | 'camera' 
  | 'sensor_ar' 
  | 'sensor_agua' 
  | 'sensor_energia' 
  | 'sensor_ruido'
  | 'estacao_meteorologica'
  | 'medidor_fluxo';

export interface ConfigSensor {
  tipo: TipoSensor;
  cor: string;
  icone: string;
  label: string;
  unidade?: string;
}

export const SENSORES_CONFIG: Record<TipoSensor, ConfigSensor> = {
  semaforo: { tipo: 'semaforo', cor: '#22C55E', icone: 'traffic-light', label: 'Semáforo' },
  camera: { tipo: 'camera', cor: '#3B82F6', icone: 'camera', label: 'Câmera' },
  sensor_ar: { tipo: 'sensor_ar', cor: '#8B5CF6', icone: 'wind', label: 'Qualidade do Ar', unidade: 'AQI' },
  sensor_agua: { tipo: 'sensor_agua', cor: '#06B6D4', icone: 'droplets', label: 'Qualidade da Água', unidade: 'pH' },
  sensor_energia: { tipo: 'sensor_energia', cor: '#F59E0B', icone: 'zap', label: 'Energia', unidade: 'kWh' },
  sensor_ruido: { tipo: 'sensor_ruido', cor: '#EF4444', icone: 'volume-2', label: 'Ruído', unidade: 'dB' },
  estacao_meteorologica: { tipo: 'estacao_meteorologica', cor: '#10B981', icone: 'cloud-sun', label: 'Meteorologia' },
  medidor_fluxo: { tipo: 'medidor_fluxo', cor: '#EC4899', icone: 'gauge', label: 'Fluxo de Tráfego', unidade: 'veic/h' },
};

// =====================================
// CONFIGURAÇÕES DE ALERTAS
// =====================================

export type TipoAlerta = 
  | 'demanda' 
  | 'acidente' 
  | 'alagamento' 
  | 'crime' 
  | 'obra' 
  | 'apagao' 
  | 'buraco'
  | 'incendio'
  | 'deslizamento'
  | 'vazamento';

export interface ConfigAlerta {
  tipo: TipoAlerta;
  cor: string;
  icone: string;
  label: string;
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
}

export const ALERTAS_CONFIG: Record<TipoAlerta, ConfigAlerta> = {
  demanda: { tipo: 'demanda', cor: '#3B82F6', icone: 'clipboard-list', label: 'Demanda Cidadã', prioridade: 'media' },
  acidente: { tipo: 'acidente', cor: '#EF4444', icone: 'car', label: 'Acidente', prioridade: 'alta' },
  alagamento: { tipo: 'alagamento', cor: '#06B6D4', icone: 'waves', label: 'Alagamento', prioridade: 'alta' },
  crime: { tipo: 'crime', cor: '#DC2626', icone: 'alert-triangle', label: 'Ocorrência Policial', prioridade: 'critica' },
  obra: { tipo: 'obra', cor: '#F59E0B', icone: 'hard-hat', label: 'Obra', prioridade: 'baixa' },
  apagao: { tipo: 'apagao', cor: '#6B7280', icone: 'power-off', label: 'Falta de Energia', prioridade: 'alta' },
  buraco: { tipo: 'buraco', cor: '#8B5CF6', icone: 'circle-dot', label: 'Buraco na Via', prioridade: 'media' },
  incendio: { tipo: 'incendio', cor: '#F97316', icone: 'flame', label: 'Incêndio', prioridade: 'critica' },
  deslizamento: { tipo: 'deslizamento', cor: '#A855F7', icone: 'mountain', label: 'Deslizamento', prioridade: 'critica' },
  vazamento: { tipo: 'vazamento', cor: '#14B8A6', icone: 'droplet', label: 'Vazamento', prioridade: 'alta' },
};

// =====================================
// CORES E ESTATÍSTICAS
// =====================================

export const TRAFEGO_CORES = {
  livre: '#22C55E',
  moderado: '#F59E0B', 
  lento: '#EF4444',
  congestionado: '#DC2626',
};

export const ESTATISTICAS_CIDADE = {
  sensoresInstalados: 186,
  camerasSeguranca: 112,
  semaforos: 148,
  estacoesMeteo: 12,
  viaturasOperacionais: 52,
  equipesServico: 35,
  totalBairros: 27,
  totalPOIs: 45,
  totalVias: 11,
};

// =====================================
// FUNÇÕES HELPER
// =====================================

// Converter coordenadas geográficas para posição 3D
export function coordsTo3D(
  lat: number, 
  lng: number, 
  config = PARNAMIRIM_CONFIG
): [number, number, number] {
  const x = (lng - config.center.lng) * 500;
  const z = (lat - config.center.lat) * -500;
  return [x, 0, z];
}

// Calcular distância entre dois pontos (Haversine)
export function calcularDistancia(
  coord1: [number, number], 
  coord2: [number, number]
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (coord2[0] - coord1[0]) * Math.PI / 180;
  const dLon = (coord2[1] - coord1[1]) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1[0] * Math.PI / 180) * Math.cos(coord2[0] * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Encontrar bairro por coordenadas
export function encontrarBairroPorCoordenadas(
  lat: number, 
  lng: number
): Bairro | undefined {
  let menorDistancia = Infinity;
  let bairroMaisProximo: Bairro | undefined;

  for (const bairro of BAIRROS_PARNAMIRIM) {
    const distancia = calcularDistancia([lat, lng], bairro.coords);
    if (distancia < menorDistancia) {
      menorDistancia = distancia;
      bairroMaisProximo = bairro;
    }
  }

  return bairroMaisProximo;
}

// Encontrar POIs por tipo
export function encontrarPOIsPorTipo(tipo: TipoPOI): PontoInteresse[] {
  return PONTOS_INTERESSE.filter(poi => poi.tipo === tipo);
}

// Encontrar POIs por bairro
export function encontrarPOIsPorBairro(bairroNome: string): PontoInteresse[] {
  return PONTOS_INTERESSE.filter(poi => poi.bairro === bairroNome);
}

// Obter patrimônios oficiais
export function obterPatrimoniosOficiais(): PontoInteresse[] {
  return PONTOS_INTERESSE.filter(poi => poi.patrimonioOficial === true);
}

// Obter bairros por tipo
export function obterBairrosPorTipo(tipo: Bairro['tipo']): Bairro[] {
  return BAIRROS_PARNAMIRIM.filter(bairro => bairro.tipo === tipo);
}

// Calcular população total
export function calcularPopulacaoTotal(): number {
  return BAIRROS_PARNAMIRIM.reduce((acc, bairro) => acc + bairro.populacao, 0);
}

// Obter bairros urbanos ordenados por população
export function obterBairrosOrdenadosPorPopulacao(): Bairro[] {
  return [...BAIRROS_PARNAMIRIM]
    .filter(b => b.tipo === 'urbano')
    .sort((a, b) => b.populacao - a.populacao);
}
