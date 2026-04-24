import {
  Body,
  Controller,
  Param,
  Patch,
  UseGuards,
  Get,
  ParseIntPipe,
  Post,
  Delete,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
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
import { CreateUsuarioDto } from '../dto/create-usuario.dto';
import { UpdateUsuarioDto } from '../dto/Update-usuario.dto';
import { CurrentUser } from 'src/auth/decorator/user.decorator';
import { ChangePasswordDto } from 'src/perfil/dto/change-password.dto';
import { ChangeEmailDto } from 'src/perfil/dto/change-email.dto';

@ApiTags('user')
@ApiBearerAuth() 
@Controller('user')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles('ADMIN')
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
  @Roles('ADMIN')
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
  @Roles('ADMIN')
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

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Crear un nuevo usuario (Solo Admin)' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o correo duplicado.' })
  create(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.userService.create(createUsuarioDto);
  }

  @Patch(':id')
  @Roles('ADMIN', 'owner', 'USER') 
  @ApiOperation({ summary: 'Actualizar un usuario (Admin o el propio usuario)' })
  @ApiParam({ name: 'id', description: 'ID del usuario a modificar', type: 'number' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado exitosamente.' })
  @ApiResponse({ status: 403, description: 'Prohibido. No puedes editar a otro usuario.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
    @CurrentUser() user: any,
  ) {
    return this.userService.update(id, updateUsuarioDto, user);
  }

  @Delete(':id')
  @Roles('ADMIN', 'owner', 'USER') 
  @ApiOperation({ summary: 'Eliminar cuenta de usuario permanentemente (Admin o el propio usuario)' })
  @ApiParam({ name: 'id', description: 'ID del usuario a eliminar', type: 'number' })
  @ApiResponse({ status: 200, description: 'Usuario y sus datos relacionados eliminados.' })
  @ApiResponse({ status: 403, description: 'Prohibido. No tienes permisos.' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.userService.remove(id, user);
  }

  // Estos endpoints los puede usar cualquier rol autenticado
  @Patch('me/password')
  @Roles('ADMIN', 'owner', 'USER')
  @ApiOperation({ summary: 'Cambiar mi contraseña' })
  changePassword(@Body() dto: ChangePasswordDto, @CurrentUser() user: any) {
    return this.userService.changePassword(user.id_usuario, dto);
  }

  @Patch('me/email')
  @Roles('ADMIN', 'owner', 'USER')
  @ApiOperation({ summary: 'Cambiar mi correo electrónico' })
  changeEmail(@Body() dto: ChangeEmailDto, @CurrentUser() user: any) {
    return this.userService.changeEmail(user.id_usuario, dto);
  }
}
