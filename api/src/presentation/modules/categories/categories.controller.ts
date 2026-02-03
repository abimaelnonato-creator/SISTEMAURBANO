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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto, QueryCategoriesDto } from './dto/categories.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Categorias')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas as categorias' })
  @ApiResponse({ status: 200, description: 'Lista de categorias retornada com sucesso' })
  findAll(@Query() query: QueryCategoriesDto) {
    return this.categoriesService.findAll(query);
  }

  @Get('secretary/:secretaryId')
  @ApiOperation({ summary: 'Listar categorias por secretaria' })
  @ApiParam({ name: 'secretaryId', description: 'ID da secretaria' })
  @ApiResponse({ status: 200, description: 'Lista de categorias retornada com sucesso' })
  findBySecretary(@Param('secretaryId', ParseUUIDPipe) secretaryId: string) {
    return this.categoriesService.findBySecretary(secretaryId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar categoria por ID' })
  @ApiParam({ name: 'id', description: 'ID da categoria' })
  @ApiResponse({ status: 200, description: 'Categoria encontrada com sucesso' })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findById(id);
  }

  @Get(':id/stats')
  @Roles(Role.ADMIN, Role.COORDINATOR)
  @ApiOperation({ summary: 'Obter estatísticas da categoria' })
  @ApiParam({ name: 'id', description: 'ID da categoria' })
  @ApiResponse({ status: 200, description: 'Estatísticas retornadas com sucesso' })
  getStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.getStats(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.COORDINATOR)
  @ApiOperation({ summary: 'Criar nova categoria' })
  @ApiResponse({ status: 201, description: 'Categoria criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Categoria já existe' })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.COORDINATOR)
  @ApiOperation({ summary: 'Atualizar categoria' })
  @ApiParam({ name: 'id', description: 'ID da categoria' })
  @ApiResponse({ status: 200, description: 'Categoria atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Patch(':id/activate')
  @Roles(Role.ADMIN, Role.COORDINATOR)
  @ApiOperation({ summary: 'Ativar categoria' })
  @ApiParam({ name: 'id', description: 'ID da categoria' })
  @ApiResponse({ status: 200, description: 'Categoria ativada com sucesso' })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.activate(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.COORDINATOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desativar categoria' })
  @ApiParam({ name: 'id', description: 'ID da categoria' })
  @ApiResponse({ status: 204, description: 'Categoria desativada com sucesso' })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.deactivate(id);
  }
}
