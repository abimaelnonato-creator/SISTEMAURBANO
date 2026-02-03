import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from './infrastructure/database/prisma.service';
import Redis from 'ioredis';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check e informações da API' })
  getInfo() {
    return {
      name: 'Sistema de Gestão Urbana - Parnamirim/RN',
      version: '1.0.0',
      status: 'online',
      timestamp: new Date().toISOString(),
      endpoints: {
        docs: '/api/docs',
        auth: '/api/auth',
        users: '/api/users',
        secretaries: '/api/secretaries',
        categories: '/api/categories',
        demands: '/api/demands',
        dashboard: '/api/dashboard',
        notifications: '/api/notifications',
        reports: '/api/reports',
        geo: '/api/geo',
        whatsapp: '/api/whatsapp',
      },
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check simples - para load balancers' })
  @ApiResponse({ status: 200, description: 'API está saudável' })
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check - verifica banco e redis' })
  @ApiResponse({ status: 200, description: 'API pronta para receber tráfego' })
  @ApiResponse({ status: 503, description: 'Serviço não está pronto' })
  async readinessCheck() {
    const checks = {
      database: false,
      redis: false,
    };

    try {
      // Check database connection
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch (error) {
      console.error('Database check failed:', error);
    }

    try {
      // Check Redis connection
      const pong = await this.redis.ping();
      checks.redis = pong === 'PONG';
    } catch (error) {
      console.error('Redis check failed:', error);
    }

    const allHealthy = checks.database && checks.redis;

    return {
      status: allHealthy ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks,
    };
  }
}
