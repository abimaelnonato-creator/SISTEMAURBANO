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
  ApiQuery,
} from '@nestjs/swagger';
import { SecretariesService } from './secretaries.service';
import { CreateSecretaryDto, UpdateSecretaryDto, QuerySecretariesDto } from './dto/secretaries.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { DemandStatus, Priority, Role } from '@prisma/client';

type SecretaryDemandQueryDto = {
  status?: string;
  priority?: string;
  categoryId?: string;
  search?: string;
  page?: number;
  limit?: number;
};

const normalizeStatus = (value?: string) => {
  if (!value) return undefined;
  const normalized = value.toUpperCase() as DemandStatus;
  return Object.values(DemandStatus).includes(normalized) ? normalized : undefined;
};

const normalizePriority = (value?: string) => {
  if (!value) return undefined;
  const normalized = value.toUpperCase() as Priority;
  return Object.values(Priority).includes(normalized) ? normalized : undefined;
};

@ApiTags('Secretarias')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('secretaries')
export class SecretariesController {
  constructor(private readonly secretariesService: SecretariesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas as secretarias' })
  @ApiResponse({ status: 200, description: 'Lista de secretarias retornada com sucesso' })
  findAll(@Query() query: QuerySecretariesDto) {
    return this.secretariesService.findAll(query);
  }

  @Get('active')
  @ApiOperation({ summary: 'Listar secretarias ativas com categorias' })
  @ApiResponse({ status: 200, description: 'Lista de secretarias ativas retornada com sucesso' })
  findAllActive() {
    return this.secretariesService.getAllActive();
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Buscar secretaria por código ou sigla' })
  @ApiParam({ name: 'code', description: 'Código, slug ou sigla da secretaria' })
  findByCode(@Param('code') code: string) {
    return this.secretariesService.findByCode(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar secretaria por ID' })
  @ApiParam({ name: 'id', description: 'ID da secretaria' })
  @ApiResponse({ status: 200, description: 'Secretaria encontrada com sucesso' })
  @ApiResponse({ status: 404, description: 'Secretaria não encontrada' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.secretariesService.findById(id);
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'Buscar secretaria por slug' })
  @ApiParam({ name: 'slug', description: 'Slug da secretaria' })
  @ApiResponse({ status: 200, description: 'Secretaria encontrada com sucesso' })
  @ApiResponse({ status: 404, description: 'Secretaria não encontrada' })
  findBySlug(@Param('slug') slug: string) {
    return this.secretariesService.findBySlug(slug);
  }

  @Get(':id/stats')
  @Roles(Role.ADMIN, Role.COORDINATOR)
  @ApiOperation({ summary: 'Obter estatísticas rápidas da secretaria' })
  @ApiParam({ name: 'id', description: 'ID da secretaria' })
  @ApiResponse({ status: 200, description: 'Estatísticas retornadas com sucesso' })
  getStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.secretariesService.getQuickStats(id);
  }

  @Get(':id/stats/detailed')
  @Roles(Role.ADMIN, Role.COORDINATOR)
  @ApiOperation({ summary: 'Obter estatísticas detalhadas da secretaria' })
  @ApiParam({ name: 'id', description: 'ID da secretaria' })
  getDetailedStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.secretariesService.getDetailedStats(id);
  }

  @Get(':id/demands')
  @ApiOperation({ summary: 'Listar demandas da secretaria' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getDemands(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: SecretaryDemandQueryDto,
  ) {
    const status = normalizeStatus(query.status);
    const priority = normalizePriority(query.priority);

    return this.secretariesService.getDemands(id, {
      status,
      priority,
      categoryId: query.categoryId,
      search: query.search,
      page: query.page ? Number(query.page) : undefined,
      limit: query.limit ? Number(query.limit) : undefined,
    });
  }

  @Get(':id/team')
  @ApiOperation({ summary: 'Equipe da secretaria' })
  getTeam(@Param('id', ParseUUIDPipe) id: string) {
    return this.secretariesService.getTeam(id);
  }

  @Get(':id/categories')
  @ApiOperation({ summary: 'Categorias da secretaria' })
  getCategories(@Param('id', ParseUUIDPipe) id: string) {
    return this.secretariesService.getCategories(id);
  }

  @Get(':id/activity')
  @ApiOperation({ summary: 'Atividade recente da secretaria' })
  @ApiQuery({ name: 'limit', required: false })
  getRecentActivity(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: number,
  ) {
    return this.secretariesService.getRecentActivity(id, limit ? Number(limit) : 20);
  }

  @Get(':id/overdue')
  @ApiOperation({ summary: 'Demandas atrasadas da secretaria' })
  getOverdue(@Param('id', ParseUUIDPipe) id: string) {
    return this.secretariesService.getOverdueDemands(id);
  }

  @Get(':id/critical')
  @ApiOperation({ summary: 'Demandas críticas da secretaria' })
  getCritical(@Param('id', ParseUUIDPipe) id: string) {
    return this.secretariesService.getCriticalDemands(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Criar nova secretaria' })
  @ApiResponse({ status: 201, description: 'Secretaria criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Secretaria já existe' })
  create(@Body() createSecretaryDto: CreateSecretaryDto) {
    return this.secretariesService.create(createSecretaryDto);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Atualizar secretaria' })
  @ApiParam({ name: 'id', description: 'ID da secretaria' })
  @ApiResponse({ status: 200, description: 'Secretaria atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Secretaria não encontrada' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSecretaryDto: UpdateSecretaryDto,
  ) {
    return this.secretariesService.update(id, updateSecretaryDto);
  }

  @Patch(':id/activate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Ativar secretaria' })
  @ApiParam({ name: 'id', description: 'ID da secretaria' })
  @ApiResponse({ status: 200, description: 'Secretaria ativada com sucesso' })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.secretariesService.activate(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desativar secretaria' })
  @ApiParam({ name: 'id', description: 'ID da secretaria' })
  @ApiResponse({ status: 204, description: 'Secretaria desativada com sucesso' })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.secretariesService.deactivate(id);
  }
}
