import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../../presentation/modules/auth/guards/jwt-auth.guard';

@ApiTags('Upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadController {
  constructor(private readonly storageService: StorageService) {}

  @Post()
  @ApiOperation({ summary: 'Upload single file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({
            fileType: /(jpg|jpeg|png|gif|pdf|doc|docx|xls|xlsx|txt|csv)$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const result = await this.storageService.uploadFile(file);
    return {
      message: 'File uploaded successfully',
      ...result,
    };
  }

  @Post('multiple')
  @ApiOperation({ summary: 'Upload multiple files' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Files uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid files' })
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  async uploadMultipleFiles(
    @UploadedFiles()
    files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    // Validate each file
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        throw new BadRequestException(`File ${file.originalname} exceeds 10MB limit`);
      }
    }

    const results = await this.storageService.uploadMultipleFiles(files);
    return {
      message: 'Files uploaded successfully',
      files: results,
    };
  }

  @Post('demand/:demandId')
  @ApiOperation({ summary: 'Upload attachment for a demand' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Attachment uploaded successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDemandAttachment(
    @Param('demandId') demandId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const result = await this.storageService.uploadFile(file, `demands/${demandId}`);
    return {
      message: 'Attachment uploaded successfully',
      demandId,
      ...result,
    };
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Delete a file' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async deleteFile(@Param('key') key: string) {
    const exists = await this.storageService.fileExists(key);
    if (!exists) {
      throw new BadRequestException('File not found');
    }

    await this.storageService.deleteFile(key);
    return { message: 'File deleted successfully' };
  }

  @Get('signed-url/:key')
  @ApiOperation({ summary: 'Get signed URL for a file' })
  @ApiResponse({ status: 200, description: 'Signed URL generated' })
  async getSignedUrl(@Param('key') key: string) {
    const exists = await this.storageService.fileExists(key);
    if (!exists) {
      throw new BadRequestException('File not found');
    }

    const signedUrl = await this.storageService.getSignedUrl(key);
    return { signedUrl };
  }
}
