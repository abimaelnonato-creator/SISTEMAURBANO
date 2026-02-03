import { Module } from '@nestjs/common'
import { SecretaryService } from './secretary.service'
import { SecretaryController } from './secretary.controller'
import { PrismaModule } from '@/infrastructure/database/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [SecretaryController],
  providers: [SecretaryService],
  exports: [SecretaryService],
})
export class SecretaryModule {}
