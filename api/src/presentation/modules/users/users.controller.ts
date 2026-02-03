import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UpdateRoleDto, QueryUsersDto } from './dto/users.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Usuários')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.ADMIN, Role.COORDINATOR)
  @ApiOperation({ summary: 'Listar todos os usuários' })
  @ApiResponse({ status: 200, description: 'Lista de usuários retornada com sucesso' })
  findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  @Get('me')
  @ApiOperation({ summary: 'Obter dados do usuário logado' })
  @ApiResponse({ status: 200, description: 'Dados do usuário retornados com sucesso' })
  getProfile(@CurrentUser() user: any) {
    return this.usersService.findById(user.id);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Obter estatísticas do usuário logado' })
  @ApiResponse({ status: 200, description: 'Estatísticas retornadas com sucesso' })
  getMyStats(@CurrentUser() user: any) {
    return this.usersService.getUserStats(user.id);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.COORDINATOR)
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  @ApiResponse({ status: 200, description: 'Usuário encontrado com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }

  @Get(':id/stats')
  @Roles(Role.ADMIN, Role.COORDINATOR)
  @ApiOperation({ summary: 'Obter estatísticas de um usuário' })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  @ApiResponse({ status: 200, description: 'Estatísticas retornadas com sucesso' })
  getUserStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getUserStats(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Criar novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'E-mail já cadastrado' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Atualizar usuário' })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Atualizar dados do próprio perfil' })
  @ApiResponse({ status: 200, description: 'Perfil atualizado com sucesso' })
  updateProfile(
    @CurrentUser() user: any,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    // Remove role from update to prevent privilege escalation
    const { role, ...safeUpdate } = updateUserDto;
    return this.usersService.update(user.id, safeUpdate);
  }

  @Patch(':id/role')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Atualizar papel/função do usuário' })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  @ApiResponse({ status: 200, description: 'Papel atualizado com sucesso' })
  updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.usersService.updateRole(id, updateRoleDto.role);
  }

  @Patch(':id/activate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Ativar usuário' })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  @ApiResponse({ status: 200, description: 'Usuário ativado com sucesso' })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.activate(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desativar usuário' })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  @ApiResponse({ status: 204, description: 'Usuário desativado com sucesso' })
  @ApiResponse({ status: 400, description: 'Não é possível desativar o último administrador' })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.deactivate(id);
  }
}
