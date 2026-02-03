import {
  Controller,
  Get,
  Query,
  Param,
  Res,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ReportsService, ReportFilters } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, DemandStatus, Priority, DemandSource } from '@prisma/client';

@ApiTags('Relatórios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.COORDINATOR)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('general')
  @ApiOperation({ summary: 'Relatório geral' })
  @ApiResponse({ status: 200, description: 'Relatório gerado com sucesso' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'secretaryId', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: DemandStatus })
  @ApiQuery({ name: 'priority', required: false, enum: Priority })
  @ApiQuery({ name: 'source', required: false, enum: DemandSource })
  generateGeneralReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('secretaryId') secretaryId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: DemandStatus,
    @Query('priority') priority?: Priority,
    @Query('source') source?: DemandSource,
  ) {
    const filters: ReportFilters = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      secretaryId,
      categoryId,
      status,
      priority,
      source,
    };

    return this.reportsService.generateGeneralReport(filters);
  }

  @Get('secretary/:secretaryId')
  @ApiOperation({ summary: 'Relatório por secretaria' })
  @ApiParam({ name: 'secretaryId', description: 'ID da secretaria' })
  @ApiResponse({ status: 200, description: 'Relatório gerado com sucesso' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  generateSecretaryReport(
    @Param('secretaryId', ParseUUIDPipe) secretaryId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: ReportFilters = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    return this.reportsService.generateSecretaryReport(secretaryId, filters);
  }

  @Get('performance')
  @ApiOperation({ summary: 'Relatório de desempenho' })
  @ApiResponse({ status: 200, description: 'Relatório gerado com sucesso' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'secretaryId', required: false })
  generatePerformanceReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('secretaryId') secretaryId?: string,
  ) {
    const filters: ReportFilters = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      secretaryId,
    };

    return this.reportsService.generatePerformanceReport(filters);
  }

  @Get('neighborhoods')
  @ApiOperation({ summary: 'Relatório por bairros' })
  @ApiResponse({ status: 200, description: 'Relatório gerado com sucesso' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'secretaryId', required: false })
  generateNeighborhoodReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('secretaryId') secretaryId?: string,
  ) {
    const filters: ReportFilters = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      secretaryId,
    };

    return this.reportsService.generateNeighborhoodReport(filters);
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Exportar demandas para CSV' })
  @ApiResponse({ status: 200, description: 'CSV gerado com sucesso' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'secretaryId', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: DemandStatus })
  async exportToCSV(
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('secretaryId') secretaryId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: DemandStatus,
  ) {
    const filters: ReportFilters = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      secretaryId,
      categoryId,
      status,
    };

    const csv = await this.reportsService.exportToCSV(filters);

    const filename = `demandas_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\ufeff' + csv); // BOM for Excel compatibility
  }
}
