import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MessageProcessorService } from '../services/message-processor.service';
import { MessagesUpsertEvent } from '../interfaces/webhook-events.interface';
import { WHATSAPP_QUEUES } from '../constants/whatsapp.constants';

@Processor(WHATSAPP_QUEUES.INCOMING)
export class IncomingMessageProcessor extends WorkerHost {
  private readonly logger = new Logger(IncomingMessageProcessor.name);

  constructor(
    private readonly messageProcessor: MessageProcessorService,
  ) {
    super();
  }

  async process(job: Job<MessagesUpsertEvent>): Promise<void> {
    this.logger.debug(`Processando mensagem: ${job.id}`);

    try {
      await this.messageProcessor.processIncoming(job.data);
      this.logger.debug(`✅ Mensagem processada: ${job.id}`);
    } catch (error) {
      this.logger.error(`❌ Erro ao processar mensagem: ${error.message}`, error.stack);
      throw error; // Permite retry
    }
  }
}
