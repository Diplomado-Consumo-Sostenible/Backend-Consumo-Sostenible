import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MunicipioService } from '../services/municipio.service';
import { CreateMunicipioDto } from '../dto/create-municipio.dto';
import { UpdateMunicipioDto } from '../dto/update-municipio.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/jwt-auth/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { PaginationDto } from 'src/shared/pagination/dto/pagination.dto';

@ApiTags('municipios')
@Controller('municipios')
export class MunicipioController {
  constructor(private readonly municipioService: MunicipioService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Crear un municipio (Solo Admin)' })
  @ApiResponse({ status: 201, description: 'Municipio creado exitosamente.' })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o municipio duplicado.',
  })
  @ApiResponse({ status: 403, description: 'Requiere rol de administrador.' })
  @ApiResponse({ status: 404, description: 'Departamento no encontrado.' })
  create(@Body() dto: CreateMunicipioDto) {
    return this.municipioService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los municipios paginados (Público)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de municipios.' })
  @ApiResponse({ status: 404, description: 'No hay municipios registrados.' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.municipioService.findAll(paginationDto);
  }

  @Get('departamento/:id')
  @ApiOperation({ summary: 'Listar municipios de un departamento (Público)' })
  @ApiParam({ name: 'id', description: 'ID del departamento', type: 'number' })
  @ApiResponse({ status: 200, description: 'Municipios del departamento.' })
  @ApiResponse({
    status: 404,
    description: 'Departamento no encontrado o sin municipios.',
  })
  findByDepartamento(
    @Param('id', ParseIntPipe) id: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.municipioService.findByDepartamento(id, paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un municipio por ID (Público)' })
  @ApiParam({ name: 'id', description: 'ID del municipio', type: 'number' })
  @ApiResponse({ status: 200, description: 'Municipio encontrado.' })
  @ApiResponse({ status: 404, description: 'Municipio no encontrado.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.municipioService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Actualizar un municipio (Solo Admin)' })
  @ApiParam({ name: 'id', description: 'ID del municipio', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Municipio actualizado exitosamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o nombre duplicado.',
  })
  @ApiResponse({ status: 403, description: 'Requiere rol de administrador.' })
  @ApiResponse({
    status: 404,
    description: 'Municipio o departamento no encontrado.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMunicipioDto,
  ) {
    return this.municipioService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Eliminar un municipio (Solo Admin)' })
  @ApiParam({ name: 'id', description: 'ID del municipio', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Municipio eliminado exitosamente.',
  })
  @ApiResponse({ status: 403, description: 'Requiere rol de administrador.' })
  @ApiResponse({ status: 404, description: 'Municipio no encontrado.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.municipioService.remove(id);
  }
}
