import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { RedisService } from '@/infrastructure/cache/redis.service';
import { EmailService } from '@/shared/services/email.service';
import { LoginDto, RegisterDto, RefreshTokenDto } from './dto/auth.dto';
import { v4 as uuidv4 } from 'uuid';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  secretaryId?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { secretary: true },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuário desativado');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto): Promise<AuthTokens & { user: any }> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    const tokens = await this.generateTokens(user);

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        secretary: user.secretary,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<{ user: any }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: registerDto.name,
        email: registerDto.email,
        password: hashedPassword,
        role: registerDto.role || 'VIEWER',
        secretaryId: registerDto.secretaryId,
      },
      include: { secretary: true },
    });

    const { password: _, ...result } = user;
    return { user: result };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthTokens> {
    const { refreshToken } = refreshTokenDto;

    // Find refresh token in database
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { include: { secretary: true } } },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Token de atualização inválido');
    }

    if (storedToken.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
      throw new UnauthorizedException('Token de atualização expirado');
    }

    if (!storedToken.user.isActive) {
      throw new UnauthorizedException('Usuário desativado');
    }

    // Delete old refresh token
    await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });

    // Generate new tokens
    return this.generateTokens(storedToken.user);
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    } else {
      // Delete all refresh tokens for this user
      await this.prisma.refreshToken.deleteMany({
        where: { userId },
      });
    }

    // Add token to blacklist (optional, for access token invalidation)
    // await this.redisService.set(`blacklist:${userId}`, true, 900); // 15 min
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      // Don't reveal if email exists
      this.logger.debug(`Password reset requested for non-existent email: ${email}`);
      return;
    }

    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // Store reset token in Redis
    await this.redisService.set(
      `password-reset:${resetToken}`,
      { userId: user.id, email: user.email },
      3600, // 1 hour
    );

    // Send email with reset link
    const emailSent = await this.emailService.sendPasswordResetEmail(
      user.email,
      user.name,
      resetToken,
    );

    if (emailSent) {
      this.logger.log(`Password reset email sent to ${email}`);
    } else {
      this.logger.warn(`Password reset email could not be sent to ${email}. Token: ${resetToken}`);
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenData = await this.redisService.get<{ userId: string; email: string }>(
      `password-reset:${token}`,
    );

    if (!tokenData) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: tokenData.userId },
      data: { password: hashedPassword },
    });

    // Delete reset token
    await this.redisService.del(`password-reset:${token}`);

    // Invalidate all refresh tokens
    await this.prisma.refreshToken.deleteMany({
      where: { userId: tokenData.userId },
    });
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { secretary: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const { password: _, ...result } = user;
    return result;
  }

  private async generateTokens(user: any): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      secretaryId: user.secretaryId,
    };

    const accessToken = this.jwtService.sign(payload);
    
    const refreshToken = uuidv4();
    const refreshExpiresIn = this.configService.get<string>(
      'REFRESH_TOKEN_EXPIRES_IN',
      '7d',
    );
    
    // Parse refresh token expiry
    const days = parseInt(refreshExpiresIn.replace('d', ''));
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    // Store refresh token in database
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }
}
