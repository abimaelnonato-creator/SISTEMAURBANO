import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { DemandStatus, Priority } from '@prisma/client';

interface SlaRule {
  priority: Priority;
  maxHours: number;
  warningHours: number;
}

@Injectable()
export class SlaMonitoringService {
  private readonly logger = new Logger(SlaMonitoringService.name);

  // SLA rules per priority (in hours)
  private readonly slaRules: SlaRule[] = [
    { priority: Priority.CRITICAL, maxHours: 4, warningHours: 2 },
    { priority: Priority.HIGH, maxHours: 24, warningHours: 12 },
    { priority: Priority.MEDIUM, maxHours: 72, warningHours: 48 },
    { priority: Priority.LOW, maxHours: 168, warningHours: 120 }, // 7 days
  ];

  constructor(private prisma: PrismaService) {}

  // Run every 10 minutes
  @Cron(CronExpression.EVERY_10_MINUTES)
  async checkOverdueDemands() {
    this.logger.log('Starting SLA monitoring check...');

    const openStatuses = [
      DemandStatus.PENDING,
      DemandStatus.IN_PROGRESS,
      DemandStatus.WAITING_INFO,
    ];

    for (const rule of this.slaRules) {
      const overdueThreshold = new Date();
      overdueThreshold.setHours(overdueThreshold.getHours() - rule.maxHours);

      const warningThreshold = new Date();
      warningThreshold.setHours(warningThreshold.getHours() - rule.warningHours);

      // Find overdue demands - use slaDeadline if available, otherwise check createdAt
      const overdueDemands = await this.prisma.demand.findMany({
        where: {
          priority: rule.priority,
          status: { in: openStatuses },
          OR: [
            { slaDeadline: { lt: new Date() } },
            { createdAt: { lt: overdueThreshold }, slaDeadline: null },
          ],
        },
        include: {
          secretary: true,
          assignedTo: true,
        },
      });

      // Log overdue demands
      if (overdueDemands.length > 0) {
        this.logger.warn(
          `Found ${overdueDemands.length} ${rule.priority} demands overdue`,
        );

        // Create notifications for each overdue demand
        for (const demand of overdueDemands) {
          await this.createOverdueNotification(demand);
        }
      }

      // Find demands approaching deadline (warning)
      const warningDemands = await this.prisma.demand.findMany({
        where: {
          priority: rule.priority,
          status: { in: openStatuses },
          createdAt: { 
            lt: warningThreshold,
            gte: overdueThreshold,
          },
        },
      });

      if (warningDemands.length > 0) {
        this.logger.log(
          `${warningDemands.length} ${rule.priority} demands approaching deadline`,
        );
      }
    }

    this.logger.log('SLA monitoring check completed');
  }

  // Run daily at 8 AM
  @Cron('0 8 * * *')
  async generateDailySlaReport() {
    this.logger.log('Generating daily SLA report...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Get resolved demands from yesterday
    const resolvedYesterday = await this.prisma.demand.findMany({
      where: {
        status: DemandStatus.RESOLVED,
        resolvedAt: {
          gte: yesterday,
          lt: today,
        },
      },
      include: { secretary: true },
    });

    // Calculate SLA compliance based on slaDeadline
    const slaCompliant = resolvedYesterday.filter(
      (d) => !d.slaDeadline || d.resolvedAt! <= d.slaDeadline
    );
    const slaViolated = resolvedYesterday.filter(
      (d) => d.slaDeadline && d.resolvedAt! > d.slaDeadline
    );

    const complianceRate = resolvedYesterday.length > 0
      ? (slaCompliant.length / resolvedYesterday.length) * 100
      : 100;

    this.logger.log(
      `Daily SLA Report: ${resolvedYesterday.length} resolved, ${complianceRate.toFixed(1)}% compliance`,
    );

    // Group by secretary
    const bySecretary = new Map<string, { compliant: number; violated: number }>();
    for (const demand of resolvedYesterday) {
      const key = demand.secretary?.name || 'Unassigned';
      const current = bySecretary.get(key) || { compliant: 0, violated: 0 };
      const isViolated = demand.slaDeadline && demand.resolvedAt! > demand.slaDeadline;
      if (isViolated) {
        current.violated++;
      } else {
        current.compliant++;
      }
      bySecretary.set(key, current);
    }

    // Log per-secretary stats
    bySecretary.forEach((stats, secretary) => {
      const rate = ((stats.compliant / (stats.compliant + stats.violated)) * 100).toFixed(1);
      this.logger.log(
        `  ${secretary}: ${stats.compliant + stats.violated} demands, ${rate}% compliance`,
      );
    });
  }

  private async createOverdueNotification(demand: any) {
    try {
      // Notify the assigned user if exists
      if (demand.assignedToId) {
        await this.prisma.notification.create({
          data: {
            title: 'Demanda em atraso',
            message: `A demanda #${demand.protocol} está em atraso e requer atenção imediata.`,
            type: 'SLA_EXPIRED',
            userId: demand.assignedToId,
          },
        });
      }

      // Create audit log
      await this.prisma.auditLog.create({
        data: {
          action: 'SLA_VIOLATION',
          entity: 'Demand',
          entityId: demand.id,
          details: {
            protocol: demand.protocol,
            priority: demand.priority,
            secretaryId: demand.secretaryId,
            createdAt: demand.createdAt,
          },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create overdue notification: ${error}`);
    }
  }

  // Get current SLA metrics
  async getSlaMetrics() {
    const openStatuses = [
      DemandStatus.PENDING,
      DemandStatus.IN_PROGRESS,
      DemandStatus.WAITING_INFO,
    ];

    const metrics = await Promise.all(
      this.slaRules.map(async (rule) => {
        const overdueThreshold = new Date();
        overdueThreshold.setHours(overdueThreshold.getHours() - rule.maxHours);
        
        const warningThreshold = new Date();
        warningThreshold.setHours(warningThreshold.getHours() - rule.warningHours);

        const totalOpen = await this.prisma.demand.count({
          where: {
            priority: rule.priority,
            status: { in: openStatuses },
          },
        });

        const overdue = await this.prisma.demand.count({
          where: {
            priority: rule.priority,
            status: { in: openStatuses },
            OR: [
              { slaDeadline: { lt: new Date() } },
              { createdAt: { lt: overdueThreshold }, slaDeadline: null },
            ],
          },
        });

        const approaching = await this.prisma.demand.count({
          where: {
            priority: rule.priority,
            status: { in: openStatuses },
            createdAt: {
              lt: warningThreshold,
              gte: overdueThreshold,
            },
            slaDeadline: null,
          },
        });

        return {
          priority: rule.priority,
          maxHours: rule.maxHours,
          totalOpen,
          overdue,
          approaching,
          healthy: totalOpen - overdue - approaching,
        };
      }),
    );

    return metrics;
  }
}
