import {
  Body,
  Controller,
  Param,
  Patch,
  UseGuards,
  Get,
  ParseIntPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/jwt-auth/roles.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('user') // <-- Agrupa estos endpoints en la sección "user"
@ApiBearerAuth() // <-- Indica que se requiere token (candiadito en Swagger UI)
@Controller('user')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Obtener todos los usuarios' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios obtenida exitosamente.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado. Faltan credenciales.',
  })
  @ApiResponse({
    status: 403,
    description: 'Prohibido. Requiere rol de administrador.',
  })
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Obtener un usuario por su ID' })
  @ApiParam({ name: 'id', description: 'ID del usuario', type: 'number' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado exitosamente.' })
  @ApiResponse({
    status: 401,
    description: 'No autorizado. Faltan credenciales.',
  })
  @ApiResponse({
    status: 403,
    description: 'Prohibido. Requiere rol de administrador.',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Patch(':id/status')
  @Roles('admin')
  @ApiOperation({ summary: 'Activar o desactivar un usuario' })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario a modificar',
    type: 'number',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        isActive: {
          type: 'boolean',
          example: false,
          description: 'Nuevo estado del usuario',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Estado del usuario y su perfil actualizados exitosamente.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado. Faltan credenciales.',
  })
  @ApiResponse({
    status: 403,
    description: 'Prohibido. Requiere rol de administrador.',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado.' })
  toggleStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('isActive') isActive: boolean,
  ) {
    return this.userService.toggleStatus(id, isActive);
  }
}
