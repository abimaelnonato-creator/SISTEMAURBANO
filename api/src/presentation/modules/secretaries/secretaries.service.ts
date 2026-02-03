import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { CreateSecretaryDto, UpdateSecretaryDto, QuerySecretariesDto } from './dto/secretaries.dto';
import { createPaginatedResult, PaginatedResult } from '@/shared/dto/pagination.dto';
import { DemandStatus, Priority, Secretary, Prisma } from '@prisma/client';
import { slugify } from '@/shared/utils/helpers';

type SecretaryWithCounts = Secretary & {
  _count: {
    users: number;
    categories: number;
    demands: number;
  };
};

@Injectable()
export class SecretariesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QuerySecretariesDto): Promise<PaginatedResult<Secretary>> {
    const { page = 1, limit = 20, search, isActive, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SecretaryWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { acronym: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [secretaries, total] = await Promise.all([
      this.prisma.secretary.findMany({
        where,
        skip,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder || 'asc' } : { name: 'asc' },
        include: {
          _count: {
            select: {
              users: true,
              categories: true,
              demands: true,
            },
          },
        },
      }),
      this.prisma.secretary.count({ where }),
    ]);

    return createPaginatedResult(secretaries, total, page, limit);
  }

  async findByCode(code: string): Promise<SecretaryWithCounts> {
    const secretary = await this.prisma.secretary.findFirst({
      where: {
        OR: [{ slug: code }, { acronym: code }],
      },
      include: {
        categories: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
        users: {
          where: { isActive: true },
          select: { id: true, name: true, email: true, role: true },
        },
        _count: {
          select: {
            users: true,
            categories: true,
            demands: true,
          },
        },
      },
    });

    if (!secretary) {
      throw new NotFoundException('Secretaria não encontrada');
    }

    return secretary;
  }

