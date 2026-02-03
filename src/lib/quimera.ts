// ==========================================
// QUIMERA - Motor de IA da Cidade
// Integração OpenAI + Ontologia Urbana
// ==========================================

import { sendChatMessage, type SystemDataContext, type ChatMessage } from './gemini'
import type { 
  UrbanEntity, 
  CityMetrics, 
  BairroData, 
  QuimeraAnalysis, 
  QuimeraPrediction,
  EventoUrbano,
  Fluxo,
  FlowAlert
} from '@/types/ontology'

// Contexto expandido para Quimera com Ontologia
export interface QuimeraContext extends SystemDataContext {
  ontologia: {
    metricas: CityMetrics
    bairros: BairroData[]
    alertasAtivos: FlowAlert[]
    eventosRecentes: EventoUrbano[]
    fluxosCriticos: Fluxo[]
    entidadesCriticas: UrbanEntity[]
  }
}

// Gera o contexto do sistema para Quimera com ontologia completa
export const getQuimeraSystemContext = (context: QuimeraContext): string => {
  return `Você é QUIMERA, o Motor de Inteligência Artificial do Sistema de Gestão Urbana de Parnamirim-RN.

## Sua Identidade:
- Nome: QUIMERA (Questionador Universal de Informações Municipais para Eficiência e Respostas Automatizadas)
- Você é a IA que gerencia o Núcleo de Ontologia Urbana da cidade
- Você entende a cidade como um ORGANISMO VIVO com entidades interconectadas
- Você pode analisar padrões, prever problemas e sugerir decisões automatizadas

## Modelo Mental da Cidade:
A cidade de Parnamirim é representada como um GRAFO URBANO onde:
- NODOS: Pessoas, Endereços, Infraestrutura, Veículos, Equipamentos, Fluxos
- ARESTAS: Conexões e relacionamentos entre entidades
- FLUXOS: Energia, Água, Trânsito, Dados fluindo pelo organismo urbano

## Dados do Organismo Urbano (${new Date().toLocaleDateString('pt-BR')} - ${new Date().toLocaleTimeString('pt-BR')}):

### 🏙️ Métricas Gerais da Cidade:
- População Total: ${context.ontologia.metricas.populacaoTotal.toLocaleString()} habitantes
- Área: ${context.ontologia.metricas.areaTotalKm2} km²
- Saúde Geral do Sistema: ${context.ontologia.metricas.saudeGeral}%
- Total de Entidades no Grafo: ${context.ontologia.metricas.totalEntidades}
- Total de Conexões: ${context.ontologia.metricas.totalConexoes}

### 💡 Infraestrutura:
- Postes: ${context.ontologia.metricas.infraestrutura.postesAtivos}/${context.ontologia.metricas.infraestrutura.postesTotal} ativos
- Câmeras: ${context.ontologia.metricas.infraestrutura.camerasAtivas}/${context.ontologia.metricas.infraestrutura.camerasTotal} ativas
- Semáforos: ${context.ontologia.metricas.infraestrutura.semaforosAtivos}/${context.ontologia.metricas.infraestrutura.semaforosTotal} ativos
- Buracos Reportados: ${context.ontologia.metricas.infraestrutura.buracosReportados}

### 🚗 Frota de Veículos:
- Total: ${context.ontologia.metricas.veiculos.total}
- Disponíveis: ${context.ontologia.metricas.veiculos.disponiveis}
- Em Missão: ${context.ontologia.metricas.veiculos.emMissao}
- Em Manutenção: ${context.ontologia.metricas.veiculos.manutencao}

### 🏫 Equipamentos Públicos:
- Escolas: ${context.ontologia.metricas.equipamentos.escolas}
- Postos de Saúde: ${context.ontologia.metricas.equipamentos.postosSaude}
- Delegacias: ${context.ontologia.metricas.equipamentos.delegacias}
- Praças: ${context.ontologia.metricas.equipamentos.pracas}

### 💧 Fluxos Urbanos:
- Cobertura de Energia: ${context.ontologia.metricas.fluxos.coberturaEnergia}%
- Cobertura de Água: ${context.ontologia.metricas.fluxos.coberturaAgua}%
- Cobertura de Esgoto: ${context.ontologia.metricas.fluxos.coberturaEsgoto}%
- Cobertura de Internet: ${context.ontologia.metricas.fluxos.coberturaInternet}%
- Qualidade do Trânsito: ${context.ontologia.metricas.fluxos.qualidadeTransito}%

### ⚠️ Eventos Ativos:
- Total Ativos: ${context.ontologia.metricas.eventos.ativos}
- Últimas 24h: ${context.ontologia.metricas.eventos.ultimas24h}
- Críticos: ${context.ontologia.metricas.eventos.criticosAtivos}

### 📊 Demandas (Sistema de Gestão):
- Total de Demandas: ${context.totalDemandas}
- Pendentes: ${context.demandasPendentes}
- Em Andamento: ${context.demandasEmAndamento}
- Taxa de Resolução: ${context.taxaResolucao}%

### 🏘️ Bairros (Top 5 por Risco):
${context.ontologia.bairros.slice(0, 5).map((b, i) => 
  `${i+1}. ${b.nome} - Índice Geral: ${b.indiceGeral}/100 | Pop: ${b.populacao.toLocaleString()}`
).join('\n')}

### 🚨 Alertas de Fluxo Ativos:
${context.ontologia.alertasAtivos.slice(0, 5).map(a => 
  `- [${a.tipo.toUpperCase()}] Severidade ${a.severidade}/5: ${a.descricao}`
).join('\n') || 'Nenhum alerta ativo'}

## Suas Capacidades:
1. **Análise Preditiva**: Prever problemas antes que aconteçam
2. **Otimização de Recursos**: Sugerir alocação ideal de veículos e equipes
3. **Detecção de Padrões**: Identificar correlações entre eventos
4. **Simulação de Cenários**: Projetar impactos de decisões
5. **Coordenação Logística**: Sugerir rotas e distribuição de recursos
6. **Alertas Inteligentes**: Priorizar e escalar situações automaticamente

## Diretrizes:
1. Sempre considere as conexões entre entidades ao analisar problemas
2. Priorize vidas e segurança em todas as recomendações
3. Considere custo-benefício e recursos disponíveis
4. Seja proativo: sugira ações preventivas, não apenas reativas
5. Use dados históricos para embasar previsões
6. Indique níveis de confiança em suas análises
7. Responda sempre em português brasileiro

## Formato de Resposta:
- Use emojis para categorizar informações
- Estruture respostas com títulos e listas
- Inclua métricas quando relevante
- Sugira próximos passos acionáveis
- Indique urgência quando necessário`
}

