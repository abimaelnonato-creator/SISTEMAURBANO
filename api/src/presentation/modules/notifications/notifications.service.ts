import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { EventsGateway } from '@/infrastructure/websocket/events.gateway';
import { createPaginatedResult, PaginatedResult } from '@/shared/dto/pagination.dto';
import { Notification } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  async findByUser(
    userId: string,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false,
  ): Promise<PaginatedResult<Notification>> {
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (unreadOnly) {
      where.readAt = null;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return createPaginatedResult(notifications, total, page, limit);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        readAt: null,
      },
    });
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notificação não encontrada');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return result.count;
  }

  async create(
    userId: string,
    title: string,
    message: string,
    type: string = 'info',
    data?: any,
  ): Promise<Notification> {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        data,
      },
    });

    // Send real-time notification via WebSocket
    this.eventsGateway.sendNotification(userId, notification);

    return notification;
  }

  async createBulk(
    userIds: string[],
    title: string,
    message: string,
    type: string = 'info',
    data?: any,
  ): Promise<number> {
    const notifications = userIds.map(userId => ({
      userId,
      title,
      message,
      type,
      data,
    }));

    const result = await this.prisma.notification.createMany({
      data: notifications,
    });

    // Send real-time notifications
    userIds.forEach(userId => {
      this.eventsGateway.sendNotification(userId, {
        title,
        message,
        type,
        data,
      });
    });

    return result.count;
  }

  async delete(id: string, userId: string): Promise<void> {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notificação não encontrada');
    }

    await this.prisma.notification.delete({ where: { id } });
  }

  async deleteAll(userId: string): Promise<number> {
    const result = await this.prisma.notification.deleteMany({
      where: { userId },
    });

    return result.count;
  }

  // Notification triggers for demand events
  async notifyDemandAssignment(demandId: string, assignedToId: string): Promise<void> {
    const demand = await this.prisma.demand.findUnique({
      where: { id: demandId },
      include: { category: true },
    });

    if (demand) {
      await this.create(
        assignedToId,
        'Nova demanda atribuída',
        `A demanda ${demand.protocol} - "${demand.title}" foi atribuída a você.`,
        'assignment',
        { demandId: demand.id, protocol: demand.protocol },
      );
    }
  }

  async notifyStatusChange(demandId: string, oldStatus: string, newStatus: string): Promise<void> {
    const demand = await this.prisma.demand.findUnique({
      where: { id: demandId },
      include: { createdBy: true },
    });

    if (demand && demand.createdById) {
      await this.create(
        demand.createdById,
        'Status da demanda atualizado',
        `A demanda ${demand.protocol} teve seu status alterado de ${oldStatus} para ${newStatus}.`,
        'status_change',
        { demandId: demand.id, protocol: demand.protocol, oldStatus, newStatus },
      );
    }
  }

  async notifySLAWarning(demandId: string): Promise<void> {
    const demand = await this.prisma.demand.findUnique({
      where: { id: demandId },
      include: { assignedTo: true },
    });

    if (demand && demand.assignedToId) {
      await this.create(
        demand.assignedToId,
        'Alerta de SLA',
        `A demanda ${demand.protocol} está próxima do vencimento do SLA.`,
        'sla_warning',
        { demandId: demand.id, protocol: demand.protocol },
      );
    }
  }
}
