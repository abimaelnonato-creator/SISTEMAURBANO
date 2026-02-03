import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { DemandStatus, Priority } from '@prisma/client'
import { PrismaService } from '@/infrastructure/database/prisma.service'
import { CreateSecretaryDto } from './dto/create-secretary.dto'
import { UpdateSecretaryDto } from './dto/update-secretary.dto'
import { SecretaryDetailedStatsDto, SecretaryQuickStatsDto } from './dto/secretary-stats.dto'
import { slugify } from '@/shared/utils/helpers'

@Injectable()
export class SecretaryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const secretaries = await this.prisma.secretary.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            demands: true,
            users: true,
            categories: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    const result = await Promise.all(
      secretaries.map(async (sec) => {
        const stats = await this.getQuickStats(sec.id)
        return { ...sec, stats }
      })
    )

    return result
  }

  async findById(id: string) {
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
          select: { demands: true },
        },
      },
    })

    if (!secretary) {
      throw new NotFoundException('Secretaria não encontrada')
    }

    return secretary
  }

  async findByCode(code: string) {
    return this.prisma.secretary.findFirst({
      where: {
        OR: [
          { slug: code },
          { acronym: code },
        ],
      },
      include: {
        categories: true,
        _count: { select: { demands: true, users: true } },
      },
    })
  }

  async getQuickStats(secretaryId: string): Promise<SecretaryQuickStatsDto> {
    const [total, open, inProgress, resolved, critical, overdue] = await Promise.all([
      this.prisma.demand.count({ where: { secretaryId } }),
      this.prisma.demand.count({ where: { secretaryId, status: DemandStatus.OPEN } }),
      this.prisma.demand.count({ where: { secretaryId, status: DemandStatus.IN_PROGRESS } }),
      this.prisma.demand.count({ where: { secretaryId, status: DemandStatus.RESOLVED } }),
      this.prisma.demand.count({ where: { secretaryId, priority: Priority.CRITICAL, status: { not: DemandStatus.RESOLVED } } }),
      this.prisma.demand.count({
        where: {
          secretaryId,
          status: { in: [DemandStatus.OPEN, DemandStatus.IN_PROGRESS] },
          slaDeadline: { lt: new Date() },
        },
      }),
    ])

    return {
      total,
      open,
      inProgress,
      resolved,
      critical,
      overdue,
      resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
    }
  }

  async getDetailedStats(secretaryId: string): Promise<SecretaryDetailedStatsDto> {
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
    ])

    const categories = await this.prisma.category.findMany({
      where: { secretaryId },
      select: { id: true, name: true },
    })
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]))

    return {
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
    }
  }

  async getDemands(secretaryId: string, filters: {
    status?: DemandStatus
    priority?: Priority
    categoryId?: string
    search?: string
    page?: number
    limit?: number
  }) {
    const page = filters.page || 1
    const limit = filters.limit || 20
    const skip = (page - 1) * limit

    const where: any = { secretaryId }

    if (filters.status) where.status = filters.status
    if (filters.priority) where.priority = filters.priority
    if (filters.categoryId) where.categoryId = filters.categoryId
    if (filters.search) {
      where.OR = [
        { protocol: { contains: filters.search, mode: 'insensitive' } },
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ]
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
    ])

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
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
    })

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
        ])

        return {
          ...user,
          stats: {
            total: user._count.assignedDemands,
            resolved,
            pending,
          },
        }
      })
    )

    return usersWithStats
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
    })

    const result = await Promise.all(
      categories.map(async (cat) => {
        const [open, resolved] = await Promise.all([
          this.prisma.demand.count({
            where: { categoryId: cat.id, status: { in: [DemandStatus.OPEN, DemandStatus.IN_PROGRESS] } },
          }),
          this.prisma.demand.count({
            where: { categoryId: cat.id, status: DemandStatus.RESOLVED },
          }),
        ])

        return {
          ...cat,
          stats: {
            total: cat._count.demands,
            open,
            resolved,
          },
        }
      })
    )

    return result
  }

  async create(data: CreateSecretaryDto) {
    const slug = slugify(data.name)

    const existing = await this.prisma.secretary.findFirst({
      where: {
        OR: [{ slug }, { acronym: data.acronym }],
      },
    })

    if (existing) {
      throw new ConflictException('Já existe uma secretaria com este nome ou sigla')
    }

    return this.prisma.secretary.create({
      data: {
        ...data,
        slug,
      },
    })
  }

  async update(id: string, data: UpdateSecretaryDto) {
    const existing = await this.prisma.secretary.findUnique({ where: { id } })

    if (!existing) {
      throw new NotFoundException('Secretaria não encontrada')
    }

    const updateData = {
      ...data,
      slug: data.name ? slugify(data.name) : existing.slug,
    }

    if (data.acronym && data.acronym !== existing.acronym) {
      const conflict = await this.prisma.secretary.findFirst({
        where: {
          acronym: data.acronym,
          id: { not: id },
        },
      })

      if (conflict) {
        throw new ConflictException('Já existe uma secretaria com esta sigla')
      }
    }

    return this.prisma.secretary.update({
      where: { id },
      data: updateData,
    })
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
    })
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
    })
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
    })
  }
}
