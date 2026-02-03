import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { EvolutionApiService } from './services/evolution-api.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userName?: string;
}

@WebSocketGateway({
  namespace: '/whatsapp',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class WhatsappGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(WhatsappGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly evolutionApi: EvolutionApiService,
  ) {}

  afterInit() {
    this.logger.log('🔌 WhatsApp WebSocket Gateway inicializado');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      client.userName = payload.name;

      this.logger.log(`👤 Cliente conectado: ${client.userName} (${client.id})`);

      // Enviar status da conexão WhatsApp
      const connected = await this.evolutionApi.checkConnection();
      client.emit('connection_status', { connected });

    } catch (error) {
      this.logger.warn(`❌ Conexão rejeitada: Token inválido`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`👋 Cliente desconectado: ${client.userName || client.id}`);
  }

  @SubscribeMessage('get_status')
  async handleGetStatus(@ConnectedSocket() client: AuthenticatedSocket) {
    const connected = await this.evolutionApi.checkConnection();
    client.emit('connection_status', { connected });
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { phone: string; text: string },
  ) {
    try {
      await this.evolutionApi.sendText({
        number: data.phone,
        text: data.text,
      });

      client.emit('message_sent', { success: true, phone: data.phone });
    } catch (error: any) {
      client.emit('message_error', { error: error.message });
    }
  }

  // Métodos para broadcast de eventos
  broadcastNewMessage(message: any) {
    this.server.emit('new_message', message);
  }

  broadcastConnectionUpdate(status: { connected: boolean; state: string }) {
    this.server.emit('connection_status', status);
  }

  broadcastQRCode(qrcode: string) {
    this.server.emit('qrcode', { qrcode });
  }
}
