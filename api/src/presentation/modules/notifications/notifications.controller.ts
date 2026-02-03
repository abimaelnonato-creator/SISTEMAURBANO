import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Notificações')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar notificações do usuário' })
  @ApiResponse({ status: 200, description: 'Lista de notificações retornada com sucesso' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  findAll(
    @CurrentUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('unreadOnly') unreadOnly?: boolean,
  ) {
    return this.notificationsService.findByUser(
      user.id,
      page,
      limit,
      unreadOnly === true || unreadOnly === 'true' as any,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Contar notificações não lidas' })
  @ApiResponse({ status: 200, description: 'Contagem retornada com sucesso' })
  async getUnreadCount(@CurrentUser() user: User) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { count };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marcar notificação como lida' })
  @ApiParam({ name: 'id', description: 'ID da notificação' })
  @ApiResponse({ status: 200, description: 'Notificação marcada como lida' })
  markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Marcar todas as notificações como lidas' })
  @ApiResponse({ status: 200, description: 'Notificações marcadas como lidas' })
  async markAllAsRead(@CurrentUser() user: User) {
    const count = await this.notificationsService.markAllAsRead(user.id);
    return { count };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir notificação' })
  @ApiParam({ name: 'id', description: 'ID da notificação' })
  @ApiResponse({ status: 204, description: 'Notificação excluída com sucesso' })
  delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.notificationsService.delete(id, user.id);
  }

  @Delete()
  @ApiOperation({ summary: 'Excluir todas as notificações' })
  @ApiResponse({ status: 200, description: 'Notificações excluídas com sucesso' })
  async deleteAll(@CurrentUser() user: User) {
    const count = await this.notificationsService.deleteAll(user.id);
    return { count };
  }
}
