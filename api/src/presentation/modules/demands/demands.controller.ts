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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { DemandsService } from './demands.service';
import {
  CreateDemandDto,
  UpdateDemandDto,
  UpdateStatusDto,
  AssignDemandDto,
  AddCommentDto,
  QueryDemandsDto,
  GeoQueryDto,
  ResolveDemandDto,
} from './dto/demands.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Role, User } from '@prisma/client';

@ApiTags('Demandas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('demands')
export class DemandsController {
  constructor(private readonly demandsService: DemandsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas as demandas' })
  @ApiResponse({ status: 200, description: 'Lista de demandas retornada com sucesso' })
  findAll(@Query() query: QueryDemandsDto, @CurrentUser() user: User) {
    return this.demandsService.findAll(query, user);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Buscar demandas próximas a uma localização' })
  @ApiResponse({ status: 200, description: 'Lista de demandas próximas retornada' })
  findNearby(@Query() geoQuery: GeoQueryDto) {
    return this.demandsService.findNearby(geoQuery);
  }

  @Get('neighborhoods/stats')
  @ApiOperation({ summary: 'Estatísticas por bairro' })
  @ApiResponse({ status: 200, description: 'Estatísticas por bairro retornadas' })
  getNeighborhoodStats() {
    return this.demandsService.getNeighborhoodStats();
  }

  @Get('protocol/:protocol')
  @Public()
  @ApiOperation({ summary: 'Consultar demanda por protocolo' })
  @ApiParam({ name: 'protocol', description: 'Número do protocolo' })
  @ApiResponse({ status: 200, description: 'Demanda encontrada com sucesso' })
  @ApiResponse({ status: 404, description: 'Demanda não encontrada' })
  findByProtocol(@Param('protocol') protocol: string) {
    return this.demandsService.findByProtocol(protocol);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar demanda por ID' })
  @ApiParam({ name: 'id', description: 'ID da demanda' })
  @ApiResponse({ status: 200, description: 'Demanda encontrada com sucesso' })
  @ApiResponse({ status: 404, description: 'Demanda não encontrada' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.demandsService.findById(id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Histórico de uma demanda' })
  @ApiParam({ name: 'id', description: 'ID da demanda' })
  @ApiResponse({ status: 200, description: 'Histórico retornado com sucesso' })
  getHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.demandsService.getHistory(id);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Comentários de uma demanda' })
  @ApiParam({ name: 'id', description: 'ID da demanda' })
  @ApiResponse({ status: 200, description: 'Comentários retornados com sucesso' })
  getComments(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    const includeInternal = ['ADMIN', 'COORDINATOR', 'OPERATOR'].includes(user.role);
    return this.demandsService.getComments(id, includeInternal);
  }

  @Post()
  @ApiOperation({ summary: 'Criar nova demanda' })
  @ApiResponse({ status: 201, description: 'Demanda criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  create(@Body() createDemandDto: CreateDemandDto, @CurrentUser() user: User) {
    return this.demandsService.create(createDemandDto, user.id);
  }

  @Post('public')
  @Public()
  @ApiOperation({ summary: 'Criar demanda pública (sem autenticação)' })
  @ApiResponse({ status: 201, description: 'Demanda criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  createPublic(@Body() createDemandDto: CreateDemandDto) {
    return this.demandsService.create(createDemandDto);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.COORDINATOR, Role.OPERATOR)
  @ApiOperation({ summary: 'Atualizar demanda' })
  @ApiParam({ name: 'id', description: 'ID da demanda' })
  @ApiResponse({ status: 200, description: 'Demanda atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Demanda não encontrada' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDemandDto: UpdateDemandDto,
    @CurrentUser() user: User,
  ) {
    return this.demandsService.update(id, updateDemandDto, user.id);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.COORDINATOR, Role.OPERATOR)
  @ApiOperation({ summary: 'Atualizar status da demanda' })
  @ApiParam({ name: 'id', description: 'ID da demanda' })
  @ApiResponse({ status: 200, description: 'Status atualizado com sucesso' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.demandsService.updateStatus(id, updateStatusDto, user.id);
  }

  @Patch(':id/assign')
  @Roles(Role.ADMIN, Role.COORDINATOR)
  @ApiOperation({ summary: 'Atribuir demanda a um usuário' })
  @ApiParam({ name: 'id', description: 'ID da demanda' })
  @ApiResponse({ status: 200, description: 'Demanda atribuída com sucesso' })
  assignDemand(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignDto: AssignDemandDto,
    @CurrentUser() user: User,
  ) {
    return this.demandsService.assignDemand(id, assignDto.assignedToId, user.id);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Adicionar comentário a uma demanda' })
  @ApiParam({ name: 'id', description: 'ID da demanda' })
  @ApiResponse({ status: 201, description: 'Comentário adicionado com sucesso' })
  addComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() addCommentDto: AddCommentDto,
    @CurrentUser() user: User,
  ) {
    return this.demandsService.addComment(id, addCommentDto, user.id);
  }

  @Post(':id/resolve')
  @Roles(Role.ADMIN, Role.COORDINATOR, Role.OPERATOR)
  @UseInterceptors(FileInterceptor('resolutionImage'))
  @ApiOperation({ summary: 'Resolver demanda com imagem e notificar cidadão via WhatsApp' })
  @ApiParam({ name: 'id', description: 'ID da demanda' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        resolutionComment: { type: 'string', description: 'Descrição da solução' },
        notifyCitizen: { type: 'boolean', description: 'Notificar cidadão via WhatsApp' },
        resolutionImage: { type: 'string', format: 'binary', description: 'Imagem do problema resolvido' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Demanda resolvida com sucesso' })
  @ApiResponse({ status: 404, description: 'Demanda não encontrada' })
  resolveWithImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() resolveDto: ResolveDemandDto,
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log('🔵 Controller: resolveWithImage chamado', { id, resolveDto, userId: user?.id, file: file?.originalname });
    return this.demandsService.resolveWithImage(id, resolveDto, user.id, file);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.COORDINATOR)
  @ApiOperation({ summary: 'Excluir demanda' })
  @ApiParam({ name: 'id', description: 'ID da demanda' })
  @ApiResponse({ status: 200, description: 'Demanda excluída com sucesso' })
  @ApiResponse({ status: 404, description: 'Demanda não encontrada' })
  delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.demandsService.delete(id, user.id);
  }
}
