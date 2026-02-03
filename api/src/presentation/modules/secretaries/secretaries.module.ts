import { Module } from '@nestjs/common';
import { SecretariesController } from './secretaries.controller';
import { SecretariesService } from './secretaries.service';
import { PrismaModule } from '@/infrastructure/database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SecretariesController],
  providers: [SecretariesService],
  exports: [SecretariesService],
})
export class SecretariesModule {}
