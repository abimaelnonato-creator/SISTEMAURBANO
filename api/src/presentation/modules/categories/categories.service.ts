import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto, QueryCategoriesDto } from './dto/categories.dto';
import { createPaginatedResult, PaginatedResult } from '@/shared/dto/pagination.dto';
import { Category } from '@prisma/client';
import { slugify } from '@/shared/utils/helpers';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryCategoriesDto): Promise<PaginatedResult<Category>> {
    const { page = 1, limit = 20, search, secretaryId, isActive, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (secretaryId) {
      where.secretaryId = secretaryId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [categories, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder || 'asc' } : { name: 'asc' },
        include: {
          secretary: {
            select: {
              id: true,
              name: true,
              acronym: true,
              color: true,
            },
          },
          _count: {
            select: {
              demands: true,
            },
          },
        },
      }),
      this.prisma.category.count({ where }),
    ]);

    return createPaginatedResult(categories, total, page, limit);
  }

  async findById(id: string): Promise<Category> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        secretary: true,
        _count: {
          select: {
            demands: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Categoria não encontrada');
    }

    return category;
  }

  async findBySecretary(secretaryId: string): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: {
        secretaryId,
        isActive: true,
      },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            demands: true,
          },
        },
      },
    });
  }

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    // Verify secretary exists
    const secretary = await this.prisma.secretary.findUnique({
      where: { id: createCategoryDto.secretaryId },
    });

    if (!secretary) {
      throw new BadRequestException('Secretaria não encontrada');
    }

    const slug = slugify(createCategoryDto.name);

    // Check for duplicate within the same secretary
    const existing = await this.prisma.category.findFirst({
      where: {
        secretaryId: createCategoryDto.secretaryId,
        slug,
      },
    });

    if (existing) {
      throw new ConflictException('Já existe uma categoria com este nome nesta secretaria');
    }

    return this.prisma.category.create({
      data: {
        ...createCategoryDto,
        slug,
      },
      include: {
        secretary: true,
      },
    });
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findById(id);

    const data: any = { ...updateCategoryDto };

    if (updateCategoryDto.name) {
      const slug = slugify(updateCategoryDto.name);

      // Check for duplicate within the same secretary
      const existing = await this.prisma.category.findFirst({
        where: {
          secretaryId: category.secretaryId,
          slug,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException('Já existe uma categoria com este nome nesta secretaria');
      }

      data.slug = slug;
    }

    if (updateCategoryDto.secretaryId) {
      const secretary = await this.prisma.secretary.findUnique({
        where: { id: updateCategoryDto.secretaryId },
      });

      if (!secretary) {
        throw new BadRequestException('Secretaria não encontrada');
      }
    }

    return this.prisma.category.update({
      where: { id },
      data,
      include: {
        secretary: true,
      },
    });
  }

  async deactivate(id: string): Promise<void> {
    await this.findById(id);

    await this.prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async activate(id: string): Promise<Category> {
    await this.findById(id);

    return this.prisma.category.update({
      where: { id },
      data: { isActive: true },
      include: {
        secretary: true,
      },
    });
  }

  async getStats(id: string) {
    const category = await this.findById(id);

    const [totalDemands, openDemands, resolvedDemands] = await Promise.all([
      this.prisma.demand.count({ where: { categoryId: id } }),
      this.prisma.demand.count({ where: { categoryId: id, status: 'OPEN' } }),
      this.prisma.demand.count({ where: { categoryId: id, status: 'RESOLVED' } }),
    ]);

    return {
      category,
      stats: {
        totalDemands,
        openDemands,
        resolvedDemands,
        resolutionRate: totalDemands > 0 ? ((resolvedDemands / totalDemands) * 100).toFixed(1) : 0,
      },
    };
  }
}
