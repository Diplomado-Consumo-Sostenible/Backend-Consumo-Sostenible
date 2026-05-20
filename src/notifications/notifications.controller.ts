import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/jwt-auth/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { CurrentUser } from 'src/auth/decorator/user.decorator';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('my')
  @Roles('owner', 'ADMIN', 'USER')
  @ApiOperation({ summary: 'Historial de notificaciones del usuario autenticado' })
  getMyNotifications(
    @CurrentUser() user: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.notificationsService.getMyNotifications(
      user,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  @Patch(':id/read')
  @Roles('owner', 'ADMIN', 'USER')
  @ApiOperation({ summary: 'Marcar una notificación como leída' })
  markRead(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.notificationsService.markRead(id, user);
  }

  @Patch('read-all')
  @Roles('owner', 'ADMIN', 'USER')
  @ApiOperation({ summary: 'Marcar todas las notificaciones como leídas' })
  markAllRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllRead(user);
  }

  @Delete(':id')
  @Roles('owner', 'ADMIN', 'USER')
  @ApiOperation({ summary: 'Eliminar una notificación' })
  deleteNotification(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.notificationsService.deleteNotification(id, user);
  }
}
