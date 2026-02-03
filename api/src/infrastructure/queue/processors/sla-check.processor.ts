import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger, Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { QUEUES } from '../queue.constants';

@Injectable()
@Processor(QUEUES.SLA_CHECK)
export class SLACheckProcessor extends WorkerHost {
  private readonly logger = new Logger(SLACheckProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(_job: Job<void>): Promise<{ checked: number; overdue: number }> {
    this.logger.log('⏰ Starting SLA check job');

    try {
      const now = new Date();

      // Find all demands that should be checked
      const demands = await this.prisma.demand.findMany({
        where: {
          status: {
            in: ['OPEN', 'IN_PROGRESS', 'PENDING'],
          },
          slaDeadline: {
            lte: now,
          },
        },
        include: {
          secretary: true,
          category: true,
          assignedTo: true,
        },
      });

      let overdueCount = 0;

      for (const demand of demands) {
        // Create history entry for SLA exceeded
        await this.prisma.demandHistory.create({
          data: {
            demandId: demand.id,
            action: 'SLA_EXCEEDED',
            description: `SLA excedido. Prazo era: ${demand.slaDeadline?.toLocaleString('pt-BR')}`,
          },
        });

        // Create notification for assigned user and secretary admins
        const notifyUserIds: string[] = [];
        
        if (demand.assignedToId) {
          notifyUserIds.push(demand.assignedToId);
        }

        // Get secretary admins
        const secretaryAdmins = await this.prisma.user.findMany({
          where: {
            secretaryId: demand.secretaryId,
            role: { in: ['COORDINATOR', 'ADMIN'] },
            isActive: true,
          },
          select: { id: true },
        });

        notifyUserIds.push(...secretaryAdmins.map(u => u.id));

        // Create notifications
        if (notifyUserIds.length > 0) {
          await this.prisma.notification.createMany({
            data: notifyUserIds.map(userId => ({
              userId,
              title: '⚠️ SLA Excedido',
              message: `Demanda ${demand.protocol} ultrapassou o prazo de atendimento.`,
              type: 'warning',
              data: { demandId: demand.id, priority: 'HIGH' },
            })),
          });
        }

        overdueCount++;
        this.logger.warn(`⚠️ Demand ${demand.protocol} marked as overdue`);
      }

      this.logger.log(`✅ SLA check completed: ${demands.length} checked, ${overdueCount} marked overdue`);

      return { checked: demands.length, overdue: overdueCount };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error in SLA check: ${errorMessage}`);
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(_job: Job, result: { checked: number; overdue: number }) {
    this.logger.log(`✅ SLA check job completed: ${result.checked} demands checked, ${result.overdue} overdue`);
  }

  @OnWorkerEvent('failed')
  onFailed(_job: Job, error: Error) {
    this.logger.error(`❌ SLA check job failed: ${error.message}`);
  }
}
