import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface GeminiResponse {
  text: string;
  confidence?: number;
  demandInfo?: {
    categoria?: string;
    descricao?: string;
    endereco?: string;
    urgente?: boolean;
  };
}

interface MediaAnalysis {
  tipo: 'imagem' | 'audio' | 'video';
  descricao: string;
  demandaDetectada: boolean;
  categoria?: string;
  endereco?: string;
  urgencia?: 'baixa' | 'media' | 'alta' | 'critica';
  transcricao?: string; // Para áudios
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger('🤖 GeminiAI');
  private readonly apiKey: string;
  private readonly modelId: string = 'gemini-2.0-flash'; // Modelo multimodal atualizado
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get<string>('GEMINI_API_KEY') || '';
    if (this.apiKey) {
      this.logger.log('✅ Gemini 2.0 Flash inicializado - Suporte a texto, áudio, imagem e vídeo');
    } else {
      this.logger.warn('⚠️ GEMINI_API_KEY não configurada');
    }
  }

  /**
   * Analisa texto e extrai informações de demanda
   */
  async analisarTexto(texto: string, contexto?: string): Promise<GeminiResponse> {
    const prompt = `Você é a Luma, assistente da SEMSUR de Parnamirim/RN. Converse de forma natural e humana.

CONTEXTO: ${contexto || 'Cidadão entrando em contato'}

MENSAGEM: "${texto}"

REGRAS DE COMPORTAMENTO IMPORTANTES:
- NUNCA use emojis
- Converse de forma natural, como uma pessoa de verdade
- Use linguagem informal mas educada
- Vá com calma, não finalize rápido demais
- Use expressões como "beleza", "entendi", "certo", "pode ser"
- Se for nordestino pode usar "visse", "oxente" naturalmente
- NUNCA repita a mesma resposta - sempre varie as palavras
- Se já sabe algo, NÃO pergunte de novo
- Seja concisa, não enrole

PARA REGISTRAR UMA DEMANDA, PRECISA TER OBRIGATORIAMENTE:
1. Descrição do problema (o que está acontecendo)
2. Endereço/localização (onde fica)
3. Foto do problema (ainda vai pedir se não tiver)

SE FALTAR ALGUMA INFORMAÇÃO:
- Pergunte de forma natural, uma coisa de cada vez
- Não liste tudo que falta, pergunte aos poucos
- Seja paciente e acolhedor
- NÃO repita perguntas que já fez antes

ANTI-LOOP: Nunca responda exatamente igual a mensagens anteriores do contexto.

Responda em JSON:
{
  "ehDemanda": true/false,
  "categoria": "ILUMINACAO/PAVIMENTACAO/LIMPEZA/PODA/DRENAGEM/CALCADA/SINALIZACAO/OUTROS",
  "descricao": "Descrição do problema ou null",
  "endereco": "Endereço se mencionado ou null",
  "bairro": "Bairro se mencionado ou null",
  "urgencia": "baixa/media/alta/critica",
  "resposta": "Resposta natural e humanizada SEM emojis - NUNCA igual a respostas anteriores"
}`;

    try {
      const response = await this.chamarGemini(prompt);
      return this.parseGeminiResponse(response);
    } catch (error) {
      this.logger.error(`Erro ao analisar texto: ${error}`);
      return {
        text: 'Entendi sua mensagem! Me conta mais detalhes sobre o problema pra eu poder te ajudar melhor.',
      };
    }
  }

  /**
   * Analisa imagem enviada pelo cidadão
   */
  async analisarImagem(imageBase64: string, mimeType: string, legendaOpcional?: string): Promise<MediaAnalysis> {
    this.logger.log('🖼️ Analisando imagem enviada...');

    const prompt = `Você é a Luma, assistente virtual da SEMSUR (Secretaria de Serviços Urbanos) de Parnamirim/RN.

${legendaOpcional ? `LEGENDA ENVIADA: "${legendaOpcional}"` : ''}

TAREFA: Analise esta imagem e identifique:
1. O que mostra a imagem (descreva detalhadamente)
2. Se é um problema de serviço urbano que a SEMSUR pode resolver
3. Categoria do problema: ILUMINACAO, PAVIMENTACAO, LIMPEZA, PODA, DRENAGEM, CALCADA, SINALIZACAO, ENTULHO, OUTROS
4. Urgência do problema (baixa, media, alta, critica)
5. Se há alguma referência de localização visível

PROBLEMAS QUE ATENDEMOS:
- Buracos em ruas/calçadas
- Postes/lâmpadas apagadas
- Lixo/entulho acumulado
- Árvores precisando de poda
- Bueiros entupidos
- Sinalização danificada
- Praças/áreas verdes abandonadas

Responda APENAS em JSON:
{
  "descricao": "Descrição detalhada do que a imagem mostra",
  "ehDemanda": true/false,
  "categoria": "CATEGORIA",
  "urgencia": "baixa/media/alta/critica",
  "enderecoVisivel": "Endereço se visível ou null",
  "resposta": "Resposta humanizada para o cidadão (sem emojis)"
}`;

    try {
      const response = await this.chamarGeminiComImagem(prompt, imageBase64, mimeType);
      const parsed = this.parseJson(response);
      
      return {
        tipo: 'imagem',
        descricao: parsed.descricao || 'Imagem analisada',
        demandaDetectada: parsed.ehDemanda || false,
        categoria: parsed.categoria,
        endereco: parsed.enderecoVisivel,
        urgencia: parsed.urgencia || 'media',
      };
    } catch (error) {
      this.logger.error(`Erro ao analisar imagem: ${error}`);
      return {
        tipo: 'imagem',
        descricao: 'Não foi possível analisar a imagem',
        demandaDetectada: false,
      };
    }
  }

  /**
   * Transcreve e analisa áudio enviado pelo cidadão
   */
  async analisarAudio(audioBase64: string, mimeType: string): Promise<MediaAnalysis> {
    this.logger.log('🎙️ Transcrevendo e analisando áudio...');

    const prompt = `Você é a Luma, assistente virtual da SEMSUR (Secretaria de Serviços Urbanos) de Parnamirim/RN.

TAREFA: Transcreva este áudio e analise o conteúdo.

IMPORTANTE:
- Transcreva EXATAMENTE o que a pessoa disse, incluindo sotaques regionais do Nordeste
- Identifique se é uma demanda de serviço urbano
- Seja tolerante com gírias e expressões regionais (oxe, visse, arretado, etc.)

Responda APENAS em JSON:
{
  "transcricao": "Transcrição exata do áudio",
  "ehDemanda": true/false,
  "categoria": "ILUMINACAO/PAVIMENTACAO/LIMPEZA/PODA/DRENAGEM/CALCADA/SINALIZACAO/OUTROS",
  "descricao": "Descrição do problema mencionado",
  "endereco": "Endereço se mencionado ou null",
  "urgencia": "baixa/media/alta/critica",
  "resposta": "Resposta humanizada para o cidadão (sem emojis)"
}`;

    try {
      const response = await this.chamarGeminiComAudio(prompt, audioBase64, mimeType);
      const parsed = this.parseJson(response);
      
      this.logger.log(`📝 Transcrição: "${parsed.transcricao}"`);
      
      return {
        tipo: 'audio',
        descricao: parsed.descricao || parsed.transcricao,
        demandaDetectada: parsed.ehDemanda || false,
        categoria: parsed.categoria,
        endereco: parsed.endereco,
        urgencia: parsed.urgencia || 'media',
        transcricao: parsed.transcricao,
      };
    } catch (error) {
      this.logger.error(`Erro ao analisar áudio: ${error}`);
      return {
        tipo: 'audio',
        descricao: 'Não foi possível transcrever o áudio',
        demandaDetectada: false,
      };
    }
  }

  /**
   * Analisa vídeo enviado pelo cidadão
   */
  async analisarVideo(videoBase64: string, mimeType: string): Promise<MediaAnalysis> {
    this.logger.log('🎬 Analisando vídeo enviado...');

    const prompt = `Você é a Luma, assistente virtual da SEMSUR (Secretaria de Serviços Urbanos) de Parnamirim/RN.

TAREFA: Analise este vídeo e identifique:
1. O que mostra o vídeo (descreva o problema mostrado)
2. Transcreva qualquer fala presente no vídeo
3. Se é um problema de serviço urbano
4. Categoria e urgência do problema

PROBLEMAS QUE ATENDEMOS:
- Buracos, iluminação, limpeza, poda, drenagem, calçadas, sinalização

Responda APENAS em JSON:
{
  "descricao": "Descrição detalhada do que o vídeo mostra",
  "transcricaoAudio": "Transcrição de falas no vídeo ou null",
  "ehDemanda": true/false,
  "categoria": "CATEGORIA",
  "urgencia": "baixa/media/alta/critica",
  "endereco": "Endereço se visível/mencionado ou null",
  "resposta": "Resposta humanizada para o cidadão (sem emojis)"
}`;

    try {
      const response = await this.chamarGeminiComVideo(prompt, videoBase64, mimeType);
      const parsed = this.parseJson(response);
      
      return {
        tipo: 'video',
        descricao: parsed.descricao || 'Vídeo analisado',
        demandaDetectada: parsed.ehDemanda || false,
        categoria: parsed.categoria,
        endereco: parsed.endereco,
        urgencia: parsed.urgencia || 'media',
        transcricao: parsed.transcricaoAudio,
      };
    } catch (error) {
      this.logger.error(`Erro ao analisar vídeo: ${error}`);
      return {
        tipo: 'video',
        descricao: 'Não foi possível analisar o vídeo',
        demandaDetectada: false,
      };
    }
  }

  /**
   * Gera resposta humanizada para o cidadão
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async gerarResposta(contexto: string, demandaInfo?: any): Promise<string> {
    const prompt = `Você é a Luma, assistente virtual simpática da SEMSUR de Parnamirim/RN.

CONTEXTO: ${contexto}
${demandaInfo ? `INFORMAÇÕES DA DEMANDA: ${JSON.stringify(demandaInfo)}` : ''}

REGRAS IMPORTANTES:
- NÃO use emojis nunca
- Use linguagem informal mas respeitosa
- Seja empática e acolhedora
- Seja breve e direta (máximo 2 frases)
- Use expressões naturais como "beleza", "entendi", "certo"
- Se for nordestino, pode usar "visse", "oxente" de forma natural
- NUNCA repita frases que já usou antes
- Varie as palavras a cada resposta

ANTI-REPETIÇÃO: Se for pedir foto, use frases diferentes como:
- "Pode me mandar uma foto?"
- "Tem como me mostrar uma imagem?"
- "Consegue tirar uma foto pra eu ver?"
- "Me manda uma foto do local?"

Se for pedir endereço, varie também:
- "Onde fica isso?"
- "Qual o endereço?"
- "Pode me passar a localização?"
- "Em que rua/bairro é?"

Gere uma resposta curta e humanizada:`;

    try {
      const response = await this.chamarGemini(prompt);
      // Remove qualquer emoji que possa ter escapado
      return response.replace(/[\u{1F600}-\u{1F6FF}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}]/gu, '');
    } catch {
      return 'Entendi! Vou registrar sua solicitação.';
    }
  }

  // ============ MÉTODOS PRIVADOS ============

  private async chamarGemini(prompt: string): Promise<string> {
    const url = `${this.baseUrl}/models/${this.modelId}:generateContent?key=${this.apiKey}`;
    
    this.logger.debug(`🔄 Chamando Gemini API...`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      this.logger.error(`❌ Erro da API Gemini: ${JSON.stringify(data.error)}`);
      throw new Error(data.error.message || 'Erro na API Gemini');
    }
    
    const resultado = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    this.logger.debug(`📩 Gemini retornou ${resultado.length} caracteres`);
    
    return resultado;
  }

  private async chamarGeminiComImagem(prompt: string, imageBase64: string, mimeType: string): Promise<string> {
    const url = `${this.baseUrl}/models/${this.modelId}:generateContent?key=${this.apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: imageBase64 } },
          ],
        }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1024,
        },
      }),
    });

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  private async chamarGeminiComAudio(prompt: string, audioBase64: string, mimeType: string): Promise<string> {
    const url = `${this.baseUrl}/models/${this.modelId}:generateContent?key=${this.apiKey}`;
    
    // Gemini 2.0 suporta áudio nativamente
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: audioBase64 } },
          ],
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
        },
      }),
    });

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  private async chamarGeminiComVideo(prompt: string, videoBase64: string, mimeType: string): Promise<string> {
    const url = `${this.baseUrl}/models/${this.modelId}:generateContent?key=${this.apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: videoBase64 } },
          ],
        }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1024,
        },
      }),
    });

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  private parseGeminiResponse(response: string): GeminiResponse {
    this.logger.debug(`📥 Resposta raw do Gemini: ${response?.substring(0, 500)}`);
    
    if (!response || response.trim() === '') {
      this.logger.warn('⚠️ Gemini retornou resposta vazia');
      return { text: 'Entendi! Me conta mais sobre o que você precisa.' };
    }
    
    try {
      const parsed = this.parseJson(response);
      const respostaTexto = parsed.resposta || parsed.text || 'Entendi sua mensagem! Como posso ajudar?';
      
      this.logger.debug(`✅ Resposta parseada: ${respostaTexto.substring(0, 100)}`);
      
      return {
        text: respostaTexto,
        demandInfo: {
          categoria: parsed.categoria,
          descricao: parsed.descricao,
          endereco: parsed.endereco,
          urgente: parsed.urgencia === 'alta' || parsed.urgencia === 'critica',
        },
      };
    } catch (error) {
      this.logger.warn(`⚠️ Erro ao parsear JSON, usando resposta como texto: ${error.message}`);
      // Se não conseguir parsear JSON, usar a resposta como texto puro
      return { text: response.replace(/```json|```/g, '').trim() || 'Entendi! Como posso ajudar?' };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private parseJson(text: string): any {
    // Remove markdown code blocks se existirem
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || 
                      text.match(/```\s*([\s\S]*?)\s*```/) ||
                      text.match(/\{[\s\S]*\}/);
    
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
    return JSON.parse(jsonStr);
  }

  // ==========================================
  // TTS (Text-to-Speech) com Gemini 2.5
  // ==========================================

  /**
   * Gera áudio a partir de texto usando Gemini 2.5 Flash TTS
   * @param texto Texto para converter em áudio (máximo recomendado: 500 caracteres)
   * @param voiceName Nome da voz (Kore = firme/profissional, Aoede = leve/amigável)
   * @returns Buffer de áudio em formato PCM (24kHz, mono, 16-bit) ou null se falhar
   */
  async gerarAudio(texto: string, voiceName: string = 'Kore'): Promise<Buffer | null> {
    if (!this.apiKey) {
      this.logger.warn('⚠️ GEMINI_API_KEY não configurada para TTS');
      return null;
    }

    // Limitar texto para evitar áudios muito longos
    const textoLimitado = texto.length > 800 ? texto.substring(0, 800) + '...' : texto;

    this.logger.log(`🎤 Gerando áudio TTS: "${textoLimitado.substring(0, 50)}..."`);

    try {
      // Usar o novo SDK @google/genai para TTS
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: this.apiKey });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: textoLimitado,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voiceName,
              },
            },
          },
        },
      });

      // Extrair dados de áudio da resposta
      const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      if (!audioData) {
        this.logger.warn('⚠️ Gemini TTS não retornou dados de áudio');
        return null;
      }

      // Converter base64 para Buffer (áudio PCM bruto)
      const audioBuffer = Buffer.from(audioData, 'base64');
      
      this.logger.log(`✅ Áudio TTS gerado: ${(audioBuffer.length / 1024).toFixed(1)} KB`);
      
      return audioBuffer;
    } catch (error) {
      this.logger.error(`❌ Erro ao gerar áudio TTS: ${error.message}`);
      return null;
    }
  }

  /**
   * Verifica se o usuário está pedindo resposta por áudio
   */
  usuarioPediuAudio(texto: string): boolean {
    const textoLower = texto.toLowerCase().trim();
    
    const padroesPedidoAudio = [
      // Pedidos explícitos de áudio
      'manda um audio',
      'manda audio',
      'mande um audio',
      'mande audio',
      'envia um audio',
      'envia audio',
      'envie um audio',
      'envie audio',
      'me manda um audio',
      'me envia um audio',
      'pode mandar audio',
      'pode enviar audio',
      'responde em audio',
      'responde por audio',
      'responda em audio',
      'responda por audio',
      'fala pra mim',
      'fale pra mim',
      'me fala',
      'me fale',
      'pode falar',
      'quero ouvir',
      'quero escutar',
      'explica por audio',
      'explique por audio',
      'explica em audio',
      'explique em audio',
      'manda um áudio',
      'manda áudio',
      'envia um áudio',
      'envia áudio',
      'audio por favor',
      'áudio por favor',
      'prefiro audio',
      'prefiro áudio',
      'em audio',
      'em áudio',
      'por audio',
      'por áudio',
      'um audio',
      'um áudio',
    ];

    return padroesPedidoAudio.some(padrao => textoLower.includes(padrao));
  }
}

