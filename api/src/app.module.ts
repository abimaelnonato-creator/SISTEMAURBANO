import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

// App Controller
import { AppController } from './app.controller';

// Core Modules
import { PrismaModule } from './infrastructure/database/prisma.module';
import { RedisModule } from './infrastructure/cache/redis.module';
import { QueueModule } from './infrastructure/queue/queue.module';

// Feature Modules
import { AuthModule } from './presentation/modules/auth/auth.module';
import { UsersModule } from './presentation/modules/users/users.module';
import { SecretariesModule } from './presentation/modules/secretaries/secretaries.module';
import { CategoriesModule } from './presentation/modules/categories/categories.module';
import { DemandsModule } from './presentation/modules/demands/demands.module';
import { DashboardModule } from './presentation/modules/dashboard/dashboard.module';
import { NotificationsModule } from './presentation/modules/notifications/notifications.module';
import { ReportsModule } from './presentation/modules/reports/reports.module';
import { GeoModule } from './presentation/modules/geo/geo.module';
import { WhatsAppModule } from './presentation/modules/whatsapp/whatsapp.module';
import { WebSocketModule } from './infrastructure/websocket/websocket.module';

// AI Module
import { AIModule } from './modules/ai/ai.module';
import { SecretaryModule } from './modules/secretary/secretary.module';
import { SlaModule } from './modules/sla/sla.module';

// Shared Services
import { SharedServicesModule } from './shared/services/shared-services.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 50,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 200,
      },
    ]),

    // Scheduled Tasks
    ScheduleModule.forRoot(),

    // Core Infrastructure
    PrismaModule,
    RedisModule,
    QueueModule,
    WebSocketModule,
    SharedServicesModule,

    // Feature Modules
    AuthModule,
    UsersModule,
    SecretariesModule,
    CategoriesModule,
    DemandsModule,
    DashboardModule,
    NotificationsModule,
    ReportsModule,
    GeoModule,
    WhatsAppModule,
    SecretaryModule,
    SlaModule,

    // AI Classification
    AIModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
