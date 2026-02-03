import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUES } from './queue.constants';
import { WhatsAppJobData } from './processors/whatsapp.processor';
import { NotificationJobData } from './processors/notification.processor';
import { AIClassificationJobData } from './processors/ai-classification.processor';
import { EmailJobData } from './processors/email.processor';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue(QUEUES.WHATSAPP) private readonly whatsappQueue: Queue,
    @InjectQueue(QUEUES.NOTIFICATIONS) private readonly notificationQueue: Queue,
    @InjectQueue(QUEUES.EMAIL) private readonly emailQueue: Queue,
    @InjectQueue(QUEUES.AI_CLASSIFICATION) private readonly aiQueue: Queue,
    @InjectQueue(QUEUES.SLA_CHECK) private readonly slaQueue: Queue,
  ) {}

  // ==================== WHATSAPP ====================

  async sendWhatsAppMessage(phone: string, message: string): Promise<string> {
    const job = await this.whatsappQueue.add('send-message', {
      type: 'SEND_MESSAGE',
      phone,
      message,
    } as WhatsAppJobData);
    this.logger.log(`📤 WhatsApp message queued: ${job.id}`);
    return job.id!;
  }

  async sendWhatsAppTemplate(
    phone: string,
    templateKey: string,
    variables?: Record<string, string>,
  ): Promise<string> {
    const job = await this.whatsappQueue.add('send-template', {
      type: 'SEND_TEMPLATE',
      phone,
      templateKey,
      templateVariables: variables,
    } as WhatsAppJobData);
    this.logger.log(`📤 WhatsApp template queued: ${job.id}`);
    return job.id!;
  }

  async sendWhatsAppStatusUpdate(phone: string, demandId: string): Promise<string> {
    const job = await this.whatsappQueue.add('status-update', {
      type: 'UPDATE_STATUS',
      phone,
      demandId,
    } as WhatsAppJobData);
    this.logger.log(`📤 WhatsApp status update queued: ${job.id}`);
    return job.id!;
  }

  // ==================== NOTIFICATIONS ====================

  async sendPushNotification(
    userId: string,
    title: string,
    message: string,
    data?: Record<string, any>,
  ): Promise<string> {
    const job = await this.notificationQueue.add('push', {
      type: 'PUSH',
      userId,
      title,
      message,
      data,
    } as NotificationJobData);
    this.logger.log(`🔔 Push notification queued: ${job.id}`);
    return job.id!;
  }

  async createInAppNotification(
    userId: string,
    title: string,
    message: string,
    demandId?: string,
    priority?: 'LOW' | 'MEDIUM' | 'HIGH',
  ): Promise<string> {
    const job = await this.notificationQueue.add('in-app', {
      type: 'IN_APP',
      userId,
      title,
      message,
      demandId,
      priority,
    } as NotificationJobData);
    this.logger.log(`🔔 In-app notification queued: ${job.id}`);
    return job.id!;
  }

  async broadcastNotification(
    userIds: string[],
    title: string,
    message: string,
    demandId?: string,
  ): Promise<string> {
    const job = await this.notificationQueue.add('broadcast', {
      type: 'BROADCAST',
      userIds,
      title,
      message,
      demandId,
    } as NotificationJobData);
    this.logger.log(`🔔 Broadcast notification queued: ${job.id}`);
    return job.id!;
  }

  // ==================== EMAIL ====================

  async sendEmail(data: EmailJobData): Promise<string> {
    const job = await this.emailQueue.add('send-email', data);
    this.logger.log(`📧 Email queued: ${job.id}`);
    return job.id!;
  }

  async sendWelcomeEmail(email: string, name: string): Promise<string> {
    return this.sendEmail({
      to: email,
      subject: 'Bem-vindo ao Sistema de Gestão Urbana - Parnamirim',
      html: `
        <h1>Bem-vindo, ${name}!</h1>
        <p>Sua conta no Sistema de Gestão Urbana de Parnamirim foi criada com sucesso.</p>
        <p>Acesse o sistema para começar a utilizar.</p>
        <br>
        <p>Atenciosamente,</p>
        <p>Prefeitura Municipal de Parnamirim</p>
      `,
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<string> {
    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
    return this.sendEmail({
      to: email,
      subject: 'Recuperação de Senha - Sistema de Gestão Urbana',
      html: `
        <h1>Recuperação de Senha</h1>
        <p>Você solicitou a recuperação de senha.</p>
        <p>Clique no link abaixo para redefinir sua senha:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>Este link expira em 1 hora.</p>
        <p>Se você não solicitou esta recuperação, ignore este email.</p>
      `,
    });
  }

  // ==================== AI CLASSIFICATION ====================

  async classifyDemand(
    demandId: string,
    text: string,
    options?: { imageUrls?: string[]; autoAssign?: boolean },
  ): Promise<string> {
    const job = await this.aiQueue.add('classify', {
      demandId,
      text,
      imageUrls: options?.imageUrls,
      autoAssign: options?.autoAssign ?? true,
    } as AIClassificationJobData);
    this.logger.log(`🤖 AI classification queued: ${job.id}`);
    return job.id!;
  }

  // ==================== SLA CHECK ====================

  async scheduleSLACheck(): Promise<void> {
    // Add a repeatable job that runs every 15 minutes
    await this.slaQueue.add(
      'check-sla',
      {},
      {
        repeat: {
          every: 15 * 60 * 1000, // 15 minutes
        },
        jobId: 'sla-check-scheduled',
      },
    );
    this.logger.log('⏰ SLA check scheduled (every 15 minutes)');
  }

  async runSLACheckNow(): Promise<string> {
    const job = await this.slaQueue.add('check-sla-now', {});
    this.logger.log(`⏰ SLA check triggered: ${job.id}`);
    return job.id!;
  }

  // ==================== QUEUE MANAGEMENT ====================

  async getQueueStats(): Promise<Record<string, any>> {
    const queues = [
      { name: 'whatsapp', queue: this.whatsappQueue },
      { name: 'notifications', queue: this.notificationQueue },
      { name: 'email', queue: this.emailQueue },
      { name: 'ai', queue: this.aiQueue },
      { name: 'sla', queue: this.slaQueue },
    ];

    const stats: Record<string, any> = {};

    for (const { name, queue } of queues) {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
      ]);

      stats[name] = { waiting, active, completed, failed, delayed };
    }

    return stats;
  }

  async clearQueue(queueName: keyof typeof QUEUES): Promise<void> {
    const queueMap: Record<string, Queue> = {
      WHATSAPP: this.whatsappQueue,
      NOTIFICATIONS: this.notificationQueue,
      EMAIL: this.emailQueue,
      AI_CLASSIFICATION: this.aiQueue,
      SLA_CHECK: this.slaQueue,
    };

    const queue = queueMap[queueName];
    if (queue) {
      await queue.obliterate({ force: true });
      this.logger.warn(`🗑️ Queue ${queueName} cleared`);
    }
  }
}
