import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsUUID,
  IsNumber,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Nome da categoria' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ description: 'Descrição da categoria' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'ID da secretaria responsável' })
  @IsUUID()
  @IsNotEmpty()
  secretaryId: string;

  @ApiPropertyOptional({ description: 'Prazo SLA em dias', default: 15 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  slaDays?: number;

  @ApiPropertyOptional({ description: 'Cor de identificação (hexadecimal)' })
  @IsString()
  @IsOptional()
  @MaxLength(7)
  color?: string;

  @ApiPropertyOptional({ description: 'Ícone da categoria' })
  @IsString()
  @IsOptional()
  icon?: string;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
  @ApiPropertyOptional({ description: 'Categoria ativa' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class QueryCategoriesDto {
  @ApiPropertyOptional({ description: 'Página atual', default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Limite de itens por página', default: 20 })
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: 'Termo de busca (nome)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrar por secretaria' })
  @IsOptional()
  @IsUUID()
  secretaryId?: string;

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

export class CategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  secretaryId: string;

  @ApiPropertyOptional()
  slaDays?: number;

  @ApiPropertyOptional()
  color?: string;

  @ApiPropertyOptional()
  icon?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
