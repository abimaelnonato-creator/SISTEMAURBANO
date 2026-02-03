import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Role } from '@prisma/client';

export class LoginDto {
  @ApiProperty({ example: 'admin@parnamirim.rn.gov.br' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @ApiProperty({ example: 'admin123' })
  @IsString()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  name: string;

  @ApiProperty({ example: 'joao.silva@parnamirim.rn.gov.br' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;

  @ApiProperty({ example: 'senha123' })
  @IsString()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  @MaxLength(50, { message: 'Senha deve ter no máximo 50 caracteres' })
  password: string;

  @ApiPropertyOptional({ enum: Role, example: Role.OPERATOR })
  @IsOptional()
  @IsEnum(Role, { message: 'Role inválida' })
  role?: Role;

  @ApiPropertyOptional({ example: 'uuid-da-secretaria' })
  @IsOptional()
  @IsString()
  secretaryId?: string;
}

export class RefreshTokenDto {
  @ApiProperty({ example: 'uuid-do-refresh-token' })
  @IsString()
  refreshToken: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'usuario@parnamirim.rn.gov.br' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'token-de-reset' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'novaSenha123' })
  @IsString()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  @MaxLength(50, { message: 'Senha deve ter no máximo 50 caracteres' })
  password: string;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  expiresIn: number;

  @ApiProperty()
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    secretary?: {
      id: string;
      name: string;
      code: string;
    };
  };
}
