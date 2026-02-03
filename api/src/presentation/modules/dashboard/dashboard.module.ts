import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PrismaModule } from '@/infrastructure/database/prisma.module';
import { RedisModule } from '@/infrastructure/cache/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
