import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger, Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { QUEUES } from '../queue.constants';

export interface NotificationJobData {
  type: 'PUSH' | 'IN_APP' | 'BROADCAST';
  userId?: string;
  userIds?: string[];
  title: string;
  message: string;
  data?: Record<string, any>;
  demandId?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}

@Injectable()
@Processor(QUEUES.NOTIFICATIONS)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<NotificationJobData>): Promise<void> {
    const { type, userId, userIds, title, message, data, demandId, priority } = job.data;

    this.logger.log(`🔔 Processing notification: ${type} - ${title}`);

    try {
      switch (type) {
        case 'PUSH':
          if (userId) {
            await this.sendPushNotification(userId, title, message, data);
          }
          break;
        case 'IN_APP':
          if (userId) {
            await this.createInAppNotification(userId, title, message, demandId, priority);
          }
          break;
        case 'BROADCAST':
          if (userIds && userIds.length > 0) {
            await this.broadcastNotification(userIds, title, message, demandId, priority);
          }
          break;
      }
    } catch (error: any) {
      this.logger.error(`Error processing notification: ${error.message}`);
      throw error;
    }
  }

  private async sendPushNotification(
    userId: string,
    title: string,
    message: string,
    data?: Record<string, any>,
  ): Promise<void> {
    // Implementation for Web Push notifications
    // Would use web-push library
    this.logger.log(`Push notification to user ${userId}: ${title}`);
  }

  private async createInAppNotification(
    userId: string,
    title: string,
    message: string,
    demandId?: string,
    priority?: string,
  ): Promise<void> {
    await this.prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type: 'info',
        data: { demandId, priority: priority || 'MEDIUM' },
      },
    });
    this.logger.log(`In-app notification created for user ${userId}`);
  }

  private async broadcastNotification(
    userIds: string[],
    title: string,
    message: string,
    demandId?: string,
    priority?: string,
  ): Promise<void> {
    const notifications = userIds.map((userId) => ({
      userId,
      title,
      message,
      type: 'info',
      data: { demandId, priority: priority || 'MEDIUM' },
    }));

    await this.prisma.notification.createMany({
      data: notifications,
    });

    this.logger.log(`Broadcast notification sent to ${userIds.length} users`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<NotificationJobData>) {
    this.logger.log(`✅ Notification job ${job.id} completed: ${job.data.title}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<NotificationJobData>, error: Error) {
    this.logger.error(`❌ Notification job ${job.id} failed: ${error.message}`);
  }
}
