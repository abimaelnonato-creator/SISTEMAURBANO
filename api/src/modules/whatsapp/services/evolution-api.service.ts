import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import {
  EvolutionInstance,
  CreateInstancePayload,
  QRCodeResponse,
  ConnectionState,
  SendTextPayload,
  SendMediaPayload,
  SendButtonsPayload,
  SendListPayload,
  SendLocationPayload,
  MessageResponse,
} from '../interfaces/evolution-api.interface';

@Injectable()
export class EvolutionApiService implements OnModuleInit {
  private readonly logger = new Logger(EvolutionApiService.name);
  private readonly instanceName: string;
  private isConnected = false;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.instanceName = this.configService.get('EVOLUTION_INSTANCE_NAME', 'ouvidoria_parnamirim');
  }

  async onModuleInit() {
    try {
      await this.checkConnection();
      this.logger.log('✅ Evolution API conectada com sucesso');
    } catch (error) {
      this.logger.warn('⚠️ Evolution API não disponível. Tentando reconectar...');
    }
  }

  // ===== GERENCIAMENTO DE INSTÂNCIA =====

  async createInstance(payload?: Partial<CreateInstancePayload>): Promise<EvolutionInstance> {
    const webhookUrl = this.configService.get('EVOLUTION_WEBHOOK_URL', 'http://api:3000/whatsapp/webhook');
    
    const data: CreateInstancePayload = {
      instanceName: this.instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
      webhook: {
        url: webhookUrl,
        byEvents: true,
        base64: true,
        events: [
          'APPLICATION_STARTUP',
          'QRCODE_UPDATED',
          'CONNECTION_UPDATE',
          'MESSAGES_UPSERT',
          'MESSAGES_UPDATE',
          'SEND_MESSAGE',
          'CALL',
        ],
      },
      settings: {
        rejectCall: true,
        msgCall: 'Desculpe, não recebemos chamadas. Por favor, envie uma mensagem de texto.',
        groupsIgnore: true,
        alwaysOnline: true,
        readMessages: true,
        readStatus: false,
        syncFullHistory: false,
      },
      ...payload,
    };

    const response: AxiosResponse<EvolutionInstance> = await firstValueFrom(
      this.httpService.post<EvolutionInstance>('/instance/create', data),
    );

    this.logger.log(`✅ Instância "${this.instanceName}" criada com sucesso`);
    return response.data;
  }

  async connectInstance(): Promise<QRCodeResponse> {
    const response: AxiosResponse<QRCodeResponse> = await firstValueFrom(
      this.httpService.get<QRCodeResponse>(`/instance/connect/${this.instanceName}`),
    );

    this.logger.log('📱 QR Code gerado. Aguardando leitura...');
    return response.data;
  }

  async getConnectionState(): Promise<ConnectionState> {
    const response: AxiosResponse<ConnectionState> = await firstValueFrom(
      this.httpService.get<ConnectionState>(`/instance/connectionState/${this.instanceName}`),
    );

    this.isConnected = response.data.state === 'open';
    return response.data;
  }

  async checkConnection(): Promise<boolean> {
    try {
      const state = await this.getConnectionState();
      return state.state === 'open';
    } catch {
      return false;
    }
  }

  async logout(): Promise<void> {
    await firstValueFrom(
      this.httpService.delete(`/instance/logout/${this.instanceName}`),
    );
    this.isConnected = false;
    this.logger.log('📴 Instância desconectada');
  }

  async restart(): Promise<void> {
    await firstValueFrom(
      this.httpService.post(`/instance/restart/${this.instanceName}`),
    );
    this.logger.log('🔄 Instância reiniciada');
  }

  // ===== ENVIO DE MENSAGENS =====

  async sendText(payload: SendTextPayload): Promise<MessageResponse> {
    // Evolution API v1.8.x usa formato diferente: { number, textMessage: { text } }
    const evolutionPayload = {
      number: payload.number,
      textMessage: {
        text: payload.text,
      },
      delay: payload.delay,
    };

    const response: AxiosResponse<MessageResponse> = await firstValueFrom(
      this.httpService.post<MessageResponse>(
        `/message/sendText/${this.instanceName}`,
        evolutionPayload,
      ),
    );
    return response.data;
  }

  async sendMedia(payload: SendMediaPayload): Promise<MessageResponse> {
    const response: AxiosResponse<MessageResponse> = await firstValueFrom(
      this.httpService.post<MessageResponse>(
        `/message/sendMedia/${this.instanceName}`,
        payload,
      ),
    );
    return response.data;
  }

  async sendButtons(payload: SendButtonsPayload): Promise<MessageResponse> {
    const response: AxiosResponse<MessageResponse> = await firstValueFrom(
      this.httpService.post<MessageResponse>(
        `/message/sendButtons/${this.instanceName}`,
        payload,
      ),
    );
    return response.data;
  }

  async sendList(payload: SendListPayload): Promise<MessageResponse> {
    const response: AxiosResponse<MessageResponse> = await firstValueFrom(
      this.httpService.post<MessageResponse>(
        `/message/sendList/${this.instanceName}`,
        payload,
      ),
    );
    return response.data;
  }

  async sendLocation(payload: SendLocationPayload): Promise<MessageResponse> {
    const response: AxiosResponse<MessageResponse> = await firstValueFrom(
      this.httpService.post<MessageResponse>(
        `/message/sendLocation/${this.instanceName}`,
        payload,
      ),
    );
    return response.data;
  }

  // ===== LEITURA E PRESENÇA =====

  async markAsRead(remoteJid: string, messageId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(`/chat/markMessageAsRead/${this.instanceName}`, {
          readMessages: [{ remoteJid, id: messageId }],
        }),
      );
    } catch (error: any) {
      this.logger.warn(`Erro ao marcar como lida: ${error.message}`);
    }
  }

  async sendPresence(remoteJid: string, presence: 'composing' | 'recording' | 'paused'): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(`/chat/sendPresence/${this.instanceName}`, {
          number: remoteJid,
          presence,
        }),
      );
    } catch (error: any) {
      this.logger.warn(`Erro ao enviar presença: ${error.message}`);
    }
  }

  // ===== GETTERS =====

  get instance(): string {
    return this.instanceName;
  }

  get connected(): boolean {
    return this.isConnected;
  }
}
