import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { WhatsAppService } from './whatsapp.service';
import { EvolutionApiService } from './services/evolution-api.service';
import { WebhookEventDto } from './dto/webhook-event.dto';
import {
  SendTextMessageDto,
  SendMediaMessageDto,
  SendTemplateNotificationDto,
} from './dto/send-message.dto';
import { CreateInstanceDto, ConnectInstanceDto } from './dto/create-instance.dto';
import { WHATSAPP_QUEUES, WHATSAPP_EVENTS } from './constants/whatsapp.constants';
import { JwtAuthGuard } from '../../presentation/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../presentation/modules/auth/guards/roles.guard';
import { Roles } from '../../presentation/modules/auth/decorators/roles.decorator';

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name);

  constructor(
    private readonly whatsAppService: WhatsAppService,
    private readonly evolutionApi: EvolutionApiService,
    @InjectQueue(WHATSAPP_QUEUES.INCOMING) private incomingQueue: Queue,
  ) {}

  // ===== WEBHOOK (RECEBE EVENTOS DA EVOLUTION API) =====

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook para receber eventos da Evolution API' })
  @ApiResponse({ status: 200, description: 'Evento processado' })
  async handleWebhook(@Body() event: WebhookEventDto): Promise<{ received: boolean }> {
    this.logger.debug(`📥 Webhook recebido: ${event.event}`);

    // Processar eventos relevantes
    switch (event.event) {
      case WHATSAPP_EVENTS.MESSAGES_UPSERT:
        // Adicionar na fila para processamento assíncrono
        await this.incomingQueue.add('process', event, {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        });
        break;

      case WHATSAPP_EVENTS.CONNECTION_UPDATE:
        await this.whatsAppService.handleConnectionUpdate(event as any);
        break;

      case WHATSAPP_EVENTS.QRCODE_UPDATED:
        await this.whatsAppService.handleQRCodeUpdate(event as any);
        break;

      case WHATSAPP_EVENTS.MESSAGES_UPDATE:
        await this.whatsAppService.handleMessageStatusUpdate(event as any);
        break;

      case WHATSAPP_EVENTS.CALL:
        await this.whatsAppService.handleCall(event as any);
        break;

      case WHATSAPP_EVENTS.ERRORS:
        this.logger.error(`❌ Erro Evolution API: ${JSON.stringify(event.data)}`);
        break;
    }

    return { received: true };
  }

  // ===== GERENCIAMENTO DE INSTÂNCIA =====

  @Post('instance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar instância do WhatsApp' })
  async createInstance(@Body() dto: CreateInstanceDto) {
    return this.evolutionApi.createInstance(dto);
  }

  @Post('instance/connect')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Conectar instância (gerar QR Code)' })
  async connectInstance(@Body() dto: ConnectInstanceDto) {
    return this.evolutionApi.connectInstance();
  }

  @Get('instance/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verificar status da conexão' })
  async getConnectionStatus() {
    const state = await this.evolutionApi.getConnectionState();
    return {
      instance: this.evolutionApi.instance,
      connected: this.evolutionApi.connected,
      state: state.state,
    };
  }

  @Get('instance/qrcode')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter QR Code para conexão' })
  async getQRCode() {
    return this.evolutionApi.connectInstance();
  }

  @Post('instance/logout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desconectar instância' })
  async logout() {
    await this.evolutionApi.logout();
    return { success: true, message: 'Instância desconectada' };
  }

  @Post('instance/restart')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reiniciar instância' })
  async restart() {
    await this.evolutionApi.restart();
    return { success: true, message: 'Instância reiniciada' };
  }

  // ===== ENVIO DE MENSAGENS =====

  @Post('send/text')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enviar mensagem de texto' })
  async sendText(@Body() dto: SendTextMessageDto) {
    return this.evolutionApi.sendText(dto);
  }

  @Post('send/media')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enviar mídia (imagem, vídeo, áudio, documento)' })
  async sendMedia(@Body() dto: SendMediaMessageDto) {
    return this.evolutionApi.sendMedia({
      number: dto.number,
      mediatype: dto.mediaType,
      media: dto.media,
      caption: dto.caption,
      fileName: dto.fileName,
      mimetype: dto.mimetype,
    });
  }

  @Post('send/notification')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enviar notificação usando template' })
  async sendTemplateNotification(@Body() dto: SendTemplateNotificationDto) {
    return this.whatsAppService.sendTemplateNotification(
      dto.number,
      dto.template,
      dto.variables,
    );
  }

  // ===== CONVERSAS E MENSAGENS =====

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar conversas ativas' })
  async listSessions(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.whatsAppService.listSessions(page, limit);
  }

  @Get('sessions/:phone')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter mensagens de uma conversa' })
  async getSessionMessages(
    @Param('phone') phone: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.whatsAppService.getSessionMessages(phone, page, limit);
  }

  @Get('sessions/:phone/demand')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter demanda vinculada à conversa' })
  async getSessionDemand(@Param('phone') phone: string) {
    return this.whatsAppService.getSessionDemand(phone);
  }
}
