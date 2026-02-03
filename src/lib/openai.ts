// OpenAI Integration Service
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Sistema de contexto com dados do município
export const getSystemContext = (systemData: SystemDataContext) => {
  return `Você é o Assistente de Decisão IA do Sistema de Gestão Urbana de Parnamirim-RN. 
Você é um especialista em gestão pública municipal, análise de dados urbanos e tomada de decisões estratégicas.

## Seu Papel:
- Auxiliar gestores municipais na análise de demandas e priorização de recursos
- Fornecer insights baseados em dados sobre a situação do município
- Sugerir ações estratégicas para resolução de problemas urbanos
- Analisar tendências e padrões nas demandas cidadãs
- Apoiar decisões em situações de crise

## Dados Atuais do Sistema (${new Date().toLocaleDateString('pt-BR')}):

### Resumo Geral:
- Total de Demandas: ${systemData.totalDemandas}
- Demandas Pendentes: ${systemData.demandasPendentes}
- Demandas em Andamento: ${systemData.demandasEmAndamento}
- Demandas Concluídas: ${systemData.demandasConcluidas}
- Taxa de Resolução: ${systemData.taxaResolucao}%
- Tempo Médio de Resolução: ${systemData.tempoMedioResolucao} dias

### Secretarias:
${systemData.secretarias.map(s => `- ${s.nome}: ${s.demandas} demandas (${s.pendentes} pendentes)`).join('\n')}

### Alertas Ativos:
${systemData.alertas.map(a => `- [${a.tipo}] ${a.descricao} - Bairro: ${a.bairro}`).join('\n') || 'Nenhum alerta ativo'}

### Bairros com Maior Demanda:
${systemData.bairrosMaisDemandas.map(b => `- ${b.nome}: ${b.demandas} demandas`).join('\n')}

### Categorias Mais Frequentes:
${systemData.categoriasMaisFrequentes.map(c => `- ${c.nome}: ${c.quantidade} ocorrências`).join('\n')}

### Crises Ativas:
${systemData.crisesAtivas.map(c => `- ${c.titulo} (${c.nivel}): ${c.status}`).join('\n') || 'Nenhuma crise ativa'}

## Diretrizes:
1. Sempre baseie suas respostas nos dados disponíveis do sistema
2. Seja objetivo e forneça recomendações acionáveis
3. Priorize a segurança e bem-estar dos cidadãos
4. Considere impacto orçamentário nas sugestões
5. Sugira métricas de acompanhamento quando apropriado
6. Use linguagem clara e profissional
7. Quando não tiver dados suficientes, indique claramente

Responda sempre em português brasileiro.`;
};

export interface SystemDataContext {
  totalDemandas: number;
  demandasPendentes: number;
  demandasEmAndamento: number;
  demandasConcluidas: number;
  taxaResolucao: number;
  tempoMedioResolucao: number;
  secretarias: { nome: string; demandas: number; pendentes: number }[];
  alertas: { tipo: string; descricao: string; bairro: string }[];
  bairrosMaisDemandas: { nome: string; demandas: number }[];
  categoriasMaisFrequentes: { nome: string; quantidade: number }[];
  crisesAtivas: { titulo: string; nivel: string; status: string }[];
}

export async function sendChatMessage(
  messages: ChatMessage[],
  systemData: SystemDataContext
): Promise<string> {
  const systemMessage: ChatMessage = {
    role: 'system',
    content: getSystemContext(systemData)
  };

  const allMessages = [systemMessage, ...messages];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: allMessages,
        temperature: 0.7,
        max_tokens: 2000,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Erro na API OpenAI');
    }

    const data: OpenAIResponse = await response.json();
    return data.choices[0]?.message?.content || 'Desculpe, não consegui processar sua solicitação.';
  } catch (error) {
    console.error('Erro ao chamar OpenAI:', error);
    throw error;
  }
}

// Função para análise rápida de demandas
export async function analyzeQuickAction(
  action: string,
  systemData: SystemDataContext
): Promise<string> {
  const actionPrompts: Record<string, string> = {
    'prioridades': 'Analise as demandas atuais e liste as 5 principais prioridades que devem ser tratadas imediatamente, considerando urgência, impacto e recursos disponíveis.',
    'recursos': 'Faça uma análise da alocação atual de recursos entre as secretarias e sugira otimizações baseadas na carga de demandas.',
    'tendencias': 'Identifique as principais tendências nas demandas dos últimos dados disponíveis e projete possíveis cenários futuros.',
    'riscos': 'Avalie os principais riscos e vulnerabilidades atuais do município baseado nos dados de alertas e demandas pendentes.',
    'eficiencia': 'Analise a eficiência operacional das secretarias e sugira melhorias nos processos de atendimento.',
    'cidadao': 'Avalie a satisfação cidadã baseada nos dados de resolução e sugira ações para melhorar o atendimento.'
  };

  const prompt = actionPrompts[action] || action;
  
  return sendChatMessage([{ role: 'user', content: prompt }], systemData);
}

// Função para gerar relatório executivo
export async function generateExecutiveReport(
  systemData: SystemDataContext
): Promise<string> {
  const prompt = `Gere um relatório executivo completo da situação atual do município, incluindo:
1. Resumo Executivo
2. Principais Indicadores
3. Pontos de Atenção
4. Recomendações Estratégicas
5. Próximos Passos Sugeridos

Formate o relatório de forma clara e profissional.`;

  return sendChatMessage([{ role: 'user', content: prompt }], systemData);
}
