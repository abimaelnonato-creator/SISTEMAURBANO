import { Module } from '@nestjs/common';
import { DemandsController } from './demands.controller';
import { DemandsService } from './demands.service';
import { PrismaModule } from '@/infrastructure/database/prisma.module';
import { RedisModule } from '@/infrastructure/cache/redis.module';
import { WebSocketModule } from '@/infrastructure/websocket/websocket.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { GeoModule } from '../geo/geo.module';

@Module({
  imports: [PrismaModule, RedisModule, WebSocketModule, WhatsAppModule, GeoModule],
  controllers: [DemandsController],
  providers: [DemandsService],
  exports: [DemandsService],
})
export class DemandsModule {}
