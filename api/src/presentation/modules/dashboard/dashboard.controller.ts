import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role, User } from '@prisma/client';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Resumo geral do dashboard' })
  @ApiResponse({ status: 200, description: 'Resumo retornado com sucesso' })
  @ApiQuery({ name: 'secretaryId', required: false, description: 'Filtrar por secretaria' })
  getSummary(
    @Query('secretaryId') secretaryId?: string,
    @CurrentUser() user?: User,
  ) {
    // If user is operator, filter by their secretary
    const filterSecretaryId = user?.role === 'OPERATOR' && user.secretaryId
      ? user.secretaryId
      : secretaryId;
    
    return this.dashboardService.getSummary(filterSecretaryId);
  }

  @Get('charts')
  @ApiOperation({ summary: 'Dados para gráficos' })
  @ApiResponse({ status: 200, description: 'Dados retornados com sucesso' })
  @ApiQuery({ name: 'period', required: false, enum: ['week', 'month', 'year'] })
  @ApiQuery({ name: 'secretaryId', required: false })
  getChartData(
    @Query('period') period?: 'week' | 'month' | 'year',
    @Query('secretaryId') secretaryId?: string,
  ) {
    return this.dashboardService.getChartData(period, secretaryId);
  }

  @Get('status-distribution')
  @ApiOperation({ summary: 'Distribuição por status' })
  @ApiResponse({ status: 200, description: 'Distribuição retornada com sucesso' })
  @ApiQuery({ name: 'secretaryId', required: false })
  getStatusDistribution(@Query('secretaryId') secretaryId?: string) {
    return this.dashboardService.getStatusDistribution(secretaryId);
  }

  @Get('priority-distribution')
  @ApiOperation({ summary: 'Distribuição por prioridade' })
  @ApiResponse({ status: 200, description: 'Distribuição retornada com sucesso' })
  @ApiQuery({ name: 'secretaryId', required: false })
  getPriorityDistribution(@Query('secretaryId') secretaryId?: string) {
    return this.dashboardService.getPriorityDistribution(secretaryId);
  }

  @Get('category-distribution')
  @ApiOperation({ summary: 'Distribuição por categoria' })
  @ApiResponse({ status: 200, description: 'Distribuição retornada com sucesso' })
  @ApiQuery({ name: 'secretaryId', required: false })
  getCategoryDistribution(@Query('secretaryId') secretaryId?: string) {
    return this.dashboardService.getCategoryDistribution(secretaryId);
  }

  @Get('secretary-ranking')
  @Roles(Role.ADMIN, Role.COORDINATOR)
  @ApiOperation({ summary: 'Ranking de secretarias' })
  @ApiResponse({ status: 200, description: 'Ranking retornado com sucesso' })
  getSecretaryRanking() {
    return this.dashboardService.getSecretaryRanking();
  }

  @Get('recent-activity')
  @ApiOperation({ summary: 'Atividades recentes' })
  @ApiResponse({ status: 200, description: 'Atividades retornadas com sucesso' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getRecentActivity(@Query('limit') limit?: number) {
    return this.dashboardService.getRecentActivity(limit);
  }

  @Get('alerts')
  @Roles(Role.ADMIN, Role.COORDINATOR)
  @ApiOperation({ summary: 'Alertas do sistema' })
  @ApiResponse({ status: 200, description: 'Alertas retornados com sucesso' })
  getAlerts() {
    return this.dashboardService.getAlerts();
  }
}
