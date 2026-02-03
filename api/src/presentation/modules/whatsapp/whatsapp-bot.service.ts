import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { RedisService } from '@/infrastructure/cache/redis.service';
import { ConfigService } from '@nestjs/config';
import { DemandSource, DemandStatus, Priority } from '@prisma/client';
import { calculateSLADeadline } from '@/shared/utils/helpers';
import { GeminiService } from './gemini/gemini.service';
import { MediaService } from './media/media.service';

// ============ CONFIGURAÇÃO DE LOGS COLORIDOS ============
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Cores de texto
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // Backgrounds
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
};

// ============ INTERFACES ============
export interface WhatsAppWebhookPayload {
  event?: string;
  instance?: string;
  data?: {
    key?: {
      remoteJid?: string;
      fromMe?: boolean;
      id?: string;
    };
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: { text?: string };
      imageMessage?: { url?: string; mimetype?: string; caption?: string };
      audioMessage?: { url?: string; mimetype?: string; ptt?: boolean };
      videoMessage?: { url?: string; mimetype?: string; caption?: string };
      documentMessage?: { url?: string; mimetype?: string; fileName?: string };
      locationMessage?: { degreesLatitude?: number; degreesLongitude?: number };
    };
    messageType?: string;
    messageTimestamp?: number;
  };
}

interface ConversationState {
  step: 'aguardando_demanda' | 'coletando_endereco' | 'confirmando';
  nome?: string;
  telefone?: string;
  demandaInfo?: {
    descricao?: string;
    categoria?: string;
    endereco?: string;
    urgencia?: string;
    tipoMidia?: string;
    transcricao?: string;
  };
  ultimaInteracao: number;
}

@Injectable()
export class WhatsAppBotService {
  private readonly logger = new Logger('WhatsAppBot');
  private readonly SESSION_TTL = 1800; // 30 minutos
  
  // Controle de ativação do bot
  private static botAtivo = true;
  
