import { Module } from '@nestjs/common';
import { GeoController } from './geo.controller';
import { GeoService } from './geo.service';
import { PrismaModule } from '@/infrastructure/database/prisma.module';
import { RedisModule } from '@/infrastructure/cache/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [GeoController],
  providers: [GeoService],
  exports: [GeoService],
})
export class GeoModule {}
