import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SlaMonitoringService } from './sla-monitoring.service';
import { PrismaModule } from '../../infrastructure/database/prisma.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
  ],
  providers: [SlaMonitoringService],
  exports: [SlaMonitoringService],
})
export class SlaModule {}
