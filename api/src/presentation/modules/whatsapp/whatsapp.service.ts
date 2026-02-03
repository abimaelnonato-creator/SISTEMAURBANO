import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { RedisService } from '@/infrastructure/cache/redis.service';
import { ConfigService } from '@nestjs/config';
import { DemandSource } from '@prisma/client';
import { generateProtocol, calculateSLADeadline, formatPhoneNumber } from '@/shared/utils/helpers';
import { PersonalityService } from './personality/personality.service';

export interface WhatsAppMessage {
  from: string;
  to: string;
  type: 'text' | 'image' | 'document' | 'location';
  text?: string;
  mediaUrl?: string;
  latitude?: number;
  longitude?: number;
  timestamp: Date;
}

// Evolution API v2 Webhook Payload
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
      extendedTextMessage?: {
        text?: string;
      };
      imageMessage?: {
        url?: string;
        mimetype?: string;
        caption?: string;
      };
      locationMessage?: {
        degreesLatitude?: number;
        degreesLongitude?: number;
      };
    };
    messageType?: string;
    messageTimestamp?: number;
  };
  // Legacy Meta format support
  object?: string;
  entry?: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: { body: string };
          image?: { id: string; mime_type: string };
          location?: { latitude: number; longitude: number; name?: string };
        }>;
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

