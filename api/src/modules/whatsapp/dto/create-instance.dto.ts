import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInstanceDto {
  @ApiProperty({ 
    example: 'ouvidoria_parnamirim',
    description: 'Nome único da instância (sem espaços ou caracteres especiais)'
  })
  @IsString()
  @IsNotEmpty()
  instanceName: string;

  @ApiPropertyOptional({ 
    example: '5584999999999',
    description: 'Número do WhatsApp para conectar (opcional - pode conectar depois via QR Code)'
  })
  @IsString()
  @IsOptional()
  number?: string;

  @ApiPropertyOptional({ 
    example: true,
    default: true,
    description: 'Gerar QR Code automaticamente'
  })
  @IsBoolean()
  @IsOptional()
  qrcode?: boolean;
}

export class ConnectInstanceDto {
  @ApiPropertyOptional({ 
    example: '5584999999999',
    description: 'Número do WhatsApp (opcional)'
  })
  @IsString()
  @IsOptional()
  number?: string;
}
