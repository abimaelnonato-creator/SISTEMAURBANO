import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common'
import { DemandStatus, Priority } from '@prisma/client'
import { SecretaryService } from './secretary.service'
import { CreateSecretaryDto } from './dto/create-secretary.dto'
import { UpdateSecretaryDto } from './dto/update-secretary.dto'

type SecretaryDemandQueryDto = {
  status?: string
  priority?: string
  categoryId?: string
  search?: string
  page?: number
  limit?: number
}

const normalizeStatus = (value?: string): DemandStatus | undefined => {
  if (!value) return undefined
  const normalized = value.toUpperCase() as DemandStatus
  return Object.values(DemandStatus).includes(normalized) ? normalized : undefined
}

const normalizePriority = (value?: string): Priority | undefined => {
  if (!value) return undefined
  const normalized = value.toUpperCase() as Priority
  return Object.values(Priority).includes(normalized) ? normalized : undefined
}

@Controller('secretary')
export class SecretaryController {
  constructor(private readonly secretaryService: SecretaryService) {}

  @Get()
  findAll() {
    return this.secretaryService.findAll()
  }

  @Get('code/:code')
  findByCode(@Param('code') code: string) {
    return this.secretaryService.findByCode(code)
  }

  @Get(':id')
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.secretaryService.findById(id)
  }

  @Get(':id/quick-stats')
  getQuickStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.secretaryService.getQuickStats(id)
  }

  @Get(':id/stats')
  getDetailedStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.secretaryService.getDetailedStats(id)
  }

  @Get(':id/demands')
  getDemands(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: SecretaryDemandQueryDto,
  ) {
    const status = normalizeStatus(query.status)
    const priority = normalizePriority(query.priority)

    return this.secretaryService.getDemands(id, {
      status,
      priority,
      categoryId: query.categoryId,
      search: query.search,
      page: query.page ? Number(query.page) : undefined,
      limit: query.limit ? Number(query.limit) : undefined,
    })
  }

  @Get(':id/team')
  getTeam(@Param('id', ParseUUIDPipe) id: string) {
    return this.secretaryService.getTeam(id)
  }

  @Get(':id/categories')
  getCategories(@Param('id', ParseUUIDPipe) id: string) {
    return this.secretaryService.getCategories(id)
  }

  @Get(':id/activity')
  getRecentActivity(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: number,
  ) {
    return this.secretaryService.getRecentActivity(id, limit ? Number(limit) : 20)
  }

  @Get(':id/overdue')
  getOverdue(@Param('id', ParseUUIDPipe) id: string) {
    return this.secretaryService.getOverdueDemands(id)
  }

  @Get(':id/critical')
  getCritical(@Param('id', ParseUUIDPipe) id: string) {
    return this.secretaryService.getCriticalDemands(id)
  }

  @Post()
  create(@Body() data: CreateSecretaryDto) {
    return this.secretaryService.create(data)
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateSecretaryDto,
  ) {
    return this.secretaryService.update(id, data)
  }
}
