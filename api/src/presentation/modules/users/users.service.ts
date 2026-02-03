import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { CreateUserDto, UpdateUserDto, QueryUsersDto } from './dto/users.dto';
import { createPaginatedResult, PaginatedResult } from '@/shared/dto/pagination.dto';
import { User, Role } from '@prisma/client';

// User select without password
const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  avatar: true,
  secretaryId: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  secretary: true,
} as const;

type UserWithoutPassword = Omit<User, 'password'>;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryUsersDto): Promise<PaginatedResult<UserWithoutPassword>> {
    const { page = 1, limit = 20, search, role, secretaryId, isActive, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (secretaryId) {
      where.secretaryId = secretaryId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder || 'desc' } : { createdAt: 'desc' },
        select: userSelect,
      }),
      this.prisma.user.count({ where }),
    ]);

    return createPaginatedResult(users as UserWithoutPassword[], total, page, limit);
  }

  async findById(id: string): Promise<UserWithoutPassword> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user as UserWithoutPassword;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(createUserDto: CreateUserDto): Promise<UserWithoutPassword> {
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
      select: userSelect,
    });

    return user as UserWithoutPassword;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserWithoutPassword> {
    await this.findById(id);

    if (updateUserDto.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('E-mail já cadastrado');
      }
    }

    const data: any = { ...updateUserDto };

    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });

    return user as UserWithoutPassword;
  }

  async updateRole(id: string, role: Role): Promise<UserWithoutPassword> {
    await this.findById(id);

    const user = await this.prisma.user.update({
      where: { id },
      data: { role },
      select: userSelect,
    });

    return user as UserWithoutPassword;
  }

  async deactivate(id: string): Promise<void> {
    const user = await this.findById(id);

    if (user.role === Role.ADMIN) {
      // Check if this is the last admin
      const adminCount = await this.prisma.user.count({
        where: { role: Role.ADMIN, isActive: true },
      });

      if (adminCount <= 1) {
        throw new BadRequestException('Não é possível desativar o último administrador');
      }
    }

    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async activate(id: string): Promise<UserWithoutPassword> {
    await this.findById(id);

    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: userSelect,
    });

    return user as UserWithoutPassword;
  }

  async getUserStats(id: string) {
    const user = await this.findById(id);

    const [assignedDemands, resolvedDemands, actions] = await Promise.all([
      this.prisma.demand.count({
        where: { assignedToId: id },
      }),
      this.prisma.demand.count({
        where: { assignedToId: id, status: 'RESOLVED' },
      }),
      this.prisma.demandHistory.count({
        where: { userId: id },
      }),
    ]);

    return {
      user,
      stats: {
        assignedDemands,
        resolvedDemands,
        totalActions: actions,
      },
    };
  }
}
