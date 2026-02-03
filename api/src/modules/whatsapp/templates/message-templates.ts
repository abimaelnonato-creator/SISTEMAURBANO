// ===== TEMPLATES DE MENSAGENS - SEMSUR =====
// Templates humanizados sem emojis - personalidade "Luma"

export interface TemplateVariables {
  protocol?: string;
  category?: string;
  status?: string;
  citizenName?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
  resolvedAt?: string;
  estimatedTime?: string;
  secretaryName?: string;
  feedbackUrl?: string;
  [key: string]: string | undefined;
}

export const MESSAGE_TEMPLATES = {
  // ===== BOAS-VINDAS SEMSUR =====
  welcome: `
SEMSUR - Secretaria de Servicos Urbanos
Prefeitura de Parnamirim/RN

Oi! Eu sou a Luma, assistente virtual da SEMSUR.

Estou aqui pra te ajudar com:
- Iluminacao Publica
- Limpeza Urbana
- Pracas e Jardins
- Drenagem e Bueiros
- Mercados e Cemiterios
- Infraestrutura

Me conta o que ta precisando ou manda uma foto do problema.

Central de Atendimento: 0800-281-6400
`.trim(),

  // ===== MENU PRINCIPAL =====
  mainMenu: `
Menu SEMSUR

1 - Registrar nova solicitacao
2 - Consultar protocolo existente
3 - Tipos de servicos atendidos
4 - Contatos e enderecos

Me diz qual opcao voce quer.
`.trim(),

  // ===== DEMANDA CRIADA =====
  demandCreated: `
Pronto! Sua solicitacao foi registrada.

Protocolo: {{protocol}}
Servico: {{category}}
Local: {{address}}
Data: {{createdAt}}

Prazo estimado: {{estimatedTime}}

Vou te avisando conforme o andamento, ta?

Pra consultar o status depois, e so mandar:
status {{protocol}}

Qualquer duvida, me chama ou liga no 0800-281-6400
`.trim(),

  // ===== DEMANDA ATUALIZADA =====
  demandUpdated: `
Atualizacao da sua solicitacao

Protocolo: {{protocol}}
Novo Status: {{status}}
Atualizado em: {{updatedAt}}

{{message}}
`.trim(),

  // ===== DEMANDA RESOLVIDA =====
  demandResolved: `
Boa noticia! Seu servico foi concluido.

Protocolo: {{protocol}}
Servico: {{category}}
Local: {{address}}
Resolvido em: {{resolvedAt}}

Muito obrigada por ter entrado em contato! Sua colaboracao ajuda demais a melhorar nossa cidade.

Se puder, avalia nosso atendimento:
{{feedbackUrl}}
`.trim(),

  // ===== SOLICITANDO DESCRIÇÃO =====
  requestDescription: `
Me conta mais sobre o problema

Quanto mais detalhes voce me passar, mais rapido a gente consegue resolver:

- O que ta acontecendo exatamente?
- Ha quanto tempo ta assim?
- Tem algum ponto de referencia perto?

Se tiver uma foto, pode mandar tambem que ajuda muito!
`.trim(),

  // ===== SOLICITANDO LOCALIZAÇÃO =====
  requestLocation: `
Onde fica o problema?

Pra eu encaminhar certinho, preciso saber o local.

Voce pode:
1 - Compartilhar sua localizacao atual pelo WhatsApp
2 - Digitar o endereco completo

Exemplo: Rua das Flores, 123 - Centro
`.trim(),

  // ===== SOLICITANDO FOTO =====
  requestPhoto: `
Quer mandar uma foto? (opcional)

Uma imagem ajuda nossa equipe a entender melhor o problema e agiliza o atendimento.

Pode enviar uma foto ou digitar "pular" pra continuar sem foto.
`.trim(),

  // ===== CONFIRMAÇÃO =====
  confirmDemand: `
Deixa eu confirmar os dados:

Tipo: {{category}}
Local: {{address}}
Descricao: {{description}}
Foto: {{hasPhoto}}

Ta tudo certo?

1 - Sim, confirmar
2 - Nao, preciso corrigir
`.trim(),

  // ===== CONSULTA DE STATUS =====
  statusResponse: `
Status da sua solicitacao

Protocolo: {{protocol}}
Categoria: {{category}}
Local: {{address}}
Status: {{status}}
Responsavel: {{secretaryName}}

Aberto em: {{createdAt}}
Ultima atualizacao: {{updatedAt}}

{{additionalInfo}}
`.trim(),

  // ===== PROTOCOLO NÃO ENCONTRADO =====
  protocolNotFound: `
Humm, nao encontrei esse protocolo

Confere se digitou certinho? As vezes escapa uma letra ou numero.

Exemplo: PNM-2024-00001

Se precisar de ajuda, digita "menu".
`.trim(),

  // ===== TIPOS DE PROBLEMAS =====
  problemTypes: `
Tipos de Problemas que a SEMSUR Atende

Infraestrutura:
- Buracos e pavimentacao
- Calcadas danificadas
- Drenagem e galerias

Iluminacao:
- Postes queimados
- Lampadas apagadas
- Fiacao exposta

Saneamento:
- Esgoto a ceu aberto
- Vazamentos
- Lixo e entulho

Transito:
- Semaforos
- Sinalizacao
- Faixas de pedestre

Outros:
- Pracas e parques
- Poda de arvores
- Limpeza publica

Me conta qual e o seu problema que eu te ajudo!
`.trim(),

  // ===== MENSAGEM DE ERRO =====
  errorMessage: `
Xiii, deu um probleminha aqui

Desculpa, nao consegui entender sua mensagem.
Tenta de novo ou digita "menu" pra ver as opcoes.

Se continuar dando erro, liga pra gente: 0800-281-6400
`.trim(),

  // ===== FORA DO HORÁRIO =====
  outOfHours: `
Atendimento Fora do Horario

Nosso time de atendimento funciona de segunda a sexta, das 8h as 17h.

Sua mensagem foi registrada e vou responder no proximo dia util.

Se for emergencia, liga pra:
- Defesa Civil: 199
- Policia: 190
- Bombeiros: 193
- SAMU: 192
`.trim(),

  // ===== CHAMADA REJEITADA =====
  callRejected: `
Chamada nao atendida

Desculpa, nao recebo chamadas de voz por aqui.

Me manda uma mensagem de texto ou audio que eu te ajudo!

Se preferir falar por telefone, liga pro 0800-281-6400
`.trim(),

  // ===== ENCERRAMENTO =====
  goodbye: `
Ate mais!

Foi um prazer te atender. Se precisar de mais alguma coisa, e so mandar mensagem.

SEMSUR - Prefeitura de Parnamirim
Trabalhando pela nossa cidade!
`.trim(),

  // ===== AGUARDANDO INFORMAÇÕES =====
  waitingInfo: `
Aguardando informacoes

Pra continuar com sua solicitacao, preciso que voce:

{{pendingAction}}

Se quiser cancelar, digita "cancelar".
`.trim(),

  // ===== TIMEOUT DE SESSÃO =====
  sessionTimeout: `
Sessao expirada

Sua sessao foi encerrada por inatividade.

Pra iniciar uma nova solicitacao, e so mandar uma mensagem.
`.trim(),
};

// ===== FUNÇÃO PARA PROCESSAR TEMPLATE =====
export function processTemplate(
  templateKey: keyof typeof MESSAGE_TEMPLATES,
  variables: TemplateVariables = {}
): string {
  let message = MESSAGE_TEMPLATES[templateKey];

  // Substituir variáveis
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    message = message.replace(regex, value || '');
  });

  // Remover variáveis não substituídas
  message = message.replace(/{{[^}]+}}/g, '');

  return message.trim();
}

// ===== STATUS TRADUZIDOS (sem emojis) =====
export const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Aberto',
  IN_PROGRESS: 'Em Andamento',
  WAITING_INFO: 'Aguardando Informacoes',
  FORWARDED: 'Encaminhado',
  RESOLVED: 'Resolvido',
  CLOSED: 'Fechado',
  CANCELLED: 'Cancelado',
};

// ===== PRIORIDADES TRADUZIDAS (sem emojis) =====
export const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Critica',
};
