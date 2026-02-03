import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';
import { WhatsAppProcessor } from './processors/whatsapp.processor';
import { NotificationProcessor } from './processors/notification.processor';
import { AIClassificationProcessor } from './processors/ai-classification.processor';
import { EmailProcessor } from './processors/email.processor';
import { SLACheckProcessor } from './processors/sla-check.processor';
import { PrismaModule } from '../database/prisma.module';
import { QUEUES } from './queue.constants';

@Global()
@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
          db: configService.get('REDIS_QUEUE_DB', 1),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: 100,
          removeOnFail: 1000,
        },
      }),
    }),
    // Register all queues
    BullModule.registerQueue(
      { name: QUEUES.WHATSAPP },
      { name: QUEUES.NOTIFICATIONS },
      { name: QUEUES.EMAIL },
      { name: QUEUES.AI_CLASSIFICATION },
      { name: QUEUES.FILE_PROCESSING },
      { name: QUEUES.SLA_CHECK },
    ),
  ],
  providers: [
    QueueService,
    WhatsAppProcessor,
    NotificationProcessor,
    AIClassificationProcessor,
    EmailProcessor,
    SLACheckProcessor,
  ],
  exports: [BullModule, QueueService],
})
export class QueueModule {}
