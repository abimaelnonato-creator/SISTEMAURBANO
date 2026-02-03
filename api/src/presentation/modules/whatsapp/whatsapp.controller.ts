import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Res,
  Patch,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { WhatsAppService, WhatsAppWebhookPayload } from './whatsapp.service';
import { WhatsAppBotService } from './whatsapp-bot.service';
import { WhatsAppBotBaileysService } from './whatsapp-bot-baileys.service';
import { BaileysService } from './baileys.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsAppController {
  private readonly logger = new Logger('WhatsAppController');
  private readonly botService: WhatsAppBotService;

  constructor(
    private readonly whatsappService: WhatsAppService,
    botService: WhatsAppBotService,
    private readonly baileysBot: WhatsAppBotBaileysService,
    private readonly baileysService: BaileysService,
  ) {
    this.botService = botService;
  }

  @Get('webhook')
  @Public()
  @ApiExcludeEndpoint()
  async verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const result = await this.whatsappService.verifyWebhook(mode, token, challenge);

    if (result) {
      return res.status(200).send(result);
    }

    return res.status(403).send('Forbidden');
  }

  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async handleWebhook(@Body() payload: WhatsAppWebhookPayload) {
    // LOG COMPLETO DO PAYLOAD PARA DEBUG
    console.log('\n========== WEBHOOK PAYLOAD COMPLETO ==========');
    console.log(JSON.stringify(payload, null, 2));
    console.log('================================================\n');
    
    // Usar o novo bot service com suporte a mídia
    const result = await this.botService.handleWebhook(payload);
    return { status: 'ok', ...result };
  }

  @Post('send-notification')
  @ApiOperation({ summary: 'Enviar notificação via WhatsApp' })
  @ApiResponse({ status: 200, description: 'Notificação enviada' })
  async sendNotification(
    @Body() body: { phone: string; protocol: string; status: string },
  ) {
    await this.whatsappService.sendProtocolNotification(
      body.phone,
      body.protocol,
      body.status,
    );
    return { success: true };
  }

  // ============ CONTROLE DO BOT ============

  @Get('bot/status')
  @ApiOperation({ summary: 'Verificar status do bot' })
  @ApiResponse({ status: 200, description: 'Status do bot' })
  getBotStatus() {
    return WhatsAppBotService.getStatus();
  }

  @Patch('bot/ativar')
  @ApiOperation({ summary: 'Ativar o bot do WhatsApp' })
  @ApiResponse({ status: 200, description: 'Bot ativado' })
  ativarBot() {
    WhatsAppBotService.ativarBot();
    this.logger.log('Bot ativado via API');
    return { 
      success: true, 
      ativo: true,
      mensagem: 'Bot ativado com sucesso! Agora está respondendo mensagens.' 
    };
  }

  @Patch('bot/desativar')
  @ApiOperation({ summary: 'Desativar o bot do WhatsApp' })
  @ApiResponse({ status: 200, description: 'Bot desativado' })
  desativarBot() {
    WhatsAppBotService.desativarBot();
    this.logger.log('Bot desativado via API');
    return { 
      success: true, 
      ativo: false,
      mensagem: 'Bot desativado. Mensagens não serão respondidas automaticamente.' 
    };
  }

  @Patch('bot/toggle')
  @ApiOperation({ summary: 'Alternar estado do bot (ativar/desativar)' })
  @ApiResponse({ status: 200, description: 'Estado do bot alterado' })
  toggleBot() {
    const statusAtual = WhatsAppBotService.getStatus();
    
    if (statusAtual.ativo) {
      WhatsAppBotService.desativarBot();
      return { success: true, ativo: false, mensagem: 'Bot desativado' };
    } else {
      WhatsAppBotService.ativarBot();
      return { success: true, ativo: true, mensagem: 'Bot ativado' };
    }
  }

  // ============ BAILEYS BOT (CONEXÃO DIRETA) ============

  @Get('baileys/status')
  @ApiOperation({ summary: 'Status do bot Baileys (conexão direta)' })
  @ApiResponse({ status: 200, description: 'Status da conexão Baileys' })
  getBaileysStatus() {
    return this.baileysBot.getStatus();
  }

  @Patch('baileys/toggle')
  @ApiOperation({ summary: 'Ativar/desativar bot Baileys' })
  @ApiResponse({ status: 200, description: 'Estado alterado' })
  toggleBaileysBot() {
    const novoEstado = this.baileysBot.toggleBot();
    return { 
      success: true, 
      ativo: novoEstado,
      mensagem: novoEstado ? 'Bot Baileys ativado' : 'Bot Baileys desativado'
    };
  }

  @Post('baileys/reconectar')
  @ApiOperation({ summary: 'Reconectar WhatsApp (gerar novo QR Code)' })
  @ApiResponse({ status: 200, description: 'Reconexão iniciada' })
  async reconectarBaileys() {
    await this.baileysService.reconectar();
    return { 
      success: true, 
      mensagem: 'Reconexão iniciada. Escaneie o novo QR Code no terminal.'
    };
  }
}
