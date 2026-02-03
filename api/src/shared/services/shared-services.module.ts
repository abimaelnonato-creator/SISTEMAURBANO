import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { EmailService } from './email.service';
import { StorageService } from './storage.service';
import { UploadController } from './upload.controller';

@Global()
@Module({
  imports: [
    ConfigModule,
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  ],
  controllers: [UploadController],
  providers: [EmailService, StorageService],
  exports: [EmailService, StorageService],
})
export class SharedServicesModule {}
