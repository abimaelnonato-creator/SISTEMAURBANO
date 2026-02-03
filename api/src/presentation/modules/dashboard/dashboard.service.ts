import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { RedisService } from '@/infrastructure/cache/redis.service';
import { DemandStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getSummary(secretaryId?: string) {
    const cacheKey = secretaryId 
      ? `dashboard:secretary:${secretaryId}` 
      : 'dashboard:summary';

    // Try to get from cache
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const where: any = {};
    if (secretaryId) {
      where.secretaryId = secretaryId;
    }

    const [
      totalDemands,
      openDemands,
      inProgressDemands,
      resolvedDemands,
      cancelledDemands,
      overdueCount,
      todayDemands,
      weekDemands,
      monthDemands,
    ] = await Promise.all([
      this.prisma.demand.count({ where }),
      this.prisma.demand.count({ where: { ...where, status: 'OPEN' } }),
      this.prisma.demand.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      this.prisma.demand.count({ where: { ...where, status: 'RESOLVED' } }),
      this.prisma.demand.count({ where: { ...where, status: 'CANCELLED' } }),
      this.prisma.demand.count({
        where: {
          ...where,
          slaDeadline: { lt: new Date() },
          status: { notIn: ['RESOLVED', 'CLOSED', 'CANCELLED'] },
        },
      }),
      this.prisma.demand.count({
        where: {
          ...where,
          createdAt: { gte: this.getStartOfToday() },
        },
      }),
      this.prisma.demand.count({
        where: {
          ...where,
          createdAt: { gte: this.getStartOfWeek() },
        },
      }),
      this.prisma.demand.count({
        where: {
          ...where,
          createdAt: { gte: this.getStartOfMonth() },
        },
      }),
    ]);

    // Calculate average resolution time
    const resolvedWithTime = await this.prisma.demand.findMany({
      where: {
        ...where,
        status: 'RESOLVED',
        resolvedAt: { not: null },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
      take: 1000,
      orderBy: { resolvedAt: 'desc' },
    });

    let avgResolutionHours = 0;
    if (resolvedWithTime.length > 0) {
      const totalHours = resolvedWithTime.reduce((sum, d) => {
        const diff = (d.resolvedAt!.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60);
        return sum + diff;
      }, 0);
      avgResolutionHours = Math.round(totalHours / resolvedWithTime.length);
    }

    const summary = {
      totalDemands,
      openDemands,
      inProgressDemands,
      resolvedDemands,
      cancelledDemands,
      overdueCount,
      todayDemands,
      weekDemands,
      monthDemands,
      resolutionRate: totalDemands > 0 ? ((resolvedDemands / totalDemands) * 100).toFixed(1) : 0,
      avgResolutionHours,
    };

    // Cache the result
    await this.redis.set(cacheKey, summary, this.CACHE_TTL);

    return summary;
  }

  async getChartData(period: 'week' | 'month' | 'year' = 'month', secretaryId?: string) {
    const where: any = {};
    if (secretaryId) {
      where.secretaryId = secretaryId;
    }

    let startDate: Date;
    let groupByFormat: string;

    switch (period) {
      case 'week':
        startDate = this.getStartOfWeek();
        startDate.setDate(startDate.getDate() - 7); // Last 2 weeks
        groupByFormat = 'day';
        break;
      case 'year':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        groupByFormat = 'month';
        break;
      case 'month':
      default:
        startDate = this.getStartOfMonth();
        startDate.setMonth(startDate.getMonth() - 1); // Last 2 months
        groupByFormat = 'day';
    }

    where.createdAt = { gte: startDate };

    // Get demands grouped by date
    const demands = await this.prisma.demand.findMany({
      where,
      select: {
        createdAt: true,
        status: true,
      },
    });

    // Group by date
    const groupedData: Record<string, { created: number; resolved: number }> = {};

    demands.forEach(d => {
      let key: string;
      if (groupByFormat === 'day') {
        key = d.createdAt.toISOString().split('T')[0];
      } else {
        key = d.createdAt.toISOString().substring(0, 7);
      }

      if (!groupedData[key]) {
        groupedData[key] = { created: 0, resolved: 0 };
      }
      groupedData[key].created++;
      if (d.status === 'RESOLVED') {
        groupedData[key].resolved++;
      }
    });

    const chartData = Object.entries(groupedData)
      .map(([date, data]) => ({
        date,
        ...data,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return chartData;
  }

  async getStatusDistribution(secretaryId?: string) {
    const where: any = {};
    if (secretaryId) {
      where.secretaryId = secretaryId;
    }

    const distribution = await this.prisma.demand.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    return distribution.map(d => ({
      status: d.status,
      count: d._count,
    }));
  }

  async getPriorityDistribution(secretaryId?: string) {
    const where: any = {};
    if (secretaryId) {
      where.secretaryId = secretaryId;
    }

    const distribution = await this.prisma.demand.groupBy({
      by: ['priority'],
      where,
      _count: true,
    });

    return distribution.map(d => ({
      priority: d.priority,
      count: d._count,
    }));
  }

  async getCategoryDistribution(secretaryId?: string) {
    const where: any = {};
    if (secretaryId) {
      where.secretaryId = secretaryId;
    }

    const distribution = await this.prisma.demand.groupBy({
      by: ['categoryId'],
      where,
      _count: true,
      orderBy: {
        _count: {
          categoryId: 'desc',
        },
      },
      take: 10,
    });

    const categoryIds = distribution.map(d => d.categoryId);
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, color: true },
    });

    return distribution.map(d => {
      const category = categories.find(c => c.id === d.categoryId);
      return {
        categoryId: d.categoryId,
        categoryName: category?.name || 'Desconhecida',
        color: category?.color,
        count: d._count,
      };
    });
  }

  async getSecretaryRanking() {
    const ranking = await this.prisma.demand.groupBy({
      by: ['secretaryId'],
      _count: true,
      orderBy: {
        _count: {
          secretaryId: 'desc',
        },
      },
    });

    const secretaryIds = ranking.map(r => r.secretaryId);
    const secretaries = await this.prisma.secretary.findMany({
      where: { id: { in: secretaryIds } },
      select: { id: true, name: true, acronym: true, color: true },
    });

    // Get resolved counts
    const resolvedCounts = await this.prisma.demand.groupBy({
      by: ['secretaryId'],
      where: { status: 'RESOLVED' },
      _count: true,
    });

    return ranking.map(r => {
      const secretary = secretaries.find(s => s.id === r.secretaryId);
      const resolved = resolvedCounts.find(rc => rc.secretaryId === r.secretaryId)?._count || 0;
      
      return {
        secretaryId: r.secretaryId,
        secretaryName: secretary?.name || 'Desconhecida',
        acronym: secretary?.acronym,
        color: secretary?.color,
        totalDemands: r._count,
        resolvedDemands: resolved,
        resolutionRate: r._count > 0 ? ((resolved / r._count) * 100).toFixed(1) : 0,
      };
    });
  }

  async getRecentActivity(limit: number = 20) {
    const activities = await this.prisma.demandHistory.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        demand: {
          select: { id: true, protocol: true, title: true },
        },
        user: {
          select: { id: true, name: true },
        },
      },
    });

    return activities;
  }

  async getAlerts() {
    const [overdueCount, criticalPriority, noAssignment] = await Promise.all([
      this.prisma.demand.count({
        where: {
          slaDeadline: { lt: new Date() },
          status: { notIn: ['RESOLVED', 'CLOSED', 'CANCELLED'] },
        },
      }),
      this.prisma.demand.count({
        where: {
          priority: 'CRITICAL',
          status: { notIn: ['RESOLVED', 'CLOSED', 'CANCELLED'] },
        },
      }),
      this.prisma.demand.count({
        where: {
          assignedToId: null,
          status: { notIn: ['RESOLVED', 'CLOSED', 'CANCELLED'] },
          createdAt: {
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // More than 24h
          },
        },
      }),
    ]);

    const alerts = [];

    if (overdueCount > 0) {
      alerts.push({
        type: 'overdue',
        severity: 'high',
        message: `${overdueCount} demanda(s) com SLA vencido`,
        count: overdueCount,
      });
    }

    if (criticalPriority > 0) {
      alerts.push({
        type: 'critical',
        severity: 'critical',
        message: `${criticalPriority} demanda(s) com prioridade crítica pendente(s)`,
        count: criticalPriority,
      });
    }

    if (noAssignment > 0) {
      alerts.push({
        type: 'no_assignment',
        severity: 'medium',
        message: `${noAssignment} demanda(s) sem atribuição há mais de 24h`,
        count: noAssignment,
      });
    }

    return alerts;
  }

  private getStartOfToday(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  private getStartOfWeek(): Date {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek;
    return new Date(now.getFullYear(), now.getMonth(), diff);
  }

  private getStartOfMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
}
