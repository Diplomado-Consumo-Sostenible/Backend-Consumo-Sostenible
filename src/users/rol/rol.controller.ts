import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RolService } from './rol.service';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('roles')

@Controller('rol')
export class RolController {
  constructor(private readonly rolService: RolService) {}

  @Post()
    @ApiOperation({ summary: 'Crear un nuevo rol' })
    @ApiResponse({ status: 201, description: 'Rol creado exitosamente.' })
    @ApiResponse({ status: 400, description: 'Error al crear el rol.' })
  create(@Body() createRolDto: CreateRolDto) {
    return this.rolService.create(createRolDto);
  }

  @Get()
    @ApiOperation({ summary: 'Obtener una lista de roles' })
    @ApiResponse({ status: 200, description: 'Lista de roles obtenida exitosamente.' })
    @ApiResponse({ status: 400, description: 'Error al obtener los roles.' })
  findAll() {
    return this.rolService.findAll();
  }

  @Get(':id')
    @ApiOperation({ summary: 'Obtener un rol por su ID' })
    @ApiResponse({ status: 200, description: 'Rol obtenido exitosamente.' })
    @ApiResponse({ status: 404, description: 'Rol no encontrado.' })
  findOne(@Param('id') id: string) {
    return this.rolService.findOne(+id);
  }

  @Patch(':id')
    @ApiOperation({ summary: 'Actualizar un rol por su ID' })
    @ApiResponse({ status: 200, description: 'Rol actualizado exitosamente.' })
    @ApiResponse({ status: 404, description: 'Rol no encontrado.' })
  update(@Param('id') id: string, @Body() updateRolDto: UpdateRolDto) {
    return this.rolService.update(+id, updateRolDto);
  }

  @Delete(':id')
    @ApiOperation({ summary: 'Eliminar un rol por su ID' })
    @ApiResponse({ status: 200, description: 'Rol eliminado exitosamente.' })
    @ApiResponse({ status: 404, description: 'Rol no encontrado.' })
  remove(@Param('id') id: string) {
    return this.rolService.remove(+id);
  }
}
