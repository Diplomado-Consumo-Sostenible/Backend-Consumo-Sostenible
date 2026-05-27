import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DepartamentoService } from '../services/departamento.service';
import { CreateDepartamentoDto } from '../dto/create-departamento.dto';
import { UpdateDepartamentoDto } from '../dto/update-departamento.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/jwt-auth/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';

@ApiTags('departamentos')
@Controller('departamentos')
export class DepartamentoController {
  constructor(private readonly departamentoService: DepartamentoService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Crear un departamento (Solo Admin)' })
  @ApiResponse({
    status: 201,
    description: 'Departamento creado exitosamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'Nombre duplicado o datos inválidos.',
  })
  @ApiResponse({ status: 403, description: 'Requiere rol de administrador.' })
  create(@Body() dto: CreateDepartamentoDto) {
    return this.departamentoService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los departamentos (Público)' })
  @ApiResponse({ status: 200, description: 'Lista de departamentos.' })
  @ApiResponse({
    status: 404,
    description: 'No hay departamentos registrados.',
  })
  findAll() {
    return this.departamentoService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un departamento con sus municipios (Público)',
  })
  @ApiParam({ name: 'id', description: 'ID del departamento', type: 'number' })
  @ApiResponse({ status: 200, description: 'Departamento encontrado.' })
  @ApiResponse({ status: 404, description: 'Departamento no encontrado.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.departamentoService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Actualizar un departamento (Solo Admin)' })
  @ApiParam({ name: 'id', description: 'ID del departamento', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Departamento actualizado exitosamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o nombre duplicado.',
  })
  @ApiResponse({ status: 403, description: 'Requiere rol de administrador.' })
  @ApiResponse({ status: 404, description: 'Departamento no encontrado.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDepartamentoDto,
  ) {
    return this.departamentoService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Eliminar un departamento (Solo Admin)' })
  @ApiParam({ name: 'id', description: 'ID del departamento', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Departamento eliminado exitosamente.',
  })
  @ApiResponse({ status: 403, description: 'Requiere rol de administrador.' })
  @ApiResponse({ status: 404, description: 'Departamento no encontrado.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.departamentoService.remove(id);
  }
}