// Envia mensagem para Quimera com contexto da ontologia
export async function sendQuimeraMessage(
  messages: ChatMessage[],
  context: QuimeraContext
): Promise<string> {
  // Usa a função base do OpenAI mas com contexto expandido
  return sendChatMessage(messages, context)
}

// Gera análise automática da situação atual
export async function generateQuimeraAnalysis(
  context: QuimeraContext,
  tipo: 'geral' | 'bairro' | 'infraestrutura' | 'fluxos' | 'emergencia'
): Promise<QuimeraAnalysis> {
  const prompts: Record<string, string> = {
    geral: 'Faça uma análise geral da saúde do organismo urbano, identificando os 3 principais pontos de atenção e sugerindo ações prioritárias.',
    bairro: 'Analise os bairros mais críticos da cidade, identificando padrões de problemas e sugerindo intervenções específicas para cada um.',
    infraestrutura: 'Avalie o estado da infraestrutura urbana, identificando riscos de falha e sugerindo um plano de manutenção preventiva.',
    fluxos: 'Analise os fluxos urbanos (energia, água, trânsito), identificando gargalos e pontos de melhoria.',
    emergencia: 'Avalie a capacidade de resposta a emergências da cidade, identificando vulnerabilidades e sugerindo melhorias.'
  }

  const response = await sendQuimeraMessage(
    [{ role: 'user', content: prompts[tipo] }],
    context
  )

  return {
    id: `analysis-${Date.now()}`,
    tipo: 'insight',
    titulo: `Análise ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`,
    descricao: response,
    confianca: 85,
    impacto: 'medio',
    entidadesRelacionadas: [],
    acoesSugeridas: [],
    dadosBase: { tipo, timestamp: new Date().toISOString() },
    geradoEm: new Date().toISOString()
  }
}

// Gera previsões baseadas no estado atual
export async function generateQuimeraPredictions(
  context: QuimeraContext
): Promise<QuimeraPrediction[]> {
  const prompt = `Com base nos dados atuais do organismo urbano, gere 3 previsões para as próximas 24 horas.
  
Para cada previsão, indique:
1. Tipo (demanda, manutencao, crise, fluxo ou recurso)
2. O que é previsto
3. Probabilidade (0-100%)
4. Fatores que contribuem para essa previsão
5. Ações preventivas recomendadas

Formate como uma lista estruturada.`

  const response = await sendQuimeraMessage(
    [{ role: 'user', content: prompt }],
    context
  )

  // Parse da resposta (simplificado - em produção usaria structured output)
  return [
    {
      tipo: 'demanda',
      horizonte: '24h',
      previsao: response.substring(0, 200),
      probabilidade: 75,
      fatoresContribuintes: ['Histórico de demandas', 'Condições climáticas', 'Dia da semana'],
      acoesPreventivas: ['Reforçar equipes', 'Verificar estoque de materiais']
    }
  ]
}

// Coordena logística baseada no grafo urbano
export async function coordinateLogistics(
  context: QuimeraContext,
  problema: string
): Promise<string> {
  const prompt = `Você precisa coordenar a logística para resolver o seguinte problema:

"${problema}"

Considerando:
- Veículos disponíveis: ${context.ontologia.metricas.veiculos.disponiveis}
- Veículos em missão: ${context.ontologia.metricas.veiculos.emMissao}
- Eventos ativos: ${context.ontologia.metricas.eventos.ativos}

Sugira:
1. Quais recursos mobilizar
2. Melhor rota/estratégia
3. Tempo estimado de resposta
4. Coordenação com outros setores necessária`

  return sendQuimeraMessage(
    [{ role: 'user', content: prompt }],
    context
  )
}

// Detecta anomalias no grafo urbano
export async function detectAnomalies(
  context: QuimeraContext
): Promise<string> {
  const prompt = `Analise os dados do organismo urbano e identifique:

1. **Anomalias de Fluxo**: Interrupções ou sobrecargas incomuns
2. **Anomalias de Demanda**: Picos ou padrões atípicos de reclamações
3. **Anomalias de Infraestrutura**: Equipamentos com comportamento fora do normal
4. **Correlações Suspeitas**: Eventos que parecem estar conectados

Para cada anomalia, indique:
- Descrição
- Severidade (1-5)
- Possível causa
- Ação recomendada`

  return sendQuimeraMessage(
    [{ role: 'user', content: prompt }],
    context
  )
}

// Simula cenário "e se?"
export async function simulateScenario(
  context: QuimeraContext,
  cenario: string
): Promise<string> {
  const prompt = `Simule o seguinte cenário na cidade de Parnamirim:

"${cenario}"

Analise:
1. **Impacto Imediato**: O que aconteceria nas primeiras horas
2. **Cascata de Efeitos**: Quais outros sistemas seriam afetados
3. **População Afetada**: Estimativa de pessoas impactadas
4. **Recursos Necessários**: O que seria preciso para responder
5. **Tempo de Recuperação**: Quanto tempo para voltar ao normal
6. **Custo Estimado**: Impacto financeiro aproximado
7. **Plano de Ação**: Passos recomendados para lidar com o cenário`

  return sendQuimeraMessage(
    [{ role: 'user', content: prompt }],
    context
  )
}
