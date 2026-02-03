import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { EvolutionApiService } from './evolution-api.service';
import { ConversationService } from './conversation.service';
import { EventsGateway } from '../../../infrastructure/websocket/events.gateway';
import {
  MessagesUpsertEvent,
  extractMessageText,
  extractMediaInfo,
  extractPhoneNumber,
  isGroupMessage,
} from '../interfaces/webhook-events.interface';
import {
  MESSAGE_TEMPLATES,
  processTemplate,
  STATUS_LABELS,
} from '../templates/message-templates';
import {
  COMMAND_PATTERNS,
  CONVERSATION_STATE,
} from '../constants/whatsapp.constants';

@Injectable()
export class MessageProcessorService {
  private readonly logger = new Logger(MessageProcessorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly evolutionApi: EvolutionApiService,
    private readonly conversationService: ConversationService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * Processar mensagem recebida
   */
  async processIncoming(event: MessagesUpsertEvent): Promise<void> {
    const { data } = event;
    const { key, message, pushName, messageTimestamp } = data;

    // Ignorar mensagens de grupo
    if (isGroupMessage(key.remoteJid)) {
      this.logger.debug('Mensagem de grupo ignorada');
      return;
    }

    // Ignorar mensagens enviadas por nós
    if (key.fromMe) {
      return;
    }

    const phone = extractPhoneNumber(key.remoteJid);
    const text = extractMessageText(message);
    const mediaInfo = extractMediaInfo(message);

    this.logger.log(`📩 Mensagem de ${phone}: ${text?.substring(0, 50) || '[mídia]'}`);

    // Marcar como lida
    await this.evolutionApi.markAsRead(key.remoteJid, key.id);

    // Enviar indicador de digitação
    await this.evolutionApi.sendPresence(key.remoteJid, 'composing');

    try {
      // Garantir que existe uma sessão no banco
      const dbSession = await this.getOrCreateDbSession(phone, pushName);

      // Salvar mensagem no banco
      await this.saveMessage({
        sessionId: dbSession.id,
        text,
        mediaInfo,
      });

      // Processar com base no estado da conversa
      await this.handleConversationFlow(phone, text, mediaInfo);
    } catch (error: any) {
      this.logger.error(`Erro ao processar mensagem: ${error.message}`, error.stack);
      await this.sendErrorMessage(phone);
    }
  }

  /**
   * Obter ou criar sessão no banco de dados
   */
  private async getOrCreateDbSession(phone: string, name?: string) {
    let session = await this.prisma.whatsAppSession.findUnique({
      where: { phone },
    });

    if (!session) {
      session = await this.prisma.whatsAppSession.create({
        data: {
          phone,
          name,
          isActive: true,
          lastMessage: new Date(),
        },
      });
    } else {
      await this.prisma.whatsAppSession.update({
        where: { id: session.id },
        data: { lastMessage: new Date(), name: name || session.name },
      });
    }

    return session;
  }

  /**
   * Salvar mensagem no banco de dados
   */
  private async saveMessage(data: {
    sessionId: string;
    text?: string | null;
    mediaInfo?: any;
  }) {
    return this.prisma.whatsAppMessage.create({
      data: {
        sessionId: data.sessionId,
        direction: 'INCOMING',
        content: data.text || '',
        mediaUrl: data.mediaInfo?.url,
        mediaType: data.mediaInfo?.type,
        status: 'DELIVERED',
        aiProcessed: false,
      },
    });
  }

  /**
   * Gerenciar fluxo da conversa
   */
  private async handleConversationFlow(
    phone: string,
    text: string | null,
    mediaInfo: any,
  ): Promise<void> {
    // Obter ou criar sessão de conversa (Redis)
    const session = await this.conversationService.getOrCreateSession(phone);
    const normalizedText = text?.toLowerCase().trim() || '';

    // Verificar comandos especiais
    if (text) {
      if (COMMAND_PATTERNS.HELP.test(normalizedText)) {
        await this.sendWelcomeMessage(phone);
        return;
      }

      if (COMMAND_PATTERNS.CANCEL.test(normalizedText)) {
        await this.conversationService.resetSession(phone);
        await this.sendMessage(phone, 'Operação cancelada. Digite *menu* para ver as opções.');
        return;
      }

      const statusMatch = normalizedText.match(COMMAND_PATTERNS.STATUS);
      if (statusMatch) {
        await this.handleStatusCommand(phone, statusMatch[2] || text);
        return;
      }
    }

    // Processar com base no estado atual da conversa
    switch (session.state) {
      case CONVERSATION_STATE.IDLE:
        await this.handleNewConversation(phone, text, mediaInfo, session);
        break;

      case CONVERSATION_STATE.AWAITING_DESCRIPTION:
        await this.handleDescription(phone, text, session);
        break;

      case CONVERSATION_STATE.AWAITING_LOCATION:
        await this.handleLocation(phone, text, mediaInfo, session);
        break;

      case CONVERSATION_STATE.AWAITING_PHOTO:
        await this.handlePhoto(phone, text, mediaInfo, session);
        break;

      case CONVERSATION_STATE.AWAITING_CONFIRMATION:
        await this.handleConfirmation(phone, text, session);
        break;

      default:
        await this.sendWelcomeMessage(phone);
    }
  }

  private async handleNewConversation(
    phone: string,
    text: string | null,
    mediaInfo: any,
    session: any,
  ): Promise<void> {
    if (text || mediaInfo) {
      const category = this.simpleClassify(text || '');

      await this.conversationService.updateSession(phone, {
        state: CONVERSATION_STATE.AWAITING_LOCATION,
        data: {
          ...session.data,
          description: text,
          category: category,
          priority: 'MEDIUM',
        },
      });

      await this.sendMessage(
        phone,
        `Entendi! Você está reportando um problema de *${category}*.\n\n${MESSAGE_TEMPLATES.requestLocation}`,
      );
    } else {
      await this.sendWelcomeMessage(phone);
    }
  }

  /**
   * Classificação simples de demandas - SEMSUR
   * Categorias específicas da Secretaria Municipal de Serviços Urbanos
   */
  private simpleClassify(text: string): string {
    const lowerText = text.toLowerCase();
    
    // 💡 Iluminação Pública
    if (/luz|poste|iluminação|iluminacao|lampada|lâmpada|apagad[oa]|queimad[oa]|escur[oa]|led/i.test(lowerText)) {
      return 'Iluminação Pública';
    }
    
    // 🧹 Limpeza Urbana
    if (/lixo|entulho|coleta|sujeira|lixeira|descarte|varrição|varricao|limpar|sujo/i.test(lowerText)) {
      return 'Limpeza Urbana';
    }
    
    // 🌳 Praças e Jardins
    if (/praça|praca|jardim|árvore|arvore|poda|galho|mato|capina|banco|parque/i.test(lowerText)) {
      return 'Praças e Jardins';
    }
    
    // 🌊 Drenagem
    if (/bueiro|alagamento|alagad[oa]|entupi|galeria|água|agua|enchente|chuva|inunda/i.test(lowerText)) {
      return 'Drenagem';
    }
    
    // 🏪 Mercados e Cemitérios
    if (/mercado|feira|cemitério|cemiterio|túmulo|tumulo|jazigo/i.test(lowerText)) {
      return 'Mercados e Cemitérios';
    }
    
    // 🛠️ Infraestrutura
    if (/buraco|calçada|calcada|asfalto|pavimento|rua|via|meio-fio|meio fio/i.test(lowerText)) {
      return 'Infraestrutura';
    }
    
    return 'Outros';
  }

  private async handleDescription(
    phone: string,
    text: string | null,
    session: any,
  ): Promise<void> {
    if (!text) {
      await this.sendMessage(phone, MESSAGE_TEMPLATES.requestDescription);
      return;
    }

    const fullDescription = [session.data?.initialText, text].filter(Boolean).join('. ');
    const category = this.simpleClassify(fullDescription);

    await this.conversationService.updateSession(phone, {
      state: CONVERSATION_STATE.AWAITING_LOCATION,
      data: {
        ...session.data,
        description: fullDescription,
        category: category,
        priority: 'MEDIUM',
      },
    });

    await this.sendMessage(phone, MESSAGE_TEMPLATES.requestLocation);
  }

  private async handleLocation(
    phone: string,
    text: string | null,
    mediaInfo: any,
    session: any,
  ): Promise<void> {
    let latitude: number | null = null;
    let longitude: number | null = null;
    let address: string | null = null;

    if (mediaInfo?.type === 'location') {
      latitude = mediaInfo.latitude;
      longitude = mediaInfo.longitude;
      address = mediaInfo.address || mediaInfo.name;
    } else if (text) {
      address = text;
    }

    if (!address && !latitude) {
      await this.sendMessage(
        phone,
        'Não consegui identificar a localização. Por favor, envie sua *localização atual* pelo WhatsApp ou digite o *endereço completo*.',
      );
      return;
    }

    await this.conversationService.updateSession(phone, {
      state: CONVERSATION_STATE.AWAITING_PHOTO,
      data: {
        ...session.data,
        latitude,
        longitude,
        address: address || `Lat: ${latitude}, Lng: ${longitude}`,
      },
    });

    await this.sendMessage(phone, MESSAGE_TEMPLATES.requestPhoto);
  }

  private async handlePhoto(
    phone: string,
    text: string | null,
    mediaInfo: any,
    session: any,
  ): Promise<void> {
    if (mediaInfo?.type === 'image') {
      await this.conversationService.updateSession(phone, {
        data: { ...session.data, photoUrl: mediaInfo.url },
      });
    }

    if (text && /^(pular|skip|não|nao|sem foto)$/i.test(text.trim())) {
      // Continuar sem foto
    }

    await this.conversationService.updateSession(phone, {
      state: CONVERSATION_STATE.AWAITING_CONFIRMATION,
    });

    const confirmMessage = processTemplate('confirmDemand', {
      category: session.data.category || 'Nao classificado',
      address: session.data.address || 'Nao informado',
      description: (session.data.description || '').substring(0, 100) + '...',
      hasPhoto: session.data.photoUrl || mediaInfo?.type === 'image' ? 'Sim' : 'Nao',
    });

    await this.sendMessage(phone, confirmMessage);
  }

  private async handleConfirmation(
    phone: string,
    text: string | null,
    session: any,
  ): Promise<void> {
    const normalizedText = text?.toLowerCase().trim() || '';

    if (COMMAND_PATTERNS.YES.test(normalizedText)) {
      const protocol = this.generateProtocol();
      
      // Buscar categoria para criar demanda
      const category = await this.prisma.category.findFirst({
        where: { name: { contains: session.data.category } },
      });

      if (!category) {
        await this.sendMessage(phone, 'Erro ao criar demanda. Por favor, tente novamente.');
        await this.conversationService.resetSession(phone);
        return;
      }

      const demand = await this.prisma.demand.create({
        data: {
          protocol,
          title: `Demanda via WhatsApp - ${session.data.category}`,
          description: session.data.description || 'Sem descrição',
          address: session.data.address,
          latitude: session.data.latitude,
          longitude: session.data.longitude,
          requesterPhone: phone,
          status: 'OPEN',
          priority: session.data.priority || 'MEDIUM',
          source: 'WHATSAPP',
          categoryId: category.id,
          secretaryId: category.secretaryId,
        },
        include: {
          category: true,
          secretary: true,
        },
      });

      // 🔔 Notificar via WebSocket para atualização em tempo real no mapa
      this.eventsGateway.notifyNewDemand(demand);
      this.logger.log(`📢 WebSocket: Nova demanda emitida - ${demand.protocol}`);

      await this.conversationService.resetSession(phone);

      const successMessage = processTemplate('demandCreated', {
        protocol: demand.protocol,
        category: session.data.category || 'Outros',
        address: demand.address || 'Não informado',
        createdAt: new Date().toLocaleDateString('pt-BR'),
        estimatedTime: '48 horas',
      });

      await this.sendMessage(phone, successMessage);
    } else if (COMMAND_PATTERNS.NO.test(normalizedText)) {
      await this.conversationService.resetSession(phone);
      await this.sendMessage(
        phone,
        'Ok, vamos recomeçar. Descreva novamente o problema que você deseja reportar.',
      );
    } else {
      await this.sendMessage(
        phone,
        'Por favor, responda *1* para confirmar ou *2* para corrigir.',
      );
    }
  }

  private generateProtocol(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(10000 + Math.random() * 90000);
    return `PNM-${year}-${random}`;
  }

  private async handleStatusCommand(phone: string, query: string): Promise<void> {
    const protocolMatch = query.match(/pnm[-\s]?(\d{4})[-\s]?(\d{5})/i);

    if (protocolMatch) {
      const protocol = `PNM-${protocolMatch[1]}-${protocolMatch[2]}`;
      const demand = await this.prisma.demand.findFirst({
        where: { protocol },
        include: { category: true, secretary: true },
      });

      if (demand) {
        const statusMessage = processTemplate('statusResponse', {
          protocol: demand.protocol,
          category: demand.category.name,
          address: demand.address || 'Não informado',
          status: STATUS_LABELS[demand.status] || demand.status,
          secretaryName: demand.secretary.name,
          createdAt: new Date(demand.createdAt).toLocaleDateString('pt-BR'),
          updatedAt: new Date(demand.updatedAt).toLocaleDateString('pt-BR'),
          additionalInfo: demand.status === 'IN_PROGRESS' 
            ? 'Nossa equipe está trabalhando na resolução.' 
            : '',
        });

        await this.sendMessage(phone, statusMessage);
      } else {
        await this.sendMessage(phone, MESSAGE_TEMPLATES.protocolNotFound);
      }
    } else {
      const demands = await this.prisma.demand.findMany({
        where: { requesterPhone: phone },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { category: true },
      });

      if (demands.length > 0) {
        let message = 'Suas Solicitacoes\n\n';
        demands.forEach((d) => {
          message += `- ${d.protocol}\n`;
          message += `  ${d.category.name} - ${STATUS_LABELS[d.status] || d.status}\n\n`;
        });
        message += 'Pra ver detalhes, manda: status PNM-XXXX-XXXXX';
        await this.sendMessage(phone, message);
      } else {
        await this.sendMessage(
          phone,
          'Voce ainda nao tem nenhuma solicitacao registrada.\n\nQuer registrar uma nova? E so me contar o problema ou mandar uma foto.',
        );
      }
    }
  }

  private async sendWelcomeMessage(phone: string): Promise<void> {
    await this.sendMessage(phone, MESSAGE_TEMPLATES.welcome);
  }

  private async sendErrorMessage(phone: string): Promise<void> {
    await this.sendMessage(phone, MESSAGE_TEMPLATES.errorMessage);
  }

  async sendMessage(phone: string, text: string): Promise<void> {
    try {
      await this.evolutionApi.sendText({ number: phone, text });

      const dbSession = await this.getOrCreateDbSession(phone);
      await this.prisma.whatsAppMessage.create({
        data: {
          sessionId: dbSession.id,
          direction: 'OUTGOING',
          content: text,
          status: 'SENT',
        },
      });
    } catch (error: any) {
      this.logger.error(`Erro ao enviar mensagem: ${error.message}`);
      throw error;
    }
  }

  async sendDemandUpdate(demandId: string, status: string, message?: string): Promise<void> {
    const demand = await this.prisma.demand.findUnique({
      where: { id: demandId },
    });

    if (!demand?.requesterPhone) return;

    const text = processTemplate('demandUpdated', {
      protocol: demand.protocol,
      status: STATUS_LABELS[status] || status,
      updatedAt: new Date().toLocaleDateString('pt-BR'),
      message: message || '',
    });

    await this.sendMessage(demand.requesterPhone, text);
  }
}
