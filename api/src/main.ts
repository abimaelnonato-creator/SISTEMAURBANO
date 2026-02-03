import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import * as bodyParser from 'body-parser';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false, // Desabilitar parser padrão para usar custom
  });

  // Configurar body-parser com suporte explícito a UTF-8 (Node.js 24 fix)
  app.use(bodyParser.json({ 
    limit: '10mb',
    type: ['application/json', 'text/plain'],
  }));
  app.use(bodyParser.urlencoded({ 
    extended: true, 
    limit: '10mb',
  }));
  app.use(bodyParser.text({ 
    type: 'text/*',
    limit: '10mb',
  }));
  app.use(bodyParser.raw({ 
    type: ['application/octet-stream', 'application/*'],
    limit: '10mb',
  }));

  // Servir arquivos estáticos da pasta uploads
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Security Headers
  app.use(helmet());

  // Compression
  app.use(compression());

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // API Prefix
  app.setGlobalPrefix('api');

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Sistema de Gestão Urbana - Parnamirim/RN')
    .setDescription('API para o Sistema de Gestão Urbana da Prefeitura de Parnamirim/RN')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Autenticação e autorização')
    .addTag('Users', 'Gerenciamento de usuários')
    .addTag('Secretaries', 'Gerenciamento de secretarias')
    .addTag('Categories', 'Gerenciamento de categorias')
    .addTag('Demands', 'Gerenciamento de demandas')
    .addTag('Dashboard', 'Dados do dashboard')
    .addTag('Reports', 'Relatórios')
    .addTag('Notifications', 'Notificações')
    .addTag('WhatsApp', 'Integração WhatsApp')
    .addTag('Geo', 'Geolocalização')
    .addTag('AI', 'Classificação por IA')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  // Enhanced Startup Banner
  const banner = `
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🏛️  SISTEMA DE GESTÃO URBANA - PARNAMIRIM/RN              ║
║                                                              ║
║   📡 API:      http://localhost:${String(port).padEnd(5)}                       ║
║   📚 Swagger:  http://localhost:${String(port).padEnd(5)}/api/docs             ║
║   🔧 Versão:   1.0.0                                         ║
║   🌍 Ambiente: ${(process.env.NODE_ENV || 'development').padEnd(15)}                       ║
║                                                              ║
║   ✅ Helmet (Security Headers) ativado                       ║
║   ✅ Compression (GZIP) ativado                              ║
║   ✅ CORS configurado                                        ║
║   ✅ Validação global ativa                                  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `;
  
  logger.log(banner);
  logger.log(`🚀 Aplicação iniciada com sucesso!`);
}

bootstrap();
