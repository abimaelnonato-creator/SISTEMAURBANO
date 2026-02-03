import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsBoolean, IsArray, ValidateNested, Min, Max, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendTextMessageDto {
  @ApiProperty({ 
    example: '5584999999999',
    description: 'Número do WhatsApp com código do país (sem +)'
  })
  @IsString()
  @IsNotEmpty()
  number: string;

  @ApiProperty({ example: 'Olá! Esta é uma mensagem de teste.' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiPropertyOptional({ example: 1000, description: 'Delay em ms antes de enviar' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(60000)
  delay?: number;
}

export class SendMediaMessageDto {
  @ApiProperty({ example: '5584999999999' })
  @IsString()
  @IsNotEmpty()
  number: string;

  @ApiProperty({ enum: ['image', 'video', 'audio', 'document'] })
  @IsEnum(['image', 'video', 'audio', 'document'])
  mediaType: 'image' | 'video' | 'audio' | 'document';

  @ApiProperty({ 
    example: 'https://example.com/image.jpg',
    description: 'URL da mídia ou Base64'
  })
  @IsString()
  @IsNotEmpty()
  media: string;

  @ApiPropertyOptional({ example: 'Legenda da imagem' })
  @IsString()
  @IsOptional()
  caption?: string;

  @ApiPropertyOptional({ example: 'documento.pdf' })
  @IsString()
  @IsOptional()
  fileName?: string;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsString()
  @IsOptional()
  mimetype?: string;
}

export class ButtonDto {
  @ApiProperty({ example: 'btn_sim' })
  @IsString()
  buttonId: string;

  @ApiProperty({ example: 'Sim' })
  @IsString()
  displayText: string;
}

export class SendButtonsMessageDto {
  @ApiProperty({ example: '5584999999999' })
  @IsString()
  @IsNotEmpty()
  number: string;

  @ApiProperty({ example: 'Confirmação' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Deseja confirmar o registro da sua demanda?' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: 'Prefeitura de Parnamirim' })
  @IsString()
  @IsOptional()
  footer?: string;

  @ApiProperty({ type: [ButtonDto] })
  @ValidateNested({ each: true })
  @Type(() => ButtonDto)
  @IsArray()
  buttons: ButtonDto[];
}

export class ListRowDto {
  @ApiProperty({ example: 'row_buraco' })
  @IsString()
  rowId: string;

  @ApiProperty({ example: 'Buraco na via' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Problemas de pavimentação' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class ListSectionDto {
  @ApiProperty({ example: 'Infraestrutura' })
  @IsString()
  title: string;

  @ApiProperty({ type: [ListRowDto] })
  @ValidateNested({ each: true })
  @Type(() => ListRowDto)
  @IsArray()
  rows: ListRowDto[];
}

export class SendListMessageDto {
  @ApiProperty({ example: '5584999999999' })
  @IsString()
  @IsNotEmpty()
  number: string;

  @ApiProperty({ example: 'Tipo de Problema' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Selecione o tipo de problema que deseja reportar' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'Ver opções' })
  @IsString()
  @IsNotEmpty()
  buttonText: string;

  @ApiPropertyOptional({ example: 'Ouvidoria - Parnamirim' })
  @IsString()
  @IsOptional()
  footerText?: string;

  @ApiProperty({ type: [ListSectionDto] })
  @ValidateNested({ each: true })
  @Type(() => ListSectionDto)
  @IsArray()
  sections: ListSectionDto[];
}

export class SendLocationMessageDto {
  @ApiProperty({ example: '5584999999999' })
  @IsString()
  @IsNotEmpty()
  number: string;

  @ApiProperty({ example: 'Prefeitura de Parnamirim' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Av. Brigadeiro Everaldo Breves, 1000' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: -5.9157 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: -35.2637 })
  @IsNumber()
  longitude: number;
}

export class SendTemplateNotificationDto {
  @ApiProperty({ example: '5584999999999' })
  @IsString()
  @IsNotEmpty()
  number: string;

  @ApiProperty({ 
    example: 'demand_created',
    enum: [
      'welcome',
      'demand_created',
      'demand_updated',
      'demand_resolved',
      'demand_closed',
      'request_info',
      'request_location',
      'request_photo'
    ]
  })
  @IsString()
  @IsNotEmpty()
  template: string;

  @ApiPropertyOptional({ 
    example: { protocol: 'PNM-2024-00001', category: 'Buraco' },
    description: 'Variáveis para substituir no template'
  })
  @IsObject()
  @IsOptional()
  variables?: Record<string, string>;
}
