import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AIClassificationService } from './ai-classification.service';
import { PrismaModule } from '../../infrastructure/database/prisma.module';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    PrismaModule,
  ],
  providers: [AIClassificationService],
  exports: [AIClassificationService],
})
export class AIModule {}
