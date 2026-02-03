import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger, Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUES } from '../queue.constants';

export interface WhatsAppJobData {
  type: 'SEND_MESSAGE' | 'SEND_TEMPLATE' | 'SEND_MEDIA' | 'UPDATE_STATUS';
  phone: string;
  message?: string;
  templateKey?: string;
  templateVariables?: Record<string, string>;
  mediaUrl?: string;
  mediaCaption?: string;
  demandId?: string;
}

@Injectable()
@Processor(QUEUES.WHATSAPP)
export class WhatsAppProcessor extends WorkerHost {
  private readonly logger = new Logger(WhatsAppProcessor.name);

  async process(job: Job<WhatsAppJobData>): Promise<void> {
    const { type, phone, message, templateKey, templateVariables, mediaUrl, mediaCaption } = job.data;

    this.logger.log(`📤 Processing WhatsApp job: ${type} for ${phone}`);

    try {
      switch (type) {
        case 'SEND_MESSAGE':
          await this.sendMessage(phone, message!);
          break;
        case 'SEND_TEMPLATE':
          await this.sendTemplate(phone, templateKey!, templateVariables);
          break;
        case 'SEND_MEDIA':
          await this.sendMedia(phone, mediaUrl!, mediaCaption);
          break;
        case 'UPDATE_STATUS':
          await this.sendStatusUpdate(phone, job.data.demandId!);
          break;
        default:
          this.logger.warn(`Unknown job type: ${type}`);
      }
    } catch (error: any) {
      this.logger.error(`Error processing WhatsApp job: ${error.message}`);
      throw error; // Re-throw to trigger retry
    }
  }

  private async sendMessage(phone: string, message: string): Promise<void> {
    // This will be implemented by injecting EvolutionApiService
    // For now, log the action
    this.logger.log(`Sending message to ${phone}: ${message.substring(0, 50)}...`);
    // Implementation: await this.evolutionApi.sendMessage(phone, message);
  }

  private async sendTemplate(
    phone: string,
    templateKey: string,
    variables?: Record<string, string>,
  ): Promise<void> {
    this.logger.log(`Sending template ${templateKey} to ${phone}`);
    // Implementation: await this.whatsappService.sendTemplateNotification(phone, templateKey, variables);
  }

  private async sendMedia(phone: string, mediaUrl: string, caption?: string): Promise<void> {
    this.logger.log(`Sending media to ${phone}: ${mediaUrl}`);
    // Implementation: await this.evolutionApi.sendMedia(phone, mediaUrl, caption);
  }

  private async sendStatusUpdate(phone: string, demandId: string): Promise<void> {
    this.logger.log(`Sending status update for demand ${demandId} to ${phone}`);
    // Implementation: Fetch demand, format message, send via evolutionApi
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<WhatsAppJobData>) {
    this.logger.log(`✅ WhatsApp job ${job.id} completed for ${job.data.phone}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<WhatsAppJobData>, error: Error) {
    this.logger.error(
      `❌ WhatsApp job ${job.id} failed for ${job.data.phone}: ${error.message}`,
    );
  }
}
