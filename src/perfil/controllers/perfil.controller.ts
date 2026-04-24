import { Controller, Get, Patch, Body, Param, UseGuards, ParseIntPipe, Query } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/jwt-auth/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { CurrentUser } from 'src/auth/decorator/user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PerfilService } from '../services/perfil.service';
import { UpdatePerfilDto } from '../dto/update-perfil.dto';
import { GetPerfilesFilterDto } from '../dto/get-perfiles-filter.dto';


@ApiTags('perfil')
@ApiBearerAuth()
@Controller('perfil')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PerfilController {
  constructor(private readonly perfilService: PerfilService) {}


  @Get('me')
  @Roles('ADMIN', 'owner', 'USER')
  @ApiOperation({ summary: 'Obtener mi propio perfil' })
  @ApiResponse({ status: 200, description: 'Perfil del usuario logueado' })
  @ApiResponse({ status: 404, description: 'Perfil no encontrado' })
  findMyProfile(@CurrentUser() user: any) {
    return this.perfilService.findMyProfile(user.id_usuario);
  }

  @Patch('me')
  @Roles('ADMIN', 'owner', 'USER')
  @ApiOperation({ summary: 'Actualizar mi propio perfil' })
  @ApiResponse({ status: 200, description: 'Perfil actualizado correctamente' })
  @ApiResponse({ status: 404, description: 'Perfil no encontrado' })
  updateMyProfile(@Body() dto: UpdatePerfilDto, @CurrentUser() user: any) {
    return this.perfilService.updateMyProfile(user.id_usuario, dto);
  }


  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Obtener todos los perfiles (Solo Admin)' })
  @ApiResponse({ status: 200, description: 'Lista de perfiles' })
  @ApiResponse({ status: 404, description: 'Perfiles no encontrados' })
  findAll(@Query() filters: GetPerfilesFilterDto) {
    return this.perfilService.findAll(filters);
  }

  @Get(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Obtener un perfil por ID (Solo Admin)' })
  @ApiResponse({ status: 200, description: 'Perfil encontrado' })
  @ApiResponse({ status: 404, description: 'Perfil no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.perfilService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN') 
  @ApiOperation({ summary: 'Actualizar cualquier perfil (Solo Admin)' })
  @ApiResponse({ status: 200, description: 'Perfil actualizado correctamente' })
  @ApiResponse({ status: 404, description: 'Perfil no encontrado' })
  updateAsAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePerfilDto,
  ) {
    return this.perfilService.updateAsAdmin(id, dto);
  }
}