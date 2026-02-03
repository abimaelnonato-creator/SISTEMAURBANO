import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/database/prisma.service';

interface ClassificationResult {
  category: string;
  categoryId?: string;
  secretaryId?: string;
  confidence: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  suggestedTitle: string;
  keywords: string[];
}

interface LocationExtraction {
  address?: string;
  neighborhood?: string;
  landmarks?: string[];
  hasLocation: boolean;
}

interface ImageAnalysis {
  description: string;
  problemType?: string;
  severity?: string;
  confidence: number;
}

interface GeminiResponse {
  candidates: {
    content: {
      parts: { text: string }[];
      role: string;
    };
    finishReason: string;
  }[];
}

@Injectable()
export class AIClassificationService {
  private readonly logger = new Logger(AIClassificationService.name);
  private readonly geminiApiKey: string | undefined;
  private readonly geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.geminiApiKey = this.configService.get('GEMINI_API_KEY');
    if (!this.geminiApiKey) {
      this.logger.warn('Gemini API key not configured. AI features will use fallback methods.');
    } else {
      this.logger.log('Gemini AI initialized successfully');
    }
  }

  /**
   * Chamar API Gemini
   */
  private async callGemini(prompt: string, jsonMode = true): Promise<string> {
    if (!this.geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const response = await fetch(`${this.geminiApiUrl}?key=${this.geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: jsonMode ? 0.3 : 0.7,
          maxOutputTokens: 1000,
          topP: 0.9,
          topK: 40,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Erro na API Gemini');
    }

    const data: GeminiResponse = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  /**
   * Classificar texto de demanda
   */
  async classifyText(text: string): Promise<ClassificationResult> {
    // Buscar categorias existentes para contexto
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      include: { secretary: true },
    });

    // Se não tiver Gemini configurada, usar fallback
    if (!this.geminiApiKey) {
      return this.fallbackClassification(text, categories);
    }

    const categoryList = categories
      .map((c) => `- ${c.name} (${c.secretary.name}): ${c.keywords.join(', ')}`)
      .join('\n');

    const prompt = `Você é um assistente de classificação de demandas urbanas para a SEMSUR - Secretaria Municipal de Serviços Urbanos de Parnamirim/RN.

A SEMSUR é responsável por:
- 💡 Iluminação Pública (LED, postes, fiação)
- 🧹 Limpeza Urbana (coleta de lixo, varrição, entulho)
- 🌳 Praças e Jardins (manutenção, poda de árvores, capinação)
- 🏪 Mercados e Cemitérios (manutenção)
- 🌊 Drenagem (bueiros, alagamentos, galerias)
- 🛠️ Infraestrutura (calçadas, buracos)

Analise a seguinte mensagem de um cidadão e classifique-a.

CATEGORIAS DISPONÍVEIS:
${categoryList}

MENSAGEM DO CIDADÃO:
"${text}"

Responda APENAS com um JSON válido no seguinte formato (sem markdown, sem code blocks):
{
  "category": "Nome da categoria mais apropriada",
  "confidence": 0.0 a 1.0,
  "priority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "suggestedTitle": "Título curto descritivo",
  "keywords": ["palavra1", "palavra2"],
  "reasoning": "Breve explicação da classificação"
}

Critérios de prioridade:
- CRITICAL: Risco iminente à vida (poste caindo, fiação exposta, alagamento grave)
- HIGH: Problema grave (vários postes apagados, lixo acumulado há dias)
- MEDIUM: Problema comum que precisa de atenção
- LOW: Problema menor ou sugestão`;

    try {
      const responseText = await this.callGemini(prompt, true);
      
      // Extrair JSON da resposta (pode vir com markdown)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON não encontrado na resposta');
      }
      
      const result = JSON.parse(jsonMatch[0]);

      // Encontrar categoria no banco
      const matchedCategory = categories.find(
        (c) => c.name.toLowerCase() === result.category?.toLowerCase()
      );

      return {
        category: result.category || 'Outros',
        categoryId: matchedCategory?.id,
        secretaryId: matchedCategory?.secretaryId,
        confidence: result.confidence || 0.5,
        priority: result.priority || 'MEDIUM',
        suggestedTitle: result.suggestedTitle || text.substring(0, 50),
        keywords: result.keywords || [],
      };
    } catch (error) {
      this.logger.error(`Erro na classificação: ${(error as Error).message}`);
      
      // Fallback: classificação básica por keywords
      return this.fallbackClassification(text, categories);
    }
  }

  /**
   * Extrair localização do texto
   */
  async extractLocation(text: string): Promise<LocationExtraction> {
    if (!this.geminiApiKey) {
      return this.fallbackLocationExtraction(text);
    }

    const prompt = `Analise o texto a seguir e extraia informações de localização em Parnamirim/RN.

TEXTO:
"${text}"

Responda APENAS com um JSON válido (sem markdown, sem code blocks):
{
  "address": "endereço completo se mencionado ou null",
  "neighborhood": "bairro se mencionado ou null",
  "landmarks": ["pontos de referência mencionados"],
  "hasLocation": true/false
}`;

    try {
      const responseText = await this.callGemini(prompt, true);
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return this.fallbackLocationExtraction(text);
      }
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      this.logger.error(`Erro na extração de localização: ${(error as Error).message}`);
      return this.fallbackLocationExtraction(text);
    }
  }

  /**
   * Analisar imagem (usando Gemini Vision)
   */
  async analyzeImage(imageUrl: string): Promise<ImageAnalysis> {
    if (!this.geminiApiKey) {
      return {
        description: 'Análise de imagem não disponível - Gemini não configurada',
        confidence: 0,
      };
    }

    try {
      // Gemini Vision API
      const visionUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
      
      const response = await fetch(`${visionUrl}?key=${this.geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Analise esta imagem de um problema urbano em Parnamirim/RN.

Responda APENAS com um JSON válido (sem markdown):
{
  "description": "descrição detalhada do problema visto na imagem",
  "problemType": "tipo do problema (buraco, poste queimado, esgoto, lixo, etc)",
  "severity": "LOW, MEDIUM, HIGH ou CRITICAL",
  "confidence": 0.0 a 1.0
}`,
                },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: imageUrl.startsWith('data:') 
                      ? imageUrl.split(',')[1] 
                      : imageUrl,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Erro na API Gemini Vision');
      }

      const data: GeminiResponse = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { description: content, confidence: 0.5 };
    } catch (error) {
      this.logger.error(`Erro na análise de imagem: ${(error as Error).message}`);
      return {
        description: 'Não foi possível analisar a imagem',
        confidence: 0,
      };
    }
  }

  /**
   * Sugerir resposta automática
   */
  async suggestResponse(demand: any): Promise<string> {
    if (!this.geminiApiKey) {
      return this.getDefaultResponse(demand);
    }

    const prompt = `Gere uma resposta cordial e profissional para o cidadão sobre sua demanda:

Protocolo: ${demand.protocol}
Categoria: ${demand.category?.name}
Descrição: ${demand.description}
Status: ${demand.status}

A resposta deve:
- Ser breve e objetiva
- Confirmar o recebimento
- Informar próximos passos
- Ser em português brasileiro formal

Responda apenas com o texto da mensagem, sem aspas.`;

    try {
      const response = await this.callGemini(prompt, false);
      return response || this.getDefaultResponse(demand);
    } catch (error) {
      return this.getDefaultResponse(demand);
    }
  }

  /**
   * Classificação de fallback por keywords
   */
  private fallbackClassification(text: string, categories: any[]): ClassificationResult {
    const normalizedText = text.toLowerCase();

    // Keywords padrão para priorização
    const criticalKeywords = ['urgente', 'emergência', 'perigo', 'risco', 'caindo', 'desabando', 'fogo', 'incêndio'];
    const highKeywords = ['grave', 'perigoso', 'muito', 'vários', 'dias', 'semanas'];

    let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM';
    if (criticalKeywords.some(kw => normalizedText.includes(kw))) {
      priority = 'CRITICAL';
    } else if (highKeywords.some(kw => normalizedText.includes(kw))) {
      priority = 'HIGH';
    }

    for (const category of categories) {
      const keywords = category.keywords || [];
      const matchedKeywords = keywords.filter((kw: string) => 
        normalizedText.includes(kw.toLowerCase())
      );

      if (matchedKeywords.length > 0) {
        return {
          category: category.name,
          categoryId: category.id,
          secretaryId: category.secretaryId,
          confidence: Math.min(matchedKeywords.length * 0.3, 0.9),
          priority: category.priority || priority,
          suggestedTitle: text.substring(0, 50),
          keywords: matchedKeywords,
        };
      }
    }

    // Nenhuma categoria encontrada
    return {
      category: 'Outros',
      confidence: 0.3,
      priority,
      suggestedTitle: text.substring(0, 50),
      keywords: [],
    };
  }

  /**
   * Extração de localização por fallback (regex)
   */
  private fallbackLocationExtraction(text: string): LocationExtraction {
    const bairros = [
      'centro', 'nova parnamirim', 'rosa dos ventos', 'emaús', 'pium',
      'parque industrial', 'cohabinal', 'passagem de areia', 'pirangi',
      'liberdade', 'monte castelo', 'boa esperança', 'parque das nações'
    ];

    const normalizedText = text.toLowerCase();
    const foundNeighborhood = bairros.find(b => normalizedText.includes(b));
    
    // Tentar extrair endereço com regex
    const ruaMatch = text.match(/(?:rua|av\.?|avenida|travessa)\s+[\w\s]+,?\s*(?:n[°º]?\s*\d+)?/i);

    return {
      address: ruaMatch ? ruaMatch[0] : undefined,
      neighborhood: foundNeighborhood,
      landmarks: [],
      hasLocation: !!(foundNeighborhood || ruaMatch),
    };
  }

  /**
   * Resposta padrão quando IA não está disponível
   */
  private getDefaultResponse(demand: any): string {
    const statusMessages: Record<string, string> = {
      PENDING: 'Sua demanda foi recebida e está aguardando análise.',
      ASSIGNED: 'Sua demanda foi encaminhada para o setor responsável.',
      IN_PROGRESS: 'Sua demanda está sendo tratada por nossa equipe.',
      RESOLVED: 'Sua demanda foi resolvida. Agradecemos seu contato!',
      CANCELLED: 'Sua demanda foi cancelada.',
      REJECTED: 'Infelizmente, sua demanda não pôde ser atendida.',
    };

    return `Olá! Recebemos sua demanda com o protocolo ${demand.protocol}. ${statusMessages[demand.status] || 'Estamos trabalhando nisso.'} 

📞 Para mais informações:
• Call Center Iluminação: 0800-281-6400
• Protocolo: (84) 3644-8421

SEMSUR - Secretaria Municipal de Serviços Urbanos
Parnamirim/RN`;
  }
}
