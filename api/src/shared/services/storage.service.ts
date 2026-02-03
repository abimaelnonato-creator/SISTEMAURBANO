import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private minioClient: Minio.Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get('MINIO_ENDPOINT', 'localhost'),
      port: this.configService.get('MINIO_PORT', 9000),
      useSSL: this.configService.get('MINIO_USE_SSL', 'false') === 'true',
      accessKey: this.configService.get('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: this.configService.get('MINIO_SECRET_KEY', 'minioadmin'),
    });

    this.bucketName = this.configService.get('MINIO_BUCKET', 'parnamirim-uploads');
  }

  async onModuleInit() {
    await this.ensureBucketExists();
  }

  private async ensureBucketExists(): Promise<void> {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        this.logger.log(`Bucket '${this.bucketName}' created successfully`);

        // Set bucket policy to allow public read for attachments
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucketName}/public/*`],
            },
          ],
        };
        await this.minioClient.setBucketPolicy(this.bucketName, JSON.stringify(policy));
      }
    } catch (error) {
      this.logger.error('Error ensuring bucket exists:', error);
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'attachments',
  ): Promise<{
    url: string;
    key: string;
    originalName: string;
    mimeType: string;
    size: number;
  }> {
    const timestamp = Date.now();
    const safeFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `${folder}/${timestamp}-${safeFileName}`;

    await this.minioClient.putObject(
      this.bucketName,
      key,
      file.buffer,
      file.size,
      { 'Content-Type': file.mimetype },
    );

    const baseUrl = this.configService.get('MINIO_PUBLIC_URL', `http://localhost:9000`);
    const url = `${baseUrl}/${this.bucketName}/${key}`;

    return {
      url,
      key,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: string = 'attachments',
  ): Promise<
    Array<{
      url: string;
      key: string;
      originalName: string;
      mimeType: string;
      size: number;
    }>
  > {
    const uploadPromises = files.map((file) => this.uploadFile(file, folder));
    return Promise.all(uploadPromises);
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.bucketName, key);
      this.logger.log(`File '${key}' deleted successfully`);
    } catch (error) {
      this.logger.error(`Error deleting file '${key}':`, error);
      throw error;
    }
  }

  async getSignedUrl(key: string, expirySeconds: number = 3600): Promise<string> {
    return this.minioClient.presignedGetObject(this.bucketName, key, expirySeconds);
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      await this.minioClient.statObject(this.bucketName, key);
      return true;
    } catch {
      return false;
    }
  }
}
