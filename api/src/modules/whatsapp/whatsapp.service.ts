import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { EvolutionApiService } from './services/evolution-api.service';
import { MessageProcessorService } from './services/message-processor.service';
import { processTemplate, TemplateVariables, MESSAGE_TEMPLATES } from './templates/message-templates';
import {
  ConnectionUpdateEvent,
  QRCodeUpdatedEvent,
  MessagesUpdateEvent,
  CallEvent,
} from './interfaces/webhook-events.interface';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private currentQRCode: string | null = null;
  private connectionState: string = 'close';

  constructor(
    private readonly prisma: PrismaService,
    private readonly evolutionApi: EvolutionApiService,
    private readonly messageProcessor: MessageProcessorService,
  ) {}

  // ===== HANDLERS DE EVENTOS =====

  async handleConnectionUpdate(event: ConnectionUpdateEvent): Promise<void> {
    const { state } = event.data;
    this.connectionState = state;

    this.logger.log(`📡 Status da conexão: ${state}`);

    if (state === 'open') {
      this.currentQRCode = null;
    } else if (state === 'close') {
      setTimeout(() => {
        this.evolutionApi.connectInstance().catch(() => {});
      }, 5000);
    }
  }

  async handleQRCodeUpdate(event: QRCodeUpdatedEvent): Promise<void> {
    const { qrcode } = event.data;
    this.currentQRCode = qrcode.base64;
    this.logger.log(`📱 QR Code atualizado (tentativa ${qrcode.count})`);
  }

  async handleMessageStatusUpdate(event: MessagesUpdateEvent): Promise<void> {
    // O modelo WhatsAppMessage não tem campo status compatível com os status da Evolution
    // Apenas logamos a atualização
    this.logger.debug(`📬 Status atualizado: ${JSON.stringify(event.data)}`);
  }

  async handleCall(event: CallEvent): Promise<void> {
    const { from, isVideo } = event.data;
    this.logger.log(`📞 Chamada ${isVideo ? 'de vídeo' : 'de voz'} de ${from} rejeitada`);
  }

  // ===== MÉTODOS DE ENVIO =====

  async sendTemplateNotification(
    phone: string,
    templateKey: string,
    variables?: TemplateVariables,
  ): Promise<void> {
    const template = MESSAGE_TEMPLATES[templateKey as keyof typeof MESSAGE_TEMPLATES];

    if (!template) {
      throw new Error(`Template "${templateKey}" não encontrado`);
    }

    const message = variables ? processTemplate(templateKey as any, variables) : template;
    await this.messageProcessor.sendMessage(phone, message);
  }

  // ===== LISTAGEM DE CONVERSAS =====

  async listSessions(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      this.prisma.whatsAppSession.findMany({
        orderBy: { lastMessage: 'desc' },
        skip,
        take: limit,
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: {
              demand: { select: { id: true, protocol: true, status: true } },
            },
          },
          _count: { select: { messages: true } },
        },
      }),
      this.prisma.whatsAppSession.count(),
    ]);

    const sessionsWithDetails = sessions.map((s) => ({
      phone: s.phone,
      name: s.name,
      messageCount: s._count.messages,
      lastMessageAt: s.lastMessage,
      lastMessage: s.messages[0]?.content?.substring(0, 100),
      lastMessageDirection: s.messages[0]?.direction,
      demand: s.messages[0]?.demand,
    }));

    return {
      data: sessionsWithDetails,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSessionMessages(phone: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const session = await this.prisma.whatsAppSession.findUnique({
      where: { phone },
    });

    if (!session) {
      return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
    }

    const [messages, total] = await Promise.all([
      this.prisma.whatsAppMessage.findMany({
        where: { sessionId: session.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          demand: {
            select: { id: true, protocol: true, status: true },
          },
        },
      }),
      this.prisma.whatsAppMessage.count({ where: { sessionId: session.id } }),
    ]);

    return {
      data: messages.reverse(),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSessionDemand(phone: string) {
    const session = await this.prisma.whatsAppSession.findUnique({
      where: { phone },
    });

    if (!session) return null;

    const message = await this.prisma.whatsAppMessage.findFirst({
      where: {
        sessionId: session.id,
        demandId: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        demand: {
          include: {
            category: true,
            secretary: true,
            attachments: true,
            history: {
              take: 10,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    return message?.demand || null;
  }

  // ===== GETTERS =====

  get qrCode(): string | null {
    return this.currentQRCode;
  }

  get status(): string {
    return this.connectionState;
  }
}
