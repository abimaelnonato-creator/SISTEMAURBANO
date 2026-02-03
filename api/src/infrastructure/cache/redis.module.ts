import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from './redis.service';

const REDIS_CLIENT_PROVIDER = {
  provide: 'REDIS_CLIENT',
  useFactory: (configService: ConfigService) => {
    return new Redis({
      host: configService.get('REDIS_HOST', 'localhost'),
      port: configService.get('REDIS_PORT', 6379),
      password: configService.get('REDIS_PASSWORD', undefined),
      db: configService.get('REDIS_DB', 0),
    });
  },
  inject: [ConfigService],
};

@Global()
@Module({
  providers: [RedisService, REDIS_CLIENT_PROVIDER],
  exports: [RedisService, 'REDIS_CLIENT'],
})
export class RedisModule {}
