import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Transform, Type } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty({ description: 'Nome completo do usuário' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'E-mail do usuário' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Senha do usuário', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: 'Papel/função do usuário', enum: Role })
  @IsEnum(Role)
  role: Role;

  @ApiPropertyOptional({ description: 'ID da secretaria vinculada' })
  @IsUUID()
  @IsOptional()
  secretaryId?: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ description: 'Usuário ativo' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateRoleDto {
  @ApiProperty({ description: 'Novo papel/função do usuário', enum: Role })
  @IsEnum(Role)
  role: Role;
}

export class QueryUsersDto {
  @ApiPropertyOptional({ description: 'Página atual', default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Limite de itens por página', default: 20 })
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: 'Termo de busca (nome ou e-mail)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrar por papel/função', enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

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

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  secretaryId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  lastLogin?: Date;
}
