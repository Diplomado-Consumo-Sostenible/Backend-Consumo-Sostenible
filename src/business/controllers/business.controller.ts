import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { BusinessService } from '../services/business.service';
import { CreateBusinessDto } from '../dto/create-business.dto';
import { UpdateBusinessDto } from '../dto/update-business.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/jwt-auth/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { BusinessStatus } from '../../shared/entities/business.entity';
import { CurrentUser } from 'src/auth/decorator/user.decorator';
import { GetBusinessesFilterDto } from '../dto/get-businesses-filter.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@ApiTags('business')
@ApiBearerAuth()
@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  //ruta publicas
  @Get()
  @ApiOperation({ summary: 'Listar todos los negocios (Público)' })
  @ApiResponse({ status: 200, description: 'Lista de negocios disponibles' })
  @ApiResponse({ status: 404, description: 'No hay negocios disponibles' })
  findAllPublic(@Query() paginationDto: PaginationDto) {
    return this.businessService.findAllPublic(paginationDto);
  }

  @Get('admin/list')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Listar negocios con filtros (Solo Admin)' })
  @ApiResponse({ status: 200, description: 'Lista de negocios según filtros' })
  @ApiResponse({ status: 403, description: 'Prohibido. Requiere rol de admin.' })
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Obtener lista de negocios con filtros (Solo Admin)' })
  findAllForAdmin(@Query() filters: GetBusinessesFilterDto) {
    return this.businessService.findAllForAdmin(filters);
  }

  //ruta publicas
  @Get(':id')
  @ApiOperation({ summary: 'Ver detalles de un negocio (Público)' })
  @ApiResponse({ status: 200, description: 'Detalles del negocio' })
  @ApiResponse({ status: 404, description: 'Negocio no encontrado' })
  findOnePublic(@Param('id', ParseIntPipe) id: number) {
    return this.businessService.findOnePublic(id);
  }

  //Rutas protegidas

  @Get('management/my-businesses')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'ADMIN')
  @ApiOperation({ summary: 'Listar negocios para gestionar (Owner/Admin)' })
  @ApiResponse({ status: 200, description: 'Lista de negocios para gestionar' })
  @ApiResponse({ status: 403, description: 'Prohibido. Requiere rol de owner o admin.' })
  @ApiResponse({ status: 404, description: 'No hay negocios para gestionar' })
  findForManagement(@CurrentUser() user: any) {
    return this.businessService.findForManagement(user);
  }

  @Post()
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Negocio creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos para crear negocio' })
  @ApiResponse({
    status: 403,
    description: 'Prohibido. Requiere rol de owner o admin.',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'ADMIN')
  @ApiOperation({ summary: 'Crear un negocio (Owner/Admin)' })
  create(
    @Body() createBusinessDto: CreateBusinessDto,
    @CurrentUser() user: any,
  ) {
    return this.businessService.create(createBusinessDto, user);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Negocio actualizado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos para actualizar negocio' })
  @ApiResponse({  status: 403, description: 'Prohibido. Requiere rol de owner o admin.' })
  @ApiResponse({ status: 404, description: 'Negocio no encontrado' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'ADMIN')
  @ApiOperation({ summary: 'Actualizar negocio (Dueño o Admin)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBusinessDto: UpdateBusinessDto,
    @CurrentUser() user: any,
  ) {
    return this.businessService.update(id, updateBusinessDto, user);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Negocio eliminado exitosamente' })
  @ApiResponse({ status: 403, description: 'Prohibido. Requiere rol de owner o admin.' })
  @ApiResponse({ status: 404, description: 'Negocio no encontrado' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'ADMIN')
  @ApiOperation({ summary: 'Eliminar un negocio (Dueño o Admin)' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.businessService.remove(id, user);
  }

  // --- ENDPOINTS DE ADMINISTRADOR ---

  @Patch(':id/status')
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Estado del negocio actualizado exitosamente' })
  @ApiResponse({ status: 400, description: 'Estado inválido para el negocio' })
  @ApiResponse({ status: 403, description: 'Prohibido. Requiere rol de admin.' })
  @ApiResponse({ status: 404, description: 'Negocio no encontrado' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Aprobar o rechazar negocio (Solo Admin)' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        status: { type: 'string', enum: ['Active', 'Pending', 'Rejected'], example: 'Rejected' },
        rejectionReason: { type: 'string', example: 'La descripción no detalla el impacto ambiental.', nullable: true }
      } 
    } 
  })
  changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: BusinessStatus,
    @Body('rejectionReason') rejectionReason?: string,
  ) {
    return this.businessService.changeStatus(id, status, rejectionReason);
  }

  @Patch(':id/toggle-active')
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Estado de actividad del negocio actualizado exitosamente' })
  @ApiResponse({ status: 400, description: 'Valor inválido para isActive' })
  @ApiResponse({ status: 403, description: 'Prohibido. Requiere rol de admin.' })
  @ApiResponse({ status: 404, description: 'Negocio no encontrado' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Banear/Desactivar un negocio (Solo Admin)' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { isActive: { type: 'boolean', example: false } } 
    } 
  })
  toggleActive(
    @Param('id', ParseIntPipe) id: number,
    @Body('isActive') isActive: boolean,
  ) {
    return this.businessService.toggleActive(id, isActive);
  }
}
