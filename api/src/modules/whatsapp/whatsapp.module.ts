import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';
import { WhatsappGateway } from './whatsapp.gateway';
import { EvolutionApiService } from './services/evolution-api.service';
import { MessageProcessorService } from './services/message-processor.service';
import { ConversationService } from './services/conversation.service';
import { IncomingMessageProcessor } from './processors/incoming-message.processor';

import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { WebSocketModule } from '../../infrastructure/websocket/websocket.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    WebSocketModule,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        baseURL: configService.get('EVOLUTION_API_URL'),
        headers: {
          'apikey': configService.get('EVOLUTION_API_KEY'),
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: 'whatsapp-incoming' },
      { name: 'whatsapp-outgoing' },
      { name: 'whatsapp-media' },
    ),
  ],
  controllers: [WhatsAppController],
  providers: [
    WhatsAppService,
    WhatsappGateway,
    EvolutionApiService,
    MessageProcessorService,
    ConversationService,
    IncomingMessageProcessor,
  ],
  exports: [WhatsAppService, MessageProcessorService],
})
export class WhatsAppModule {}
