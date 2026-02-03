import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  IsEnum,
  IsArray,
  IsBoolean,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { DemandStatus, Priority, DemandSource } from '@prisma/client';

export class CreateDemandDto {
  @ApiProperty({ description: 'Título da demanda' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title: string;

  @ApiProperty({ description: 'Descrição detalhada da demanda' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'ID da categoria' })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ description: 'ID da secretaria responsável' })
  @IsUUID()
  @IsNotEmpty()
  secretaryId: string;

  @ApiPropertyOptional({ description: 'Prioridade', enum: Priority, default: Priority.MEDIUM })
  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @ApiPropertyOptional({ description: 'Origem da demanda', enum: DemandSource, default: DemandSource.WEB })
  @IsEnum(DemandSource)
  @IsOptional()
  source?: DemandSource;

  @ApiPropertyOptional({ description: 'Nome do solicitante' })
  @IsString()
  @IsOptional()
  requesterName?: string;

  @ApiPropertyOptional({ description: 'CPF do solicitante' })
  @IsString()
  @IsOptional()
  requesterCpf?: string;

  @ApiPropertyOptional({ description: 'E-mail do solicitante' })
  @IsString()
  @IsOptional()
  requesterEmail?: string;

  @ApiPropertyOptional({ description: 'Telefone do solicitante' })
  @IsString()
  @IsOptional()
  requesterPhone?: string;

  @ApiPropertyOptional({ description: 'Endereço completo' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: 'Bairro' })
  @IsString()
  @IsOptional()
  neighborhood?: string;

  @ApiPropertyOptional({ description: 'Latitude' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  longitude?: number;

  @ApiPropertyOptional({ description: 'Referência do local' })
  @IsString()
  @IsOptional()
  reference?: string;
}

export class UpdateDemandDto extends PartialType(CreateDemandDto) {
  @ApiPropertyOptional({ description: 'Status da demanda', enum: DemandStatus })
  @IsEnum(DemandStatus)
  @IsOptional()
  status?: DemandStatus;

  @ApiPropertyOptional({ description: 'ID do usuário atribuído' })
  @IsUUID()
  @IsOptional()
  assignedToId?: string;

  @ApiPropertyOptional({ description: 'Observações internas' })
  @IsString()
  @IsOptional()
  internalNotes?: string;

  @ApiPropertyOptional({ description: 'Prazo SLA' })
  @IsDateString()
  @IsOptional()
  slaDeadline?: string;
}

export class UpdateStatusDto {
  @ApiProperty({ description: 'Novo status', enum: DemandStatus })
  @IsEnum(DemandStatus)
  status: DemandStatus;

  @ApiPropertyOptional({ description: 'Comentário sobre a mudança de status' })
  @IsString()
  @IsOptional()
  comment?: string;
}

export class ResolveDemandDto {
  @ApiPropertyOptional({ description: 'Descrição da solução aplicada' })
  @IsString()
  @IsOptional()
  resolutionComment?: string;

  @ApiPropertyOptional({ description: 'Notificar cidadão via WhatsApp' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  notifyCitizen?: boolean;
}

export class AssignDemandDto {
  @ApiProperty({ description: 'ID do usuário a ser atribuído' })
  @IsUUID()
  assignedToId: string;
}

export class AddCommentDto {
  @ApiProperty({ description: 'Conteúdo do comentário' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: 'Comentário interno (não visível ao cidadão)' })
  @IsBoolean()
  @IsOptional()
  isInternal?: boolean;
}

export class QueryDemandsDto {
  @ApiPropertyOptional({ description: 'Página atual', default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Limite de itens por página', default: 20 })
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: 'Termo de busca (protocolo, título, descrição)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrar por status', enum: DemandStatus })
  @IsOptional()
  @IsEnum(DemandStatus)
  status?: DemandStatus;

  @ApiPropertyOptional({ description: 'Filtrar por múltiplos status' })
  @IsOptional()
  @IsArray()
  @IsEnum(DemandStatus, { each: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  statuses?: DemandStatus[];

  @ApiPropertyOptional({ description: 'Filtrar por prioridade', enum: Priority })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiPropertyOptional({ description: 'Filtrar por origem', enum: DemandSource })
  @IsOptional()
  @IsEnum(DemandSource)
  source?: DemandSource;

  @ApiPropertyOptional({ description: 'Filtrar por secretaria' })
  @IsOptional()
  @IsUUID()
  secretaryId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por categoria' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por usuário atribuído' })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por bairro' })
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @ApiPropertyOptional({ description: 'Apenas demandas vencidas' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  overdue?: boolean;

  @ApiPropertyOptional({ description: 'Data inicial de criação' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data final de criação' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Campo para ordenação' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Direção da ordenação', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

export class GeoQueryDto {
  @ApiProperty({ description: 'Latitude central' })
  @IsNumber()
  @Type(() => Number)
  latitude: number;

  @ApiProperty({ description: 'Longitude central' })
  @IsNumber()
  @Type(() => Number)
  longitude: number;

  @ApiPropertyOptional({ description: 'Raio em metros', default: 1000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  radius?: number;

  @ApiPropertyOptional({ description: 'Filtrar por status' })
  @IsOptional()
  @IsArray()
  @IsEnum(DemandStatus, { each: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  statuses?: DemandStatus[];
}

export class DemandResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  protocol: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: DemandStatus })
  status: DemandStatus;

  @ApiProperty({ enum: Priority })
  priority: Priority;

  @ApiProperty({ enum: DemandSource })
  source: DemandSource;

  @ApiProperty()
  categoryId: string;

  @ApiProperty()
  secretaryId: string;

  @ApiPropertyOptional()
  assignedToId?: string;

  @ApiPropertyOptional()
  requesterName?: string;

  @ApiPropertyOptional()
  requesterCpf?: string;

  @ApiPropertyOptional()
  requesterEmail?: string;

  @ApiPropertyOptional()
  requesterPhone?: string;

  @ApiPropertyOptional()
  address?: string;

  @ApiPropertyOptional()
  neighborhood?: string;

  @ApiPropertyOptional()
  latitude?: number;

  @ApiPropertyOptional()
  longitude?: number;

  @ApiProperty()
  slaDeadline: Date;

  @ApiPropertyOptional()
  resolvedAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