  private readonly gemini: GeminiService;
  private readonly media: MediaService;

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private config: ConfigService,
  ) {
    this.gemini = new GeminiService(config);
    this.media = new MediaService(config);
    
    this.logBanner();
  }

  private logBanner() {
    console.log(`
${COLORS.cyan}╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   ${COLORS.bright}${COLORS.white}SEMSUR BOT - Assistente Virtual${COLORS.reset}${COLORS.cyan}                            ║
║   ${COLORS.green}Gemini 2.0 Flash${COLORS.cyan} | Texto | Audio | Imagem | Video            ║
║                                                                ║
║   ${COLORS.yellow}Status: ${WhatsAppBotService.botAtivo ? COLORS.green + 'ATIVO' : COLORS.red + 'DESATIVADO'}${COLORS.reset}${COLORS.cyan}                                           ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝${COLORS.reset}
`);
  }

  // ============ CONTROLE DO BOT ============
  
  static ativarBot(): boolean {
    WhatsAppBotService.botAtivo = true;
    console.log(`\n${COLORS.bgGreen}${COLORS.white} BOT ATIVADO ${COLORS.reset} O bot está respondendo mensagens\n`);
    return true;
  }

  static desativarBot(): boolean {
    WhatsAppBotService.botAtivo = false;
    console.log(`\n${COLORS.bgYellow}${COLORS.white} BOT DESATIVADO ${COLORS.reset} O bot não está respondendo mensagens\n`);
    return false;
  }

  static getStatus(): { ativo: boolean; mensagem: string } {
    return {
      ativo: WhatsAppBotService.botAtivo,
      mensagem: WhatsAppBotService.botAtivo 
        ? 'Bot está ativo e respondendo mensagens'
        : 'Bot está desativado',
    };
  }

  // ============ LOGS AO VIVO ============

  private logMensagemRecebida(telefone: string, nome: string, tipo: string, conteudo: string) {
    const hora = new Date().toLocaleTimeString('pt-BR');
    console.log(`
${COLORS.bgBlue}${COLORS.white} MENSAGEM RECEBIDA ${COLORS.reset} ${hora}
${COLORS.cyan}De:${COLORS.reset} ${nome} (${telefone})
${COLORS.cyan}Tipo:${COLORS.reset} ${tipo}
${COLORS.cyan}Conteudo:${COLORS.reset} ${conteudo.substring(0, 100)}${conteudo.length > 100 ? '...' : ''}
${'─'.repeat(60)}
`);
  }

  private logMensagemEnviada(telefone: string, mensagem: string) {
    const hora = new Date().toLocaleTimeString('pt-BR');
    console.log(`
${COLORS.bgGreen}${COLORS.white} MENSAGEM ENVIADA ${COLORS.reset} ${hora}
${COLORS.green}Para:${COLORS.reset} ${telefone}
${COLORS.green}Mensagem:${COLORS.reset} ${mensagem.substring(0, 150)}${mensagem.length > 150 ? '...' : ''}
${'─'.repeat(60)}
`);
  }

  private logDemandaCriada(protocolo: string, categoria: string, descricao: string) {
    console.log(`
${COLORS.bgMagenta}${COLORS.white} DEMANDA REGISTRADA ${COLORS.reset}
${COLORS.magenta}Protocolo:${COLORS.reset} ${protocolo}
${COLORS.magenta}Categoria:${COLORS.reset} ${categoria}
${COLORS.magenta}Descricao:${COLORS.reset} ${descricao.substring(0, 100)}...
${'═'.repeat(60)}
`);
  }

  // ============ PROCESSAMENTO DE WEBHOOK ============

  async handleWebhook(payload: WhatsAppWebhookPayload) {
    try {
      // Log do payload completo para debug
      this.logger.debug(`Payload recebido: ${JSON.stringify(payload, null, 2)}`);

      // Verificar se é evento de mensagem
      const eventName = payload.event?.toLowerCase().replace('_', '.');
      if (eventName !== 'messages.upsert' && payload.event !== 'MESSAGES_UPSERT') {
        return { success: true, message: 'Evento ignorado' };
      }

      const data = payload.data;
      if (!data || data.key?.fromMe) {
        return { success: true };
      }

      // Verificar se o bot está ativo
      if (!WhatsAppBotService.botAtivo) {
        this.logger.log('Bot desativado - mensagem ignorada');
        return { success: true, message: 'Bot desativado' };
      }

      const remoteJid = data.key?.remoteJid;
      if (!remoteJid || remoteJid.includes('@g.us')) {
        return { success: true }; // Ignora grupos
      }

      // IMPORTANTE: Usar remoteJid ORIGINAL para responder (funciona com @lid)
      // O telefone "display" é só para logs e registro no banco
      let destinoResposta = remoteJid;
      let telefoneDisplay = remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', '').replace('@lid', '');
      
      // Se for @lid (Linked ID - privacidade WhatsApp), manter o JID original para resposta
      if (remoteJid.includes('@lid')) {
        this.logger.log(`Mensagem via LID: ${remoteJid}`);
        // O destino continua sendo o remoteJid com @lid
        // Só precisamos extrair algo para display/logs
        telefoneDisplay = `LID-${remoteJid.split('@')[0].slice(-6)}`;
      }

      const nome = data.pushName || 'Cidadao';
      const message = data.message;

      // Identificar tipo de mensagem e processar
      // Passamos o destinoResposta completo (incluindo @lid se for o caso)
      await this.processarMensagem(destinoResposta, nome, message, data.key, telefoneDisplay);

      return { success: true };
    } catch (error) {
      this.logger.error(`Erro no webhook: ${error}`);
      return { success: false, error: String(error) };
    }
  }

  // ============ PROCESSAMENTO DE MENSAGENS ============

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async processarMensagem(destino: string, nome: string, message: any, messageKey: any, telefoneDisplay: string) {
    // Obter ou criar estado da conversa (usa destino como chave)
    const state = await this.getConversationState(destino);

    // Identificar tipo de mensagem
    if (message?.conversation || message?.extendedTextMessage?.text) {
      const texto = message.conversation || message.extendedTextMessage?.text || '';
      this.logMensagemRecebida(telefoneDisplay, nome, 'TEXTO', texto);
      await this.processarTexto(destino, nome, texto, state, telefoneDisplay);
    } 
    else if (message?.audioMessage || message?.pttMessage) {
      this.logMensagemRecebida(telefoneDisplay, nome, 'AUDIO', '[Mensagem de voz]');
      await this.processarAudio(destino, nome, message, messageKey, state, telefoneDisplay);
    }
    else if (message?.imageMessage) {
      const caption = message.imageMessage.caption || '';
      this.logMensagemRecebida(telefoneDisplay, nome, 'IMAGEM', caption || '[Imagem sem legenda]');
      await this.processarImagem(destino, nome, message, messageKey, caption, state, telefoneDisplay);
    }
    else if (message?.videoMessage) {
      const caption = message.videoMessage.caption || '';
      this.logMensagemRecebida(telefoneDisplay, nome, 'VIDEO', caption || '[Video sem legenda]');
      await this.processarVideo(destino, nome, message, messageKey, caption, state, telefoneDisplay);
    }
    else if (message?.locationMessage) {
      const lat = message.locationMessage.degreesLatitude;
      const lng = message.locationMessage.degreesLongitude;
      this.logMensagemRecebida(telefoneDisplay, nome, 'LOCALIZACAO', `${lat}, ${lng}`);
      await this.processarLocalizacao(destino, nome, lat, lng, state, telefoneDisplay);
    }
    else {
      this.logger.warn('Tipo de mensagem não suportado');
    }
  }

  // ============ PROCESSAMENTO POR TIPO ============

  private async processarTexto(destino: string, nome: string, texto: string, state: ConversationState | null, telefoneDisplay: string) {
    const textoNormalizado = texto.toLowerCase().trim();

    // Se é saudação inicial (oi, olá, etc.)
    if (this.ehSaudacao(textoNormalizado) && (!state || state.step === 'aguardando_demanda')) {
      await this.enviarSaudacao(destino, nome);
      await this.setConversationState(destino, {
        step: 'aguardando_demanda',
        nome,
        telefone: telefoneDisplay,
        ultimaInteracao: Date.now(),
      });
      return;
    }

    // Se já foi saudado, analisar como demanda
    if (!state || state.step === 'aguardando_demanda') {
      // Enviar saudação se ainda não foi saudado
      if (!state) {
        await this.enviarSaudacao(destino, nome);
      }

      // Analisar texto com Gemini
      const analise = await this.gemini.analisarTexto(texto, `Cidadão ${nome} mandou mensagem`);
      
      if (analise.demandInfo?.descricao) {
        // Criar demanda automaticamente
        await this.criarDemandaAutomatica(destino, nome, {
          descricao: analise.demandInfo.descricao,
          categoria: analise.demandInfo.categoria,
          endereco: analise.demandInfo.endereco,
          urgencia: analise.demandInfo.urgente ? 'alta' : 'media',
          tipoMidia: 'texto',
        }, telefoneDisplay);
      } else {
        // Pedir mais detalhes
        await this.enviarMensagem(destino, 
          `Entendi, ${nome}! Pra eu registrar sua solicitacao, me conta com mais detalhes o problema e onde ele fica.`
        );
      }
      return;
    }

    // Outros estados
    if (state.step === 'coletando_endereco') {
      // Atualizar endereço e criar demanda
      const demandaInfo = { ...state.demandaInfo, endereco: texto };
      await this.criarDemandaAutomatica(destino, nome, demandaInfo, telefoneDisplay);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async processarAudio(destino: string, nome: string, message: any, messageKey: any, state: ConversationState | null, telefoneDisplay: string) {
    // Enviar saudação se necessário
    if (!state) {
      await this.enviarSaudacao(destino, nome);
    }

    await this.enviarMensagem(destino, 'Recebi seu audio! Deixa eu ouvir e entender o que voce precisa...');

    // Baixar áudio
    const mediaInfo = await this.media.downloadMedia(messageKey, message);
    
    if (!mediaInfo) {
      await this.enviarMensagem(destino, 
        'Nao consegui processar o audio. Pode me mandar por texto o que ta precisando?'
      );
      return;
    }

    // Transcrever e analisar com Gemini
    const analise = await this.gemini.analisarAudio(mediaInfo.base64, mediaInfo.mimeType);
    
    console.log(`${COLORS.yellow}[TRANSCRICAO]${COLORS.reset} ${analise.transcricao || 'Não transcrito'}`);

    if (analise.demandaDetectada && analise.descricao) {
      await this.criarDemandaAutomatica(destino, nome, {
        descricao: analise.descricao,
        categoria: analise.categoria,
        endereco: analise.endereco,
        urgencia: analise.urgencia,
        tipoMidia: 'audio',
        transcricao: analise.transcricao,
      }, telefoneDisplay);
    } else {
      await this.enviarMensagem(destino, 
        `Entendi o que voce disse: "${analise.transcricao}". Isso e um problema que a SEMSUR pode resolver? Me conta mais detalhes.`
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async processarImagem(destino: string, nome: string, message: any, messageKey: any, caption: string, state: ConversationState | null, telefoneDisplay: string) {
    if (!state) {
      await this.enviarSaudacao(destino, nome);
    }

    await this.enviarMensagem(destino, 'Recebi a foto! Deixa eu analisar...');

    // Baixar imagem
    const mediaInfo = await this.media.downloadMedia(messageKey, message);
    
    if (!mediaInfo) {
      await this.enviarMensagem(destino, 
        'Nao consegui ver a imagem. Pode descrever o problema por texto?'
      );
      return;
    }

    // Analisar com Gemini Vision
    const analise = await this.gemini.analisarImagem(mediaInfo.base64, mediaInfo.mimeType, caption);
    
    console.log(`${COLORS.yellow}[ANALISE IMAGEM]${COLORS.reset} ${analise.descricao}`);

    if (analise.demandaDetectada && analise.descricao) {
      // Se não tem endereço, pedir
      if (!analise.endereco && !caption) {
        await this.enviarMensagem(destino, 
          `Entendi! Vi que e um problema de ${analise.categoria?.toLowerCase() || 'servico urbano'}. ` +
          `Agora me passa o endereco ou manda a localizacao pra eu registrar.`
        );
        
        await this.setConversationState(destino, {
          step: 'coletando_endereco',
          nome,
          telefone: telefoneDisplay,
          demandaInfo: {
            descricao: analise.descricao,
            categoria: analise.categoria,
            urgencia: analise.urgencia,
            tipoMidia: 'imagem',
          },
          ultimaInteracao: Date.now(),
        });
        return;
      }

      await this.criarDemandaAutomatica(destino, nome, {
        descricao: analise.descricao,
        categoria: analise.categoria,
        endereco: analise.endereco || caption,
        urgencia: analise.urgencia,
        tipoMidia: 'imagem',
      }, telefoneDisplay);
    } else {
      await this.enviarMensagem(destino, 
        `Vi a imagem: ${analise.descricao}. Me conta mais sobre o problema pra eu poder te ajudar.`
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async processarVideo(destino: string, nome: string, message: any, messageKey: any, caption: string, state: ConversationState | null, telefoneDisplay: string) {
    if (!state) {
      await this.enviarSaudacao(destino, nome);
    }

    await this.enviarMensagem(destino, 'Recebi o video! Analisando...');

    // Baixar vídeo
    const mediaInfo = await this.media.downloadMedia(messageKey, message);
    
    if (!mediaInfo) {
      await this.enviarMensagem(destino, 
        'O video e muito grande ou nao consegui processar. Pode mandar uma foto ou descrever por texto?'
      );
      return;
    }

    // Analisar com Gemini
    const analise = await this.gemini.analisarVideo(mediaInfo.base64, mediaInfo.mimeType);
    
    console.log(`${COLORS.yellow}[ANALISE VIDEO]${COLORS.reset} ${analise.descricao}`);

    if (analise.demandaDetectada && analise.descricao) {
      await this.criarDemandaAutomatica(destino, nome, {
        descricao: analise.descricao,
        categoria: analise.categoria,
        endereco: analise.endereco || caption,
        urgencia: analise.urgencia,
        tipoMidia: 'video',
        transcricao: analise.transcricao,
      }, telefoneDisplay);
    } else {
      await this.enviarMensagem(destino, 
        `Vi o video. ${analise.descricao}. E um problema que a prefeitura precisa resolver? Me conta mais.`
      );
    }
  }

  private async processarLocalizacao(destino: string, nome: string, lat: number, lng: number, state: ConversationState | null, telefoneDisplay: string) {
    if (state?.step === 'coletando_endereco' && state.demandaInfo) {
      // Temos a demanda, agora com endereço
      const endereco = `Lat: ${lat}, Lng: ${lng}`;
      
      await this.criarDemandaAutomatica(destino, nome, {
        ...state.demandaInfo,
        endereco,
      }, telefoneDisplay);
    } else {
      await this.enviarMensagem(destino, 
        'Recebi sua localizacao! Agora me conta qual e o problema nesse local.'
      );
      
      await this.setConversationState(destino, {
        step: 'aguardando_demanda',
        nome,
        telefone: telefoneDisplay,
        demandaInfo: {
          endereco: `Lat: ${lat}, Lng: ${lng}`,
        },
        ultimaInteracao: Date.now(),
      });
    }
  }

  // ============ CRIAÇÃO DE DEMANDA ============

  private async criarDemandaAutomatica(
    destino: string, 
    nome: string, 
    demandaInfo: ConversationState['demandaInfo'],
    telefoneDisplay: string
  ) {
    try {
      // Gerar protocolo único
      const protocolo = await this.gerarProtocolo();
      
      // Buscar ou criar categoria
      const categoria = await this.buscarCategoria(demandaInfo?.categoria);
      
      if (!categoria) {
        await this.enviarMensagem(destino, 'Desculpa, nao encontrei uma categoria pra sua demanda. Tenta de novo?');
        return;
      }
      
      // Mapear prioridade
      const prioridade = this.mapearPrioridade(demandaInfo?.urgencia);

      // Criar demanda no banco (usar telefoneDisplay para registro)
      const demand = await this.prisma.demand.create({
        data: {
          protocol: protocolo,
          title: `Demanda via WhatsApp - ${demandaInfo?.categoria || 'Servico Urbano'}`,
          description: this.montarDescricao(demandaInfo),
          categoryId: categoria.id,
          secretaryId: categoria.secretaryId,
          source: DemandSource.WHATSAPP,
          status: DemandStatus.OPEN,
          priority: prioridade,
          requesterName: nome,
          requesterPhone: telefoneDisplay,
          address: demandaInfo?.endereco,
          slaDeadline: calculateSLADeadline(categoria.slaDays || 15),
        },
      });

      // Criar histórico
      await this.prisma.demandHistory.create({
        data: {
          demandId: demand.id,
          action: 'CREATED',
          description: `Demanda registrada via WhatsApp (${demandaInfo?.tipoMidia || 'texto'})`,
        },
      });

      // Log da demanda criada
      this.logDemandaCriada(protocolo, categoria.name, demandaInfo?.descricao || '');

      // Enviar confirmação (usar destino para responder)
      await this.enviarMensagem(destino, 
        `Pronto, ${nome}! Registrei sua solicitacao.\n\n` +
        `Protocolo: ${protocolo}\n` +
        `Categoria: ${categoria.name}\n` +
        `Prazo: ${categoria.slaDays || 15} dias\n\n` +
        `Guarda esse numero! Vou te avisar quando tiver novidades.`
      );

      // Limpar estado
      await this.deleteConversationState(destino);

    } catch (error) {
      this.logger.error(`Erro ao criar demanda: ${error}`);
      await this.enviarMensagem(destino, 
        'Desculpa, deu um probleminha aqui. Tenta de novo em alguns minutos?'
      );
    }
  }

  private montarDescricao(demandaInfo: ConversationState['demandaInfo']): string {
    let descricao = demandaInfo?.descricao || 'Sem descricao';
    
    if (demandaInfo?.transcricao) {
      descricao += `\n\n[Transcricao de audio]: ${demandaInfo.transcricao}`;
    }
    
    if (demandaInfo?.tipoMidia && demandaInfo.tipoMidia !== 'texto') {
      descricao += `\n\n[Origem: ${demandaInfo.tipoMidia}]`;
    }
    
    return descricao;
  }

  private async buscarCategoria(categoriaNome?: string) {
    // Tentar encontrar categoria pelo nome
    if (categoriaNome) {
      const categoria = await this.prisma.category.findFirst({
        where: {
          OR: [
            { name: { contains: categoriaNome, mode: 'insensitive' } },
            { slug: { equals: categoriaNome.toLowerCase() } },
          ],
          isActive: true,
        },
      });
      if (categoria) return categoria;
    }

    // Categoria padrão "Outros"
    const outros = await this.prisma.category.findFirst({
      where: { 
        OR: [
          { slug: 'outros' },
          { name: { contains: 'Outros', mode: 'insensitive' } },
        ],
        isActive: true,
      },
    });
    
    if (outros) return outros;

    // Pegar qualquer categoria ativa
    return this.prisma.category.findFirst({
      where: { isActive: true },
    });
  }

  private mapearPrioridade(urgencia?: string): Priority {
    switch (urgencia?.toLowerCase()) {
      case 'critica': return Priority.CRITICAL;
      case 'alta': return Priority.HIGH;
      case 'media': return Priority.MEDIUM;
      case 'baixa': return Priority.LOW;
      default: return Priority.MEDIUM;
    }
  }

  // ============ SAUDAÇÃO ============

  private ehSaudacao(texto: string): boolean {
    const saudacoes = [
      'oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite',
      'hey', 'e aí', 'e ai', 'eae', 'opa', 'oie', 'hello', 'hi',
      'alô', 'alo', 'oi boa', 'oii', 'oiii', 'menu', 'inicio'
    ];
    return saudacoes.some(s => texto.includes(s));
  }

  private async enviarSaudacao(destino: string, nome: string) {
    const hora = new Date().getHours();
    let saudacao: string;
    
    if (hora >= 5 && hora < 12) {
      saudacao = 'Bom dia';
    } else if (hora >= 12 && hora < 18) {
      saudacao = 'Boa tarde';
    } else {
      saudacao = 'Boa noite';
    }

    const primeiroNome = nome.split(' ')[0];
    
    const mensagem = `${saudacao}, ${primeiroNome}! Eu sou a Luma, assistente virtual da SEMSUR - Secretaria de Servicos Urbanos de Parnamirim.\n\n` +
      `Me conta o que ta precisando. Pode mandar texto, audio, foto ou video do problema que eu te ajudo a registrar.`;
    
    await this.enviarMensagem(destino, mensagem);
  }

  // ============ ENVIO DE MENSAGENS ============

  private async enviarMensagem(destino: string, mensagem: string, messageKeyToReply?: { id?: string; remoteJid?: string }) {
    const evolutionUrl = this.config.get<string>('EVOLUTION_API_URL');
    const evolutionKey = this.config.get<string>('EVOLUTION_API_KEY');
    const instanceName = this.config.get<string>('EVOLUTION_INSTANCE_NAME') || 'semsur';

    try {
      // Se o destino é um LID, precisamos usar resposta direta (quote)
      // A Evolution API permite responder citando a mensagem original
      let number = destino;
      
      // Se for LID, remover o sufixo para usar só o ID
      if (destino.includes('@lid')) {
        number = destino; // Manter o formato completo para resposta
      } else if (!destino.includes('@')) {
        // Se não tem @, é só número normal
        number = destino;
      } else {
        // Se tem @s.whatsapp.net ou @c.us, extrair só o número
        number = destino.replace('@s.whatsapp.net', '').replace('@c.us', '');
      }

      const response = await fetch(
        `${evolutionUrl}/message/sendText/${instanceName}`,
        {
          method: 'POST',
          headers: {
            'apikey': evolutionKey || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            number: number,
            textMessage: { text: mensagem },
            // Se temos a key da mensagem original, citar ela
            ...(messageKeyToReply && {
              quoted: {
                key: messageKeyToReply,
              },
            }),
          }),
        }
      );

      if (response.ok) {
        this.logMensagemEnviada(number, mensagem);
      } else {
        const error = await response.text();
        this.logger.error(`Erro Evolution API: ${error}`);
        
        // Se falhou, pode ser que o número não exista
        // Logar para debug
        this.logger.warn(`Falha ao enviar para: ${number} (destino original: ${destino})`);
      }
    } catch (error) {
      this.logger.error(`Erro ao enviar mensagem: ${error}`);
    }
  }

  // ============ GERENCIAMENTO DE ESTADO ============

  private async getConversationState(telefone: string): Promise<ConversationState | null> {
    const key = `whatsapp:conversation:${telefone}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data as string) : null;
  }

  private async setConversationState(telefone: string, state: ConversationState) {
    const key = `whatsapp:conversation:${telefone}`;
    await this.redis.set(key, JSON.stringify(state), this.SESSION_TTL);
  }

  private async deleteConversationState(telefone: string) {
    const key = `whatsapp:conversation:${telefone}`;
    await this.redis.del(key);
  }

  // ============ UTILITÁRIOS ============

  private async gerarProtocolo(): Promise<string> {
    const ano = new Date().getFullYear();
    const ultimaDemanda = await this.prisma.demand.findFirst({
      where: { protocol: { startsWith: `${ano}-` } },
      orderBy: { createdAt: 'desc' },
    });

    let numero = 1;
    if (ultimaDemanda?.protocol) {
      const match = ultimaDemanda.protocol.match(/\d{4}-(\d+)/);
      if (match) numero = parseInt(match[1]) + 1;
    }

    return `${ano}-${numero.toString().padStart(6, '0')}`;
  }
}
