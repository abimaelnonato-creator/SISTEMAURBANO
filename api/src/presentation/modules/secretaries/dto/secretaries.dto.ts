import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class CreateSecretaryDto {
  @ApiProperty({ description: 'Nome da secretaria' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({ description: 'Sigla da secretaria' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  acronym: string;

  @ApiPropertyOptional({ description: 'Descrição da secretaria' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Cor de identificação (hexadecimal)' })
  @IsString()
  @IsOptional()
  @MaxLength(7)
  color?: string;

  @ApiPropertyOptional({ description: 'Ícone da secretaria' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ description: 'Telefone de contato' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'E-mail de contato' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Endereço' })
  @IsString()
  @IsOptional()
  address?: string;
}

export class UpdateSecretaryDto extends PartialType(CreateSecretaryDto) {
  @ApiPropertyOptional({ description: 'Secretaria ativa' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class QuerySecretariesDto {
  @ApiPropertyOptional({ description: 'Página atual', default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Limite de itens por página', default: 20 })
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: 'Termo de busca (nome ou sigla)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrar por status ativo/inativo' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Campo para ordenação' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Direção da ordenação', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

export class SecretaryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  acronym: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  color?: string;

  @ApiPropertyOptional()
  icon?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  address?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
