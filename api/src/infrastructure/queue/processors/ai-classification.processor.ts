import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger, Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { QUEUES } from '../queue.constants';

export interface AIClassificationJobData {
  demandId: string;
  text: string;
  imageUrls?: string[];
  autoAssign?: boolean;
}

export interface ClassificationResult {
  category: string;
  categoryId?: string;
  secretaryId?: string;
  confidence: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  suggestedTitle: string;
  keywords: string[];
}

@Injectable()
@Processor(QUEUES.AI_CLASSIFICATION)
export class AIClassificationProcessor extends WorkerHost {
  private readonly logger = new Logger(AIClassificationProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<AIClassificationJobData>): Promise<ClassificationResult> {
    const { demandId, text, imageUrls, autoAssign } = job.data;

    this.logger.log(`🤖 Processing AI classification for demand ${demandId}`);

    try {
      // Get AI Classification Service
      // This would be injected in a real implementation
      const result = await this.classifyDemand(text, imageUrls);

      // Update demand with classification results
      if (result.categoryId || result.secretaryId) {
        const updateData: any = {
          aiConfidence: result.confidence,
          aiClassifiedAt: new Date(),
        };

        if (result.suggestedTitle) {
          updateData.title = result.suggestedTitle;
        }

        if (autoAssign && result.categoryId && result.secretaryId) {
          updateData.categoryId = result.categoryId;
          updateData.secretaryId = result.secretaryId;
          updateData.priority = result.priority;
          updateData.status = 'ASSIGNED';

          // Add to history
          await this.prisma.demandHistory.create({
            data: {
              demandId,
              action: 'AUTO_ASSIGNED',
              description: `Demanda classificada automaticamente por IA. Categoria: ${result.category}. Confiança: ${(result.confidence * 100).toFixed(0)}%`,
            },
          });
        }

        await this.prisma.demand.update({
          where: { id: demandId },
          data: updateData,
        });
      }

      this.logger.log(`✅ Demand ${demandId} classified as: ${result.category} (${(result.confidence * 100).toFixed(0)}%)`);
      
      return result;
    } catch (error: any) {
      this.logger.error(`Error classifying demand ${demandId}: ${error.message}`);
      throw error;
    }
  }

  private async classifyDemand(text: string, imageUrls?: string[]): Promise<ClassificationResult> {
    // Fallback classification using keywords
    // In production, this would call AIClassificationService
    
    const normalizedText = text.toLowerCase();
    
    // Keyword-based classification
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      include: { secretary: true },
    });

    for (const category of categories) {
      const keywords = category.keywords || [];
      const matchCount = keywords.filter((kw: string) => 
        normalizedText.includes(kw.toLowerCase())
      ).length;

      if (matchCount > 0) {
        return {
          category: category.name,
          categoryId: category.id,
          secretaryId: category.secretaryId,
          confidence: Math.min(matchCount * 0.25, 0.95),
          priority: (category as any).defaultPriority || 'MEDIUM',
          suggestedTitle: text.substring(0, 60),
          keywords: keywords.filter((kw: string) => normalizedText.includes(kw.toLowerCase())),
        };
      }
    }

    return {
      category: 'Outros',
      confidence: 0.3,
      priority: 'MEDIUM',
      suggestedTitle: text.substring(0, 60),
      keywords: [],
    };
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<AIClassificationJobData>) {
    this.logger.log(`✅ AI classification job ${job.id} completed for demand ${job.data.demandId}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<AIClassificationJobData>, error: Error) {
    this.logger.error(`❌ AI classification job ${job.id} failed: ${error.message}`);
  }
}