interface ConversationState {
  step: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
  lastInteraction: Date;
  humor?: string;
  jaSaudou?: boolean;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly SESSION_TTL = 1800; // 30 minutes
  private readonly personality: PersonalityService;

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private config: ConfigService,
  ) {
    this.personality = new PersonalityService();
  }

  async handleWebhook(payload: WhatsAppWebhookPayload) {
    try {
      this.logger.log(`Webhook received: ${JSON.stringify(payload).substring(0, 500)}`);

      // Evolution API v1.8.x usa MESSAGES_UPSERT, v2 usa messages.upsert
      const eventName = payload.event?.toLowerCase().replace('_', '.');
      if ((eventName === 'messages.upsert' || payload.event === 'MESSAGES_UPSERT') && payload.data) {
        const data = payload.data;
        
        // Ignore messages sent by us
        if (data.key?.fromMe) {
          this.logger.log('Ignoring message sent by us');
          return { success: true };
        }

        const remoteJid = data.key?.remoteJid;
        if (!remoteJid) {
          this.logger.warn('No remoteJid in webhook');
          return { success: true };
        }

        // Extract phone number from JID (format: 5584999999999@s.whatsapp.net)
        const phone = remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');
        
        // Get message content
        let text: string | undefined;
        let location: { latitude: number; longitude: number } | undefined;

        if (data.message?.conversation) {
          text = data.message.conversation;
        } else if (data.message?.extendedTextMessage?.text) {
          text = data.message.extendedTextMessage.text;
        } else if (data.message?.locationMessage) {
          location = {
            latitude: data.message.locationMessage.degreesLatitude || 0,
            longitude: data.message.locationMessage.degreesLongitude || 0,
          };
        }

        await this.processIncomingMessage({
          from: phone,
          contactName: data.pushName,
          messageType: data.messageType || 'text',
          text,
          location,
          timestamp: new Date((data.messageTimestamp || Date.now() / 1000) * 1000),
        });

        return { success: true };
      }

      // Legacy Meta format support
      if (payload.entry) {
        for (const entry of payload.entry) {
          for (const change of entry.changes) {
            if (change.field === 'messages' && change.value.messages) {
              for (const message of change.value.messages) {
                const contact = change.value.contacts?.[0];
                await this.processIncomingMessage({
                  from: message.from,
                  contactName: contact?.profile?.name,
                  messageType: message.type,
                  text: message.text?.body,
                  location: message.location,
                  timestamp: new Date(parseInt(message.timestamp) * 1000),
                });
              }
            }
          }
        }
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Error processing webhook:', error);
      throw error;
    }
  }

  private async processIncomingMessage(data: {
    from: string;
    contactName?: string;
    messageType: string;
    text?: string;
    location?: { latitude: number; longitude: number; name?: string };
    timestamp: Date;
  }) {
    const phone = formatPhoneNumber(data.from);
    const sessionKey = `whatsapp:session:${phone}`;

    // Get or create conversation state
    let state = await this.redis.get<ConversationState>(sessionKey);

    if (!state) {
      state = {
        step: 'welcome',
        data: { phone, contactName: data.contactName },
        lastInteraction: new Date(),
      };
    }

    // Process based on current step
    let response: string;

    switch (state.step) {
      case 'welcome':
        response = await this.handleWelcome(state, data.text);
        break;

      case 'menu':
        response = await this.handleMenu(state, data.text);
        break;

      case 'new_demand_category':
        response = await this.handleNewDemandCategory(state, data.text);
        break;

      case 'new_demand_description':
        response = await this.handleNewDemandDescription(state, data.text);
        break;

      case 'new_demand_location':
        response = await this.handleNewDemandLocation(state, data.text, data.location);
        break;

      case 'new_demand_confirm':
        response = await this.handleNewDemandConfirm(state, data.text);
        break;

      case 'check_status':
        response = await this.handleCheckStatus(state, data.text);
        break;

      default:
        state.step = 'welcome';
        response = await this.handleWelcome(state, data.text);
    }

    // Save conversation state
    state.lastInteraction = new Date();
    await this.redis.set(sessionKey, state, this.SESSION_TTL);

    // Send response
    await this.sendMessage(phone, response);

    // Log interaction
    await this.logInteraction(phone, data.text || '[mídia]', response);
  }

  private async handleWelcome(state: ConversationState, text?: string): Promise<string> {
    state.step = 'menu';
    state.jaSaudou = true;
    
    // Detecta humor do usuário se houver texto
    if (text && text.length > 3) {
      state.humor = this.personality.detectarHumor(text);
    }
    
    return this.personality.gerarSaudacaoCompleta(state.data.contactName);
  }

  private async handleMenu(state: ConversationState, text?: string): Promise<string> {
    const option = text?.trim();
    
    // Detecta humor e intenção
    if (text) {
      state.humor = this.personality.detectarHumor(text);
      const intencao = this.personality.identificarIntencao(text);
      
      // Responde a intenções específicas
      if (intencao === 'obrigado') {
        return this.personality.gerarAgradecimento();
      }
      if (intencao === 'tchau') {
        state.step = 'welcome';
        return this.personality.gerarDespedida();
      }
      if (intencao === 'atendente') {
        return this.personality.gerarRespostaAtendente();
      }
    }

    switch (option) {
      case '1': {
        state.step = 'new_demand_category';
        state.data.demand = {};
        
        // Get active categories
        const secretaries = await this.prisma.secretary.findMany({
          where: { isActive: true },
          include: {
            categories: {
              where: { isActive: true },
              take: 3,
            },
          },
          take: 5,
        });

        let categoryList = `${this.personality.getConfirmacao()} Então vamos registrar sua demanda!\n\nEscolhe a categoria do problema:\n\n`;
        let index = 1;
        state.data.categoryMap = {};

        for (const secretary of secretaries) {
          categoryList += `${secretary.acronym}\n`;
          for (const category of secretary.categories) {
            categoryList += `  ${index} - ${category.name}\n`;
            state.data.categoryMap[index.toString()] = {
              categoryId: category.id,
              secretaryId: secretary.id,
              categoryName: category.name,
              secretaryName: secretary.name,
            };
            index++;
          }
          categoryList += '\n';
        }

        categoryList += '\n0 - Voltar ao menu';
        return categoryList;
      }

      case '2':
        state.step = 'check_status';
        return `Consulta de Protocolo

Me passa o número do protocolo que você recebeu quando fez a solicitação.

Exemplo: 2024-001234

0 - Voltar ao menu`;

      case '3':
        return `Sobre a SEMSUR

A SEMSUR é a Secretaria de Serviços Urbanos de Parnamirim - a gente cuida da cidade!

O que fazemos:
- Iluminação pública
- Praças e áreas verdes
- Limpeza urbana
- Manutenção de ruas e calçadas
- Poda de árvores

Fale com a gente:
Telefone: 0800-2816400 (ligação gratuita!)
Horário: Segunda a Sexta, 8h às 17h

Digita uma opção pra continuar:

1 - Registrar demanda
2 - Consultar protocolo
0 - Encerrar`;

      case '0':
        state.step = 'welcome';
        state.jaSaudou = false;
        return this.personality.gerarDespedida();

      default:
        // Verifica se é uma descrição de problema
        if (text && text.length > 15) {
          // Parece ser uma descrição - inicia demanda direta
          state.step = 'new_demand_description';
          state.data.demand = { description: text };
          
          const humor = this.personality.detectarHumor(text);
          let resposta = '';
          
          if (humor === 'muito_frustrado' || humor === 'frustrado') {
            resposta = this.personality.gerarRespostaEmpatica(humor) + '\n\n';
          }
          
          resposta += `${this.personality.getConfirmacao()} Anotei o problema.

Agora preciso saber: onde fica isso?

Me passa o endereço completo ou um ponto de referência.
Você também pode mandar sua localização pelo WhatsApp!

0 - Voltar ao menu`;
          return resposta;
        }
        
        return this.personality.gerarNaoEntendi();
    }
  }

  private async handleNewDemandCategory(state: ConversationState, text?: string): Promise<string> {
    if (text === '0') {
      state.step = 'menu';
      return this.personality.gerarMenu();
    }

    const selection = state.data.categoryMap?.[text || ''];
    if (!selection) {
      return `Hmm, não entendi essa opção...

Digita o número da categoria que você quer, ou 0 pra voltar.`;
    }

    state.data.demand = {
      ...state.data.demand,
      ...selection,
    };
    state.step = 'new_demand_description';

    return `${this.personality.getConfirmacao()} Categoria: ${selection.categoryName}
Secretaria: ${selection.secretaryName}

Agora me conta: qual é o problema? Descreve com detalhes o que tá acontecendo.

Quanto mais info você passar, mais rápido a gente resolve!

0 - Voltar ao menu`;
  }

  private async handleNewDemandDescription(state: ConversationState, text?: string): Promise<string> {
    if (text === '0') {
      state.step = 'menu';
      return this.personality.gerarMenu();
    }

    if (!text || text.length < 10) {
      return `Hmm, preciso de mais detalhes...

Me conta melhor o que tá acontecendo? Assim fica mais fácil pra equipe resolver.

0 - Voltar ao menu`;
    }

    // Detecta humor e responde com empatia
    const humor = this.personality.detectarHumor(text);
    state.humor = humor;
    
    state.data.demand.description = text;
    state.step = 'new_demand_location';
    
    let resposta = '';
    if (humor === 'muito_frustrado' || humor === 'frustrado' || humor === 'urgente') {
      resposta = this.personality.gerarRespostaEmpatica(humor) + '\n\n';
    } else {
      resposta = this.personality.getConfirmacao() + ' Anotei!\n\n';
    }

    return `${resposta}Agora preciso saber onde fica o problema.

Me passa o endereço completo ou um ponto de referência.
Tipo: "Rua das Flores, 123" ou "perto da padaria do centro"

Você também pode mandar sua localização pelo WhatsApp!

0 - Voltar ao menu`;
  }

  private async handleNewDemandLocation(
    state: ConversationState,
    text?: string,
    location?: { latitude: number; longitude: number; name?: string },
  ): Promise<string> {
    if (text === '0') {
      state.step = 'menu';
      return this.handleWelcome(state, text);
    }

    if (location) {
      state.data.demand.latitude = location.latitude;
      state.data.demand.longitude = location.longitude;
      state.data.demand.address = location.name || 'Localizacao enviada via GPS';
    } else if (text) {
      state.data.demand.address = text;
    } else {
      return `Preciso saber onde fica o problema pra gente poder enviar a equipe certa.

Me passa o endereco completo ou, se preferir, pode enviar a localizacao pelo WhatsApp mesmo - fica mais facil!

0 - Voltar ao menu`;
    }

    state.step = 'new_demand_confirm';

    return `${this.personality.getConfirmacao()} Deixa eu confirmar os dados:

Categoria: ${state.data.demand.categoryName}
Secretaria: ${state.data.demand.secretaryName}
Descricao: ${state.data.demand.description}
Local: ${state.data.demand.address}

Ta tudo certo? Confirma pra mim:

1 - Confirmar e enviar
2 - Corrigir informacoes
0 - Cancelar`;
  }

  private async handleNewDemandConfirm(state: ConversationState, text?: string): Promise<string> {
    if (text === '0' || text === '2') {
      state.step = 'menu';
      return this.handleWelcome(state, text);
    }

    if (text !== '1') {
      return `Nao entendi... Me diz ai:

1 - Confirmar e enviar
2 - Corrigir informacoes
0 - Cancelar`;
    }

    try {
      // Create the demand
      const protocol = await this.generateUniqueProtocol();
      const category = await this.prisma.category.findUnique({
        where: { id: state.data.demand.categoryId },
      });

      const demand = await this.prisma.demand.create({
        data: {
          protocol,
          title: `Demanda via WhatsApp - ${state.data.demand.categoryName}`,
          description: state.data.demand.description,
          categoryId: state.data.demand.categoryId,
          secretaryId: state.data.demand.secretaryId,
          source: DemandSource.WHATSAPP,
          requesterName: state.data.contactName,
          requesterPhone: state.data.phone,
          address: state.data.demand.address,
          latitude: state.data.demand.latitude,
          longitude: state.data.demand.longitude,
          slaDeadline: calculateSLADeadline(category?.slaDays || 15),
        },
      });

      // Create history entry
      await this.prisma.demandHistory.create({
        data: {
          demandId: demand.id,
          action: 'CREATED',
          description: 'Demanda registrada via WhatsApp',
        },
      });

      state.step = 'menu';
      delete state.data.demand;
      delete state.data.categoryMap;

      return this.personality.gerarSucessoDemanda(protocol);
    } catch (error) {
      this.logger.error('Error creating demand:', error);
      return `Xiii, deu um probleminha aqui no sistema e nao consegui registrar sua demanda agora.

Tenta de novo em alguns minutinhos? Se continuar dando erro, liga pro 156 que a galera te ajuda por la.

Desculpa o transtorno!

0 - Voltar ao menu`;
    }
  }

  private async handleCheckStatus(state: ConversationState, text?: string): Promise<string> {
    if (text === '0') {
      state.step = 'menu';
      return this.handleWelcome(state, text);
    }

    const protocol = text?.trim().toUpperCase();
    if (!protocol) {
      return `Me passa o numero do protocolo que voce recebeu quando abriu a demanda.

0 - Voltar ao menu`;
    }

    const demand = await this.prisma.demand.findUnique({
      where: { protocol },
      include: {
        category: true,
        secretary: true,
        history: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
    });

    if (!demand) {
      return `Humm, nao achei nenhuma demanda com esse protocolo...

Confere se digitou certinho? As vezes escapa uma letra ou numero.

0 - Voltar ao menu`;
    }

    const statusTexto: Record<string, string> = {
      OPEN: 'Aberta - aguardando analise',
      IN_PROGRESS: 'Em Andamento - a equipe ja ta trabalhando nisso',
      PENDING: 'Pendente - precisamos de mais alguma informacao',
      RESOLVED: 'Resolvida - ja foi atendida',
      CLOSED: 'Fechada',
      CANCELLED: 'Cancelada',
    };

    let response = `Achei! Olha so a situacao da sua demanda:

Protocolo: ${demand.protocol}
Status: ${statusTexto[demand.status] || demand.status}
Secretaria: ${demand.secretary.name}
Categoria: ${demand.category.name}
Aberta em: ${demand.createdAt.toLocaleDateString('pt-BR')}
`;

    if (demand.history.length > 0) {
      response += `\nUltimas atualizacoes:\n`;
      for (const h of demand.history) {
        response += `- ${h.createdAt.toLocaleDateString('pt-BR')}: ${h.description}\n`;
      }
    }

    response += `\nQuer consultar outro protocolo? E so digitar o numero.

0 - Voltar ao menu`;

    return response;
  }

  async sendMessage(to: string, message: string): Promise<void> {
    // Evolution API configuration
    const evolutionUrl = this.config.get<string>('EVOLUTION_API_URL');
    const evolutionKey = this.config.get<string>('EVOLUTION_API_KEY');
    const instanceName = this.config.get<string>('EVOLUTION_INSTANCE_NAME') || 'ouvidoria_parnamirim';

    if (evolutionUrl && evolutionKey) {
      try {
        // Format phone for WhatsApp (add @s.whatsapp.net if not present)
        const number = to.replace(/\D/g, '');
        
        const response = await fetch(
          `${evolutionUrl}/message/sendText/${instanceName}`,
          {
            method: 'POST',
            headers: {
              'apikey': evolutionKey,
              'Content-Type': 'application/json',
            },
            // Evolution API v1.8.x usa formato: { number, textMessage: { text } }
            body: JSON.stringify({
              number: number,
              textMessage: {
                text: message,
              },
            }),
          },
        );

        if (!response.ok) {
          const error = await response.text();
          this.logger.error(`Evolution API error: ${error}`);
        } else {
          this.logger.log(`Message sent to ${number} via Evolution API`);
        }
        return;
      } catch (error) {
        this.logger.error('Error sending via Evolution API:', error);
      }
    }

    // Fallback to Meta API
    const token = this.config.get<string>('WHATSAPP_TOKEN');
    const phoneNumberId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID');

    if (!token || !phoneNumberId) {
      this.logger.warn('WhatsApp credentials not configured');
      return;
    }

    try {
      await fetch(
        `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body: message },
          }),
        },
      );
    } catch (error) {
      this.logger.error('Error sending WhatsApp message:', error);
    }
  }

  async sendProtocolNotification(phone: string, protocol: string, status: string): Promise<void> {
    const statusMessages: Record<string, string> = {
      IN_PROGRESS: '🔵 Sua demanda está em andamento!',
      RESOLVED: '🟢 Sua demanda foi resolvida!',
      PENDING: '🟠 Sua demanda está pendente de informações adicionais.',
    };

    const message = `🏛️ *Prefeitura de Parnamirim*

📋 *Protocolo:* ${protocol}

${statusMessages[status] || `📊 Status atualizado: ${status}`}

Consulte o status completo enviando o número do protocolo para este chat.`;

    await this.sendMessage(phone, message);
  }

  private async logInteraction(phone: string, input: string, output: string): Promise<void> {
    // Log to audit
    await this.prisma.auditLog.create({
      data: {
        action: 'WHATSAPP_INTERACTION',
        entity: 'WhatsApp',
        details: {
          phone,
          input: input.substring(0, 500),
          output: output.substring(0, 500),
        },
      },
    });
  }

  private async generateUniqueProtocol(): Promise<string> {
    let protocol: string;
    let exists = true;

    while (exists) {
      protocol = generateProtocol();
      const existing = await this.prisma.demand.findUnique({
        where: { protocol },
      });
      exists = !!existing;
    }

    return protocol!;
  }

  async verifyWebhook(mode: string, token: string, challenge: string): Promise<string | null> {
    const verifyToken = this.config.get<string>('WHATSAPP_VERIFY_TOKEN');

    if (mode === 'subscribe' && token === verifyToken) {
      return challenge;
    }

    return null;
  }
}
