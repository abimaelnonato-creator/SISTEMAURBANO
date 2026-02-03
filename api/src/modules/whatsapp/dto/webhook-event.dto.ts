import { IsString, IsNotEmpty, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class WebhookEventDto {
  @ApiProperty({ example: 'messages.upsert' })
  @IsString()
  @IsNotEmpty()
  event: string;

  @ApiProperty({ example: 'ouvidoria_parnamirim' })
  @IsString()
  @IsNotEmpty()
  instance: string;

  @ApiProperty()
  @IsObject()
  data: any;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  @IsString()
  @IsOptional()
  date_time?: string;

  @ApiProperty({ example: 'https://evolution.gestao.parnamirim.rn.gov.br' })
  @IsString()
  @IsOptional()
  server_url?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  apikey?: string;
}
