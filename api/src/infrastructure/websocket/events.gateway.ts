import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  secretaryId?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
    credentials: true,
  },
  namespace: '/events',
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);
  private connectedClients = new Map<string, AuthenticatedSocket>();

  constructor(private jwtService: JwtService) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token || 
                    client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (token) {
        const payload = await this.jwtService.verifyAsync(token);
        client.userId = payload.sub;
        client.secretaryId = payload.secretaryId;
        this.connectedClients.set(client.id, client);
        this.logger.log(`Client connected: ${client.id} (User: ${client.userId})`);
      } else {
        this.logger.warn(`Unauthenticated connection attempt: ${client.id}`);
        client.disconnect();
      }
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Subscribe to demand updates
  @SubscribeMessage('subscribe:demands')
  handleSubscribeDemands(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { secretaryId?: string },
  ) {
    const room = data.secretaryId 
      ? `demands:secretary:${data.secretaryId}` 
      : 'demands:all';
    client.join(room);
    this.logger.log(`Client ${client.id} subscribed to ${room}`);
    return { event: 'subscribed', data: { room } };
  }

  // Subscribe to specific secretary updates
  @SubscribeMessage('subscribe:secretary')
  handleSubscribeSecretary(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { secretaryId: string },
  ) {
    const room = `secretary:${data.secretaryId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} subscribed to ${room}`);
    return { event: 'subscribed', data: { room } };
  }

  // Unsubscribe from room
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { room: string },
  ) {
    client.leave(data.room);
    this.logger.log(`Client ${client.id} unsubscribed from ${data.room}`);
    return { event: 'unsubscribed', data: { room: data.room } };
  }

  // Emit methods for use by other services
  emitDemandCreated(demand: any) {
    this.server.to('demands:all').emit('demand:created', demand);
    if (demand.secretaryId) {
      this.server
        .to(`demands:secretary:${demand.secretaryId}`)
        .emit('demand:created', demand);
    }
  }

  emitDemandUpdated(demand: any) {
    this.server.to('demands:all').emit('demand:updated', demand);
    if (demand.secretaryId) {
      this.server
        .to(`demands:secretary:${demand.secretaryId}`)
        .emit('demand:updated', demand);
    }
  }

  emitDemandAssigned(demand: any, assignedToId: string) {
    this.server.to('demands:all').emit('demand:assigned', demand);
    
    // Notify specific user
    for (const [, socket] of this.connectedClients) {
      if (socket.userId === assignedToId) {
        socket.emit('demand:assigned', demand);
      }
    }
  }

  emitNotification(userId: string, notification: any) {
    for (const [, socket] of this.connectedClients) {
      if (socket.userId === userId) {
        socket.emit('notification:new', notification);
      }
    }
  }

  emitStatsUpdated(stats: any) {
    this.server.emit('stats:updated', stats);
  }

  emitWhatsAppMessage(sessionId: string, message: any) {
    this.server.emit('whatsapp:message', { sessionId, message });
  }

  // Get connected clients count
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  // Get connected clients by secretary
  getConnectedClientsBySecretary(secretaryId: string): number {
    let count = 0;
    for (const [, socket] of this.connectedClients) {
      if (socket.secretaryId === secretaryId) {
        count++;
      }
    }
    return count;
  }

  // Alias methods for service compatibility
  notifyNewDemand(demand: any) {
    this.emitDemandCreated(demand);
  }

  notifyDemandUpdate(demand: any) {
    this.emitDemandUpdated(demand);
  }

  notifyStatusChange(demand: any, oldStatus: string, newStatus: string) {
    this.server.to('demands:all').emit('demand:status-changed', {
      demand,
      oldStatus,
      newStatus,
    });
    if (demand.secretaryId) {
      this.server
        .to(`demands:secretary:${demand.secretaryId}`)
        .emit('demand:status-changed', { demand, oldStatus, newStatus });
    }
  }

  notifyAssignment(demand: any, assignedUser: any) {
    this.emitDemandAssigned(demand, assignedUser?.id);
  }

  sendNotification(userId: string, notification: any) {
    this.emitNotification(userId, notification);
  }
}
