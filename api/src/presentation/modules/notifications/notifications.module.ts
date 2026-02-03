import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PrismaModule } from '@/infrastructure/database/prisma.module';
import { WebSocketModule } from '@/infrastructure/websocket/websocket.module';

@Module({
  imports: [PrismaModule, WebSocketModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
