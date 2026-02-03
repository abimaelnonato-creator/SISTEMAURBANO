import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { RedisService } from '@/infrastructure/cache/redis.service';
import { EventsGateway } from '@/infrastructure/websocket/events.gateway';
import { BaileysService } from '../whatsapp/baileys.service';
import { GeoService } from '../geo/geo.service';
import {
  CreateDemandDto,
  UpdateDemandDto,
  UpdateStatusDto,
  AddCommentDto,
  QueryDemandsDto,
  GeoQueryDto,
  ResolveDemandDto,
} from './dto/demands.dto';
import { createPaginatedResult, PaginatedResult } from '@/shared/dto/pagination.dto';
import { Demand, DemandStatus, User } from '@prisma/client';
import { generateProtocol, calculateSLADeadline } from '@/shared/utils/helpers';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DemandsService {
  private readonly logger = new Logger(DemandsService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private eventsGateway: EventsGateway,
    private baileysService: BaileysService,
    private geoService: GeoService,
  ) {}

  async findAll(query: QueryDemandsDto, user?: User): Promise<PaginatedResult<Demand>> {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      statuses,
      priority,
      source,
      secretaryId,
      categoryId,
      assignedToId,
      neighborhood,
      overdue,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Role-based filtering
    if (user) {
      if (user.role === 'OPERATOR' && user.secretaryId) {
        where.secretaryId = user.secretaryId;
      }
    }

    if (search) {
      where.OR = [
        { protocol: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { requesterName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (statuses && statuses.length > 0) {
      where.status = { in: statuses };
    }

    if (priority) {
      where.priority = priority;
    }

    if (source) {
      where.source = source;
    }

    if (secretaryId) {
      where.secretaryId = secretaryId;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    if (neighborhood) {
      where.neighborhood = { contains: neighborhood, mode: 'insensitive' };
    }

    if (overdue) {
      where.slaDeadline = { lt: new Date() };
      where.status = { notIn: ['RESOLVED', 'CLOSED', 'CANCELLED'] };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [demands, total] = await Promise.all([
      this.prisma.demand.findMany({
        where,
        skip,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder || 'desc' } : { createdAt: 'desc' },
        include: {
          category: {
            select: { id: true, name: true, color: true },
          },
          secretary: {
            select: { id: true, name: true, acronym: true, color: true },
          },
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
          createdBy: {
            select: { id: true, name: true },
          },
          _count: {
            select: {
              attachments: true,
              history: true,
              comments: true,
            },
          },
        },
      }),
      this.prisma.demand.count({ where }),
    ]);

    return createPaginatedResult(demands, total, page, limit);
  }

  async findById(id: string): Promise<Demand> {
    const demand = await this.prisma.demand.findUnique({
      where: { id },
      include: {
        category: true,
        secretary: true,
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        attachments: true,
        history: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!demand) {
      throw new NotFoundException('Demanda não encontrada');
    }

    return demand;
  }

  async findByProtocol(protocol: string): Promise<Demand> {
    const demand = await this.prisma.demand.findUnique({
      where: { protocol },
      include: {
        category: true,
        secretary: {
          select: { id: true, name: true, acronym: true, phone: true, email: true },
        },
        history: {
          include: {
            user: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!demand) {
      throw new NotFoundException('Demanda não encontrada');
    }

    return demand;
  }

  async create(createDemandDto: CreateDemandDto, userId?: string): Promise<Demand> {
    // Validate category exists and belongs to secretary
    const category = await this.prisma.category.findUnique({
      where: { id: createDemandDto.categoryId },
    });

    if (!category) {
      throw new BadRequestException('Categoria não encontrada');
    }

    if (category.secretaryId !== createDemandDto.secretaryId) {
      throw new BadRequestException('Categoria não pertence à secretaria selecionada');
    }

    // Generate unique protocol
    const protocol = await this.generateUniqueProtocol();

    // Calculate SLA deadline
    const slaDays = category.slaDays || 15;
    const slaDeadline = calculateSLADeadline(slaDays);

    // Geocodificar endereço se não tiver coordenadas
    let latitude = createDemandDto.latitude;
    let longitude = createDemandDto.longitude;
    let neighborhood = createDemandDto.neighborhood;

    if ((!latitude || !longitude) && createDemandDto.address) {
      this.logger.log(`🗺️ Geocodificando endereço: ${createDemandDto.address}`);
      try {
        const geoResult = await this.geoService.geocodeAddress(createDemandDto.address);
        if (geoResult) {
          latitude = geoResult.latitude;
          longitude = geoResult.longitude;
          neighborhood = neighborhood || geoResult.neighborhood;
          this.logger.log(`✅ Geocodificação bem-sucedida: ${latitude}, ${longitude}`);
        } else {
          this.logger.warn(`⚠️ Não foi possível geocodificar: ${createDemandDto.address}`);
        }
      } catch (error) {
        this.logger.error(`❌ Erro na geocodificação: ${error.message}`);
      }
    }

    const demand = await this.prisma.demand.create({
      data: {
        ...createDemandDto,
        latitude,
        longitude,
        neighborhood,
        protocol,
        slaDeadline,
        createdById: userId,
        source: createDemandDto.source || 'WEB',
      },
      include: {
        category: true,
        secretary: true,
      },
    });

    // Create initial history entry
    await this.prisma.demandHistory.create({
      data: {
        demandId: demand.id,
        action: 'CREATED',
        description: 'Demanda registrada no sistema',
        userId,
      },
    });

    // Notify via WebSocket
    this.eventsGateway.notifyNewDemand(demand);

    // Invalidate dashboard cache
    await this.redis.del('dashboard:summary');
    await this.redis.del(`dashboard:secretary:${demand.secretaryId}`);

    return demand;
  }

  async update(id: string, updateDemandDto: UpdateDemandDto, userId?: string): Promise<Demand> {
    const existingDemand = await this.findById(id);

    if (updateDemandDto.categoryId && updateDemandDto.categoryId !== existingDemand.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateDemandDto.categoryId },
      });

      if (!category) {
        throw new BadRequestException('Categoria não encontrada');
      }

      if (category.secretaryId !== (updateDemandDto.secretaryId || existingDemand.secretaryId)) {
        throw new BadRequestException('Categoria não pertence à secretaria selecionada');
      }
    }

    const demand = await this.prisma.demand.update({
      where: { id },
      data: updateDemandDto,
      include: {
        category: true,
        secretary: true,
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Create history entry
    await this.prisma.demandHistory.create({
      data: {
        demandId: demand.id,
        action: 'UPDATED',
        description: 'Demanda atualizada',
        metadata: updateDemandDto as any,
        userId,
      },
    });

    // Notify via WebSocket
    this.eventsGateway.notifyDemandUpdate(demand);

    return demand;
  }

  async updateStatus(id: string, updateStatusDto: UpdateStatusDto, userId?: string): Promise<Demand> {
    const existingDemand = await this.findById(id);
    const oldStatus = existingDemand.status;

    const updateData: any = { status: updateStatusDto.status };

    if (updateStatusDto.status === DemandStatus.RESOLVED) {
      updateData.resolvedAt = new Date();
    }

    const demand = await this.prisma.demand.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        secretary: true,
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Create history entry
    await this.prisma.demandHistory.create({
      data: {
        demandId: demand.id,
        action: 'STATUS_CHANGED',
        description: `Status alterado de ${oldStatus} para ${updateStatusDto.status}`,
        metadata: {
          oldStatus,
          newStatus: updateStatusDto.status,
          comment: updateStatusDto.comment,
        },
        userId,
      },
    });

    // Create comment if provided
    if (updateStatusDto.comment && userId) {
      await this.prisma.demandComment.create({
        data: {
          demandId: demand.id,
          content: updateStatusDto.comment,
          userId,
          isInternal: true,
        },
      });
    }

    // Notify via WebSocket
    this.eventsGateway.notifyStatusChange(demand, oldStatus, updateStatusDto.status);

    // Invalidate caches
    await this.redis.del('dashboard:summary');
    await this.redis.del(`dashboard:secretary:${demand.secretaryId}`);

    return demand;
  }

  async assignDemand(id: string, assignedToId: string, userId?: string): Promise<Demand> {
    const existingDemand = await this.findById(id);

    // Verify the assigned user exists
    const assignedUser = await this.prisma.user.findUnique({
      where: { id: assignedToId },
    });

    if (!assignedUser) {
      throw new BadRequestException('Usuário não encontrado');
    }

    const demand = await this.prisma.demand.update({
      where: { id },
      data: { assignedToId },
      include: {
        category: true,
        secretary: true,
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Create history entry
    await this.prisma.demandHistory.create({
      data: {
        demandId: demand.id,
        action: 'ASSIGNED',
        description: `Demanda atribuída a ${assignedUser.name}`,
        userId,
      },
    });

    // Notify via WebSocket
    this.eventsGateway.notifyAssignment(demand, assignedUser);

    return demand;
  }

  async addComment(id: string, addCommentDto: AddCommentDto, userId: string): Promise<any> {
    await this.findById(id);

    const comment = await this.prisma.demandComment.create({
      data: {
        demandId: id,
        content: addCommentDto.content,
        isInternal: addCommentDto.isInternal || false,
        userId,
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    // Create history entry
    await this.prisma.demandHistory.create({
      data: {
        demandId: id,
        action: 'COMMENT_ADDED',
        description: 'Novo comentário adicionado',
        userId,
      },
    });

    return comment;
  }

  async getHistory(id: string): Promise<any[]> {
    await this.findById(id);

    return this.prisma.demandHistory.findMany({
      where: { demandId: id },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getComments(id: string, includeInternal: boolean = false): Promise<any[]> {
    await this.findById(id);

    const where: any = { demandId: id };
    if (!includeInternal) {
      where.isInternal = false;
    }

    return this.prisma.demandComment.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findNearby(geoQuery: GeoQueryDto): Promise<Demand[]> {
    const { latitude, longitude, radius = 1000, statuses } = geoQuery;

    // Using raw SQL for PostGIS query
    const statusFilter = statuses && statuses.length > 0
      ? `AND status IN (${statuses.map(s => `'${s}'`).join(', ')})`
      : '';

    const demands = await this.prisma.$queryRawUnsafe<Demand[]>(`
      SELECT d.*, 
        ST_Distance(
          ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) as distance
      FROM "Demand" d
      WHERE latitude IS NOT NULL 
        AND longitude IS NOT NULL
        AND ST_DWithin(
          ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          $3
        )
        ${statusFilter}
      ORDER BY distance ASC
      LIMIT 100
    `, longitude, latitude, radius);

    return demands;
  }

  async getNeighborhoodStats() {
    const stats = await this.prisma.demand.groupBy({
      by: ['neighborhood'],
      _count: true,
      where: {
        neighborhood: { not: null },
      },
      orderBy: {
        _count: {
          neighborhood: 'desc',
        },
      },
      take: 20,
    });

    return stats.map(s => ({
      neighborhood: s.neighborhood,
      count: s._count,
    }));
  }

  async delete(id: string, userId: string): Promise<{ success: boolean; message: string }> {
    // Verificar se a demanda existe
    const demand = await this.prisma.demand.findUnique({
      where: { id },
      select: { id: true, protocol: true, status: true },
    });

    if (!demand) {
      throw new NotFoundException('Demanda não encontrada');
    }

    // Registrar a exclusão no histórico antes de deletar
    await this.prisma.demandHistory.create({
      data: {
        demandId: id,
        userId,
        action: 'DELETED',
        description: `Demanda ${demand.protocol} excluída`,
        previousStatus: demand.status,
      },
    });

    // Deletar a demanda (cascade delete cuida de attachments, history, comments)
    await this.prisma.demand.delete({
      where: { id },
    });

    return {
      success: true,
      message: `Demanda ${demand.protocol} excluída com sucesso`,
    };
  }

  /**
   * Resolver demanda com imagem opcional e notificação via WhatsApp
   */
  async resolveWithImage(
    id: string,
    resolveDto: ResolveDemandDto,
    userId: string,
    file?: Express.Multer.File,
  ): Promise<Demand> {
    const existingDemand = await this.findById(id);
    const oldStatus = existingDemand.status;

    // Preparar dados de atualização
    const updateData: any = {
      status: DemandStatus.RESOLVED,
      resolvedAt: new Date(),
    };

    // Se tiver imagem, salvar no disco
    let resolutionImageUrl: string | null = null;
    if (file) {
      const uploadsDir = path.join(process.cwd(), 'uploads', 'demands', id, 'resolution');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filename = `resolution_${Date.now()}_${file.originalname}`;
      const filepath = path.join(uploadsDir, filename);
      fs.writeFileSync(filepath, file.buffer);
      resolutionImageUrl = `/uploads/demands/${id}/resolution/${filename}`;

      // Salvar como anexo da demanda
      await this.prisma.attachment.create({
        data: {
          demandId: id,
          filename: file.originalname,
          url: resolutionImageUrl,
          mimeType: file.mimetype,
          size: file.size,
          type: 'IMAGE',
        },
      });
    }

    // Atualizar demanda
    const demand = await this.prisma.demand.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        secretary: true,
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Criar histórico
    await this.prisma.demandHistory.create({
      data: {
        demandId: demand.id,
        action: 'RESOLVED',
        description: `Demanda resolvida${resolveDto.resolutionComment ? `: ${resolveDto.resolutionComment}` : ''}`,
        metadata: {
          oldStatus,
          newStatus: DemandStatus.RESOLVED,
          resolutionComment: resolveDto.resolutionComment,
          resolutionImage: resolutionImageUrl,
        },
        userId,
      },
    });

    // Criar comentário se fornecido
    if (resolveDto.resolutionComment) {
      await this.prisma.demandComment.create({
        data: {
          demandId: demand.id,
          content: `✅ RESOLVIDA: ${resolveDto.resolutionComment}`,
          userId,
          isInternal: false,
        },
      });
    }

    // Notificar via WebSocket
    this.eventsGateway.notifyStatusChange(demand, oldStatus, DemandStatus.RESOLVED);

    // Notificar cidadão via WhatsApp se tiver telefone e notificação habilitada
    if (resolveDto.notifyCitizen !== false && existingDemand.requesterPhone) {
      await this.sendResolutionNotification(
        existingDemand.requesterPhone,
        demand.protocol,
        resolveDto.resolutionComment,
        file?.buffer,
      );
    }

    // Invalidar caches
    await this.redis.del('dashboard:summary');
    await this.redis.del(`dashboard:secretary:${demand.secretaryId}`);

    return demand;
  }

  /**
   * Enviar notificação de resolução via WhatsApp com imagem
   */
  private async sendResolutionNotification(
    phone: string,
    protocol: string,
    comment?: string,
    imageBuffer?: Buffer,
  ): Promise<void> {
    try {
      const message = `🏛️ *Prefeitura de Parnamirim*

✅ *SUA DEMANDA FOI RESOLVIDA!*

📋 *Protocolo:* ${protocol}
${comment ? `\n📝 *Descrição da solução:*\n${comment}` : ''}

Obrigado por contribuir com nossa cidade! 🌆

Se precisar de algo mais, estamos à disposição.`;

      // Enviar imagem com caption se houver
      if (imageBuffer) {
        const success = await this.baileysService.enviarImagem(phone, imageBuffer, message);
        if (success) {
          this.logger.log(`✅ Notificação de resolução com imagem enviada para ${phone}`);
        }
      } else {
        // Enviar só texto
        const success = await this.baileysService.enviarTexto(phone, message);
        if (success) {
          this.logger.log(`✅ Notificação de resolução enviada para ${phone}`);
        }
      }
    } catch (error) {
      this.logger.error(`❌ Erro ao enviar notificação de resolução: ${error.message}`);
    }
  }

  private async generateUniqueProtocol(): Promise<string> {
    let protocol: string;
    let exists = true;

    while (exists) {
      protocol = generateProtocol();
      const existing = await this.prisma.demand.findUnique({
        where: { protocol },
      });
      exists = !!existing;
    }

    return protocol!;
  }
}
