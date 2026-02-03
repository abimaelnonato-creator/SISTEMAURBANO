import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppBotService } from './whatsapp-bot.service';
import { BaileysService } from './baileys.service';
import { WhatsAppBotBaileysService } from './whatsapp-bot-baileys.service';
import { GeminiService } from './gemini/gemini.service';
import { MediaService } from './media/media.service';
import { PrismaModule } from '@/infrastructure/database/prisma.module';
import { RedisModule } from '@/infrastructure/cache/redis.module';
import { WebSocketModule } from '@/infrastructure/websocket/websocket.module';

@Module({
  imports: [PrismaModule, RedisModule, ConfigModule, WebSocketModule],
  controllers: [WhatsAppController],
  providers: [
    WhatsAppService, 
    WhatsAppBotService,
    BaileysService,
    WhatsAppBotBaileysService,
    GeminiService,
    MediaService,
  ],
  exports: [WhatsAppService, WhatsAppBotService, BaileysService, WhatsAppBotBaileysService],
})
export class WhatsAppModule {}