  async findById(id: string): Promise<SecretaryWithCounts> {
    const secretary = await this.prisma.secretary.findUnique({
      where: { id },
      include: {
        categories: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
        users: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            users: true,
            categories: true,
            demands: true,
          },
        },
      },
    });

    if (!secretary) {
      throw new NotFoundException('Secretaria não encontrada');
    }

    return secretary;
  }

  async findBySlug(slug: string): Promise<Secretary> {
    const secretary = await this.prisma.secretary.findUnique({
      where: { slug },
      include: {
        categories: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
        _count: {
          select: {
            users: true,
            categories: true,
            demands: true,
          },
        },
      },
    });

    if (!secretary) {
      throw new NotFoundException('Secretaria não encontrada');
    }

    return secretary;
  }

  async create(createSecretaryDto: CreateSecretaryDto): Promise<Secretary> {
    const slug = slugify(createSecretaryDto.name);

    const existing = await this.prisma.secretary.findFirst({
      where: {
        OR: [
          { slug },
          { acronym: createSecretaryDto.acronym },
        ],
      },
    });

    if (existing) {
      throw new ConflictException('Já existe uma secretaria com este nome ou sigla');
    }

    return this.prisma.secretary.create({
      data: {
        ...createSecretaryDto,
        slug,
      },
    });
  }

  async update(id: string, updateSecretaryDto: UpdateSecretaryDto): Promise<Secretary> {
    await this.findById(id);

    const data: Partial<Secretary> = { ...updateSecretaryDto };

    if (updateSecretaryDto.name) {
      data.slug = slugify(updateSecretaryDto.name);
    }

    if (updateSecretaryDto.acronym) {
      const existing = await this.prisma.secretary.findFirst({
        where: {
          acronym: updateSecretaryDto.acronym,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException('Já existe uma secretaria com esta sigla');
      }
    }

    return this.prisma.secretary.update({
      where: { id },
      data,
    });
  }

  async deactivate(id: string): Promise<void> {
    await this.findById(id);

    await this.prisma.secretary.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async activate(id: string): Promise<Secretary> {
    await this.findById(id);

    return this.prisma.secretary.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async getQuickStats(secretaryId: string) {
    const [total, open, inProgress, resolved, critical, overdue] = await Promise.all([
      this.prisma.demand.count({ where: { secretaryId } }),
      this.prisma.demand.count({ where: { secretaryId, status: DemandStatus.OPEN } }),
      this.prisma.demand.count({ where: { secretaryId, status: DemandStatus.IN_PROGRESS } }),
      this.prisma.demand.count({ where: { secretaryId, status: DemandStatus.RESOLVED } }),
      this.prisma.demand.count({
        where: {
          secretaryId,
          priority: Priority.CRITICAL,
          status: { not: DemandStatus.RESOLVED },
        },
      }),
      this.prisma.demand.count({
        where: {
          secretaryId,
          status: { in: [DemandStatus.OPEN, DemandStatus.IN_PROGRESS] },
          slaDeadline: { lt: new Date() },
        },
      }),
    ]);

    return {
      total,
      open,
      inProgress,
      resolved,
      critical,
      overdue,
      resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
    };
  }

  async getDetailedStats(secretaryId: string) {
    const secretary = await this.findById(secretaryId);

    const [byStatus, byPriority, byCategory, timeline, avgResolutionTime, topCategories] = await Promise.all([
      this.prisma.demand.groupBy({
        by: ['status'],
        where: { secretaryId },
        _count: { _all: true },
      }),
      this.prisma.demand.groupBy({
        by: ['priority'],
        where: { secretaryId },
        _count: { _all: true },
      }),
      this.prisma.demand.groupBy({
        by: ['categoryId'],
        where: { secretaryId },
        _count: { categoryId: true },
        orderBy: { _count: { categoryId: 'desc' } },
        take: 10,
      }),
      this.prisma.$queryRaw<{ date: Date; count: number }[]>`
        SELECT DATE("createdAt") as date, COUNT(*)::int as count
        FROM "demands"
        WHERE "secretaryId" = ${secretaryId}
          AND "createdAt" >= NOW() - INTERVAL '30 days'
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,
      this.prisma.$queryRaw<{ avg_hours: number }[]>`
        SELECT COALESCE(AVG(EXTRACT(EPOCH FROM ("resolvedAt" - "createdAt")) / 3600), 0)::float as avg_hours
        FROM "demands"
        WHERE "secretaryId" = ${secretaryId}
          AND "resolvedAt" IS NOT NULL
          AND "createdAt" >= NOW() - INTERVAL '30 days'
      `,
      this.prisma.demand.groupBy({
        by: ['categoryId'],
        where: { secretaryId },
        _count: { categoryId: true },
        orderBy: { _count: { categoryId: 'desc' } },
        take: 5,
      }),
    ]);

    const categories = await this.prisma.category.findMany({
      where: { secretaryId },
      select: { id: true, name: true },
    });
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    return {
      secretary,
      stats: await this.getQuickStats(secretaryId),
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count?._all ?? 0 })),
      byPriority: byPriority.map((p) => ({ priority: p.priority, count: p._count?._all ?? 0 })),
      byCategory: byCategory.map((c) => ({
        categoryId: c.categoryId,
        category: categoryMap.get(c.categoryId) || 'N/A',
        count: typeof c._count === 'object' && c._count ? (c._count.categoryId ?? 0) : 0,
      })),
      timeline: timeline.map((t) => ({ date: t.date.toISOString().slice(0, 10), count: t.count })),
      avgResolutionTimeHours: avgResolutionTime[0]?.avg_hours || 0,
      topCategories: topCategories.map((c) => ({
        category: categoryMap.get(c.categoryId) || 'N/A',
        count: typeof c._count === 'object' && c._count ? (c._count.categoryId ?? 0) : 0,
      })),
    };
  }

  async getDemands(secretaryId: string, filters: {
    status?: DemandStatus
    priority?: Priority
    categoryId?: string
    search?: string
    page?: number
    limit?: number
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.DemandWhereInput = { secretaryId };

    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.search) {
      where.OR = [
        { protocol: { contains: filters.search, mode: 'insensitive' } },
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.demand.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          category: true,
          assignedTo: { select: { id: true, name: true } },
          attachments: true,
        },
      }),
      this.prisma.demand.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTeam(secretaryId: string) {
    const users = await this.prisma.user.findMany({
      where: { secretaryId, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            assignedDemands: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const [resolved, pending] = await Promise.all([
          this.prisma.demand.count({
            where: {
              assignedToId: user.id,
              status: DemandStatus.RESOLVED,
            },
          }),
          this.prisma.demand.count({
            where: {
              assignedToId: user.id,
              status: { in: [DemandStatus.OPEN, DemandStatus.IN_PROGRESS] },
            },
          }),
        ]);

        return {
          ...user,
          stats: {
            total: user._count.assignedDemands,
            resolved,
            pending,
          },
        };
      })
    );

    return usersWithStats;
  }

  async getCategories(secretaryId: string) {
    const categories = await this.prisma.category.findMany({
      where: { secretaryId, isActive: true },
      include: {
        _count: {
          select: { demands: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const result = await Promise.all(
      categories.map(async (cat) => {
        const [open, resolved] = await Promise.all([
          this.prisma.demand.count({
            where: { categoryId: cat.id, status: { in: [DemandStatus.OPEN, DemandStatus.IN_PROGRESS] } },
          }),
          this.prisma.demand.count({
            where: { categoryId: cat.id, status: DemandStatus.RESOLVED },
          }),
        ]);

        return {
          ...cat,
          stats: {
            total: cat._count.demands,
            open,
            resolved,
          },
        };
      })
    );

    return result;
  }

  async getRecentActivity(secretaryId: string, limit = 20) {
    return this.prisma.demandHistory.findMany({
      where: {
        demand: { secretaryId },
      },
      include: {
        demand: {
          select: { protocol: true, title: true },
        },
        user: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getOverdueDemands(secretaryId: string) {
    return this.prisma.demand.findMany({
      where: {
        secretaryId,
        status: { in: [DemandStatus.OPEN, DemandStatus.IN_PROGRESS] },
        slaDeadline: { lt: new Date() },
      },
      include: {
        category: true,
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: { slaDeadline: 'asc' },
    });
  }

  async getCriticalDemands(secretaryId: string) {
    return this.prisma.demand.findMany({
      where: {
        secretaryId,
        priority: Priority.CRITICAL,
        status: { in: [DemandStatus.OPEN, DemandStatus.IN_PROGRESS] },
      },
      include: {
        category: true,
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getAllActive(): Promise<Secretary[]> {
    return this.prisma.secretary.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        categories: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
    });
  }
}
