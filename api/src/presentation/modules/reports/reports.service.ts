import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { DemandStatus, Priority, DemandSource } from '@prisma/client';

export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  secretaryId?: string;
  categoryId?: string;
  status?: DemandStatus;
  priority?: Priority;
  source?: DemandSource;
  neighborhood?: string;
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async generateGeneralReport(filters: ReportFilters) {
    const where = this.buildWhereClause(filters);

    const [
      totalDemands,
      byStatus,
      byPriority,
      bySource,
      bySecretary,
      byCategory,
      byNeighborhood,
      avgResolutionTime,
      slaCompliance,
    ] = await Promise.all([
      this.prisma.demand.count({ where }),
      this.getStatusDistribution(where),
      this.getPriorityDistribution(where),
      this.getSourceDistribution(where),
      this.getSecretaryDistribution(where),
      this.getCategoryDistribution(where),
      this.getNeighborhoodDistribution(where),
      this.calculateAvgResolutionTime(where),
      this.calculateSLACompliance(where),
    ]);

    return {
      generatedAt: new Date(),
      filters,
      summary: {
        totalDemands,
        avgResolutionTimeHours: avgResolutionTime,
        slaComplianceRate: slaCompliance,
      },
      distributions: {
        byStatus,
        byPriority,
        bySource,
        bySecretary,
        byCategory,
        byNeighborhood,
      },
    };
  }

  async generateSecretaryReport(secretaryId: string, filters: ReportFilters) {
    const where = this.buildWhereClause({ ...filters, secretaryId });

    const secretary = await this.prisma.secretary.findUnique({
      where: { id: secretaryId },
      include: { categories: true, users: { where: { isActive: true } } },
    });

    const [
      totalDemands,
      byStatus,
      byCategory,
      byPriority,
      monthlyTrend,
      topOperators,
      avgResolutionTime,
      slaCompliance,
    ] = await Promise.all([
      this.prisma.demand.count({ where }),
      this.getStatusDistribution(where),
      this.getCategoryDistribution(where),
      this.getPriorityDistribution(where),
      this.getMonthlyTrend(where),
      this.getTopOperators(secretaryId, filters),
      this.calculateAvgResolutionTime(where),
      this.calculateSLACompliance(where),
    ]);

    return {
      generatedAt: new Date(),
      secretary,
      filters,
      summary: {
        totalDemands,
        totalCategories: secretary?.categories.length || 0,
        totalOperators: secretary?.users.length || 0,
        avgResolutionTimeHours: avgResolutionTime,
        slaComplianceRate: slaCompliance,
      },
      distributions: {
        byStatus,
        byCategory,
        byPriority,
      },
      monthlyTrend,
      topOperators,
    };
  }

  async generatePerformanceReport(filters: ReportFilters) {
    const where = this.buildWhereClause(filters);

    const [
      operatorPerformance,
      secretaryPerformance,
      resolutionTimes,
      slaMetrics,
    ] = await Promise.all([
      this.getOperatorPerformance(filters),
      this.getSecretaryPerformance(filters),
      this.getResolutionTimeDistribution(where),
      this.getSLAMetrics(where),
    ]);

    return {
      generatedAt: new Date(),
      filters,
      operatorPerformance,
      secretaryPerformance,
      resolutionTimes,
      slaMetrics,
    };
  }

  async generateNeighborhoodReport(filters: ReportFilters) {
    const where = this.buildWhereClause(filters);

    const neighborhoods = await this.prisma.demand.groupBy({
      by: ['neighborhood'],
      where: { ...where, neighborhood: { not: null } },
      _count: true,
      orderBy: { _count: { neighborhood: 'desc' } },
    });

    const detailedStats = await Promise.all(
      neighborhoods.slice(0, 20).map(async (n) => {
        const neighborhoodWhere = { ...where, neighborhood: n.neighborhood };
        
        const [byStatus, byCategory] = await Promise.all([
          this.getStatusDistribution(neighborhoodWhere),
          this.getCategoryDistribution(neighborhoodWhere),
        ]);

        return {
          neighborhood: n.neighborhood,
          totalDemands: n._count,
          byStatus,
          byCategory: byCategory.slice(0, 5),
        };
      }),
    );

    return {
      generatedAt: new Date(),
      filters,
      totalNeighborhoods: neighborhoods.length,
      details: detailedStats,
    };
  }

  async exportToCSV(filters: ReportFilters): Promise<string> {
    const where = this.buildWhereClause(filters);

    const demands = await this.prisma.demand.findMany({
      where,
      include: {
        category: { select: { name: true } },
        secretary: { select: { name: true, acronym: true } },
        assignedTo: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'Protocolo',
      'Título',
      'Status',
      'Prioridade',
      'Secretaria',
      'Categoria',
      'Bairro',
      'Solicitante',
      'Atribuído a',
      'Data Criação',
      'Data Resolução',
      'SLA',
    ];

    const rows = demands.map((d: any) => [
      d.protocol,
      `"${d.title.replace(/"/g, '""')}"`,
      d.status,
      d.priority,
      d.secretary?.acronym || '',
      d.category?.name || '',
      d.neighborhood || '',
      d.requesterName || '',
      d.assignedTo?.name || '',
      d.createdAt.toISOString(),
      d.resolvedAt?.toISOString() || '',
      d.slaDeadline?.toISOString() || '',
    ]);

    const csv = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');
    return csv;
  }

  private buildWhereClause(filters: ReportFilters): any {
    const where: any = {};

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    if (filters.secretaryId) where.secretaryId = filters.secretaryId;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.source) where.source = filters.source;
    if (filters.neighborhood) where.neighborhood = { contains: filters.neighborhood, mode: 'insensitive' };

    return where;
  }

  private async getStatusDistribution(where: any) {
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

  private async getPriorityDistribution(where: any) {
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

  private async getSourceDistribution(where: any) {
    const distribution = await this.prisma.demand.groupBy({
      by: ['source'],
      where,
      _count: true,
    });

    return distribution.map(d => ({
      source: d.source,
      count: d._count,
    }));
  }

  private async getSecretaryDistribution(where: any) {
    const distribution = await this.prisma.demand.groupBy({
      by: ['secretaryId'],
      where,
      _count: true,
      orderBy: { _count: { secretaryId: 'desc' } },
    });

    const secretaryIds = distribution.map(d => d.secretaryId);
    const secretaries = await this.prisma.secretary.findMany({
      where: { id: { in: secretaryIds } },
      select: { id: true, name: true, acronym: true },
    });

    return distribution.map(d => ({
      secretaryId: d.secretaryId,
      secretaryName: secretaries.find(s => s.id === d.secretaryId)?.name || 'Desconhecida',
      acronym: secretaries.find(s => s.id === d.secretaryId)?.acronym,
      count: d._count,
    }));
  }

  private async getCategoryDistribution(where: any) {
    const distribution = await this.prisma.demand.groupBy({
      by: ['categoryId'],
      where,
      _count: true,
      orderBy: { _count: { categoryId: 'desc' } },
      take: 15,
    });

    const categoryIds = distribution.map(d => d.categoryId);
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });

    return distribution.map(d => ({
      categoryId: d.categoryId,
      categoryName: categories.find(c => c.id === d.categoryId)?.name || 'Desconhecida',
      count: d._count,
    }));
  }

  private async getNeighborhoodDistribution(where: any) {
    const distribution = await this.prisma.demand.groupBy({
      by: ['neighborhood'],
      where: { ...where, neighborhood: { not: null } },
      _count: true,
      orderBy: { _count: { neighborhood: 'desc' } },
      take: 20,
    });

    return distribution.map(d => ({
      neighborhood: d.neighborhood,
      count: d._count,
    }));
  }

  private async getMonthlyTrend(where: any) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const demands = await this.prisma.demand.findMany({
      where: {
        ...where,
        createdAt: { gte: sixMonthsAgo },
      },
      select: { createdAt: true, status: true },
    });

    const monthlyData: Record<string, { created: number; resolved: number }> = {};

    demands.forEach(d => {
      const month = d.createdAt.toISOString().substring(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { created: 0, resolved: 0 };
      }
      monthlyData[month].created++;
      if (d.status === 'RESOLVED') {
        monthlyData[month].resolved++;
      }
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private async getTopOperators(secretaryId: string, filters: ReportFilters) {
    const where = this.buildWhereClause({ ...filters, secretaryId });

    const operators = await this.prisma.demand.groupBy({
      by: ['assignedToId'],
      where: { ...where, assignedToId: { not: null } },
      _count: true,
      orderBy: { _count: { assignedToId: 'desc' } },
      take: 10,
    });

    const userIds = operators.map(o => o.assignedToId!);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });

    // Get resolved counts
    const resolvedCounts = await this.prisma.demand.groupBy({
      by: ['assignedToId'],
      where: { ...where, assignedToId: { in: userIds }, status: 'RESOLVED' },
      _count: true,
    });

    return operators.map(o => {
      const user = users.find(u => u.id === o.assignedToId);
      const resolved = resolvedCounts.find(r => r.assignedToId === o.assignedToId)?._count || 0;
      
      return {
        userId: o.assignedToId,
        userName: user?.name || 'Desconhecido',
        totalAssigned: o._count,
        resolved,
        resolutionRate: o._count > 0 ? ((resolved / o._count) * 100).toFixed(1) : 0,
      };
    });
  }

  private async getOperatorPerformance(filters: ReportFilters) {
    const where = this.buildWhereClause(filters);

    const operators = await this.prisma.demand.groupBy({
      by: ['assignedToId'],
      where: { ...where, assignedToId: { not: null } },
      _count: true,
    });

    const userIds = operators.map(o => o.assignedToId!);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, secretary: { select: { name: true } } },
    });

    return Promise.all(
      operators.map(async (o) => {
        const user = users.find(u => u.id === o.assignedToId);
        const resolved = await this.prisma.demand.count({
          where: { ...where, assignedToId: o.assignedToId, status: 'RESOLVED' },
        });

        return {
          userId: o.assignedToId,
          userName: user?.name || 'Desconhecido',
          secretaryName: user?.secretary?.name,
          totalAssigned: o._count,
          resolved,
          resolutionRate: o._count > 0 ? ((resolved / o._count) * 100).toFixed(1) : 0,
        };
      }),
    );
  }

  private async getSecretaryPerformance(filters: ReportFilters) {
    const where = this.buildWhereClause(filters);

    const secretaries = await this.prisma.demand.groupBy({
      by: ['secretaryId'],
      where,
      _count: true,
    });

    const secretaryIds = secretaries.map(s => s.secretaryId);
    const secretaryDetails = await this.prisma.secretary.findMany({
      where: { id: { in: secretaryIds } },
      select: { id: true, name: true, acronym: true },
    });

    return Promise.all(
      secretaries.map(async (s) => {
        const secretary = secretaryDetails.find(sd => sd.id === s.secretaryId);
        const resolved = await this.prisma.demand.count({
          where: { ...where, secretaryId: s.secretaryId, status: 'RESOLVED' },
        });
        const avgTime = await this.calculateAvgResolutionTime({ ...where, secretaryId: s.secretaryId });

        return {
          secretaryId: s.secretaryId,
          secretaryName: secretary?.name || 'Desconhecida',
          acronym: secretary?.acronym,
          totalDemands: s._count,
          resolved,
          resolutionRate: s._count > 0 ? ((resolved / s._count) * 100).toFixed(1) : 0,
          avgResolutionTimeHours: avgTime,
        };
      }),
    );
  }

  private async calculateAvgResolutionTime(where: any): Promise<number> {
    const resolved = await this.prisma.demand.findMany({
      where: { ...where, status: 'RESOLVED', resolvedAt: { not: null } },
      select: { createdAt: true, resolvedAt: true },
      take: 1000,
    });

    if (resolved.length === 0) return 0;

    const totalHours = resolved.reduce((sum, d) => {
      const diff = (d.resolvedAt!.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60);
      return sum + diff;
    }, 0);

    return Math.round(totalHours / resolved.length);
  }

  private async calculateSLACompliance(where: any): Promise<string> {
    const [total, onTime] = await Promise.all([
      this.prisma.demand.count({
        where: { ...where, status: 'RESOLVED' },
      }),
      this.prisma.demand.count({
        where: {
          ...where,
          status: 'RESOLVED',
          resolvedAt: { not: null },
        },
      }),
    ]);

    // Count how many were resolved within SLA
    const demands = await this.prisma.demand.findMany({
      where: { ...where, status: 'RESOLVED', resolvedAt: { not: null } },
      select: { slaDeadline: true, resolvedAt: true },
    });

    const withinSLA = demands.filter((d: any) => d.resolvedAt && d.slaDeadline && d.resolvedAt <= d.slaDeadline).length;

    return total > 0 ? ((withinSLA / total) * 100).toFixed(1) : '0';
  }

  private async getResolutionTimeDistribution(where: any) {
    const resolved = await this.prisma.demand.findMany({
      where: { ...where, status: 'RESOLVED', resolvedAt: { not: null } },
      select: { createdAt: true, resolvedAt: true },
    });

    const distribution = {
      lessThan24h: 0,
      between24And48h: 0,
      between48And72h: 0,
      between3And7Days: 0,
      moreThan7Days: 0,
    };

    resolved.forEach(d => {
      const hours = (d.resolvedAt!.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60);
      
      if (hours < 24) distribution.lessThan24h++;
      else if (hours < 48) distribution.between24And48h++;
      else if (hours < 72) distribution.between48And72h++;
      else if (hours < 168) distribution.between3And7Days++;
      else distribution.moreThan7Days++;
    });

    return distribution;
  }

  private async getSLAMetrics(where: any) {
    const demands = await this.prisma.demand.findMany({
      where: { ...where, status: { in: ['RESOLVED', 'CLOSED'] } },
      select: { slaDeadline: true, resolvedAt: true, createdAt: true },
    });

    const withinSLA = demands.filter((d: any) => d.resolvedAt && d.slaDeadline && d.resolvedAt <= d.slaDeadline).length;
    const outsideSLA = demands.length - withinSLA;

    return {
      total: demands.length,
      withinSLA,
      outsideSLA,
      complianceRate: demands.length > 0 ? ((withinSLA / demands.length) * 100).toFixed(1) : '0',
    };
  }
}
