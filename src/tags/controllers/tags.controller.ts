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

import { Roles } from 'src/auth/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/jwt-auth/roles.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TagsService } from '../services/tags.service';
import { CreateTagDto } from '../dto/create-tags';
import { UpdateTagDto } from '../dto/update-tags';

@ApiTags('tags')
@ApiBearerAuth()
@Controller('tags')
export class TagsController {
  constructor(private readonly tagService: TagsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Crear un nuevo tag' })
  @ApiResponse({ status: 201, description: 'Tag creado exitosamente.' })
  @ApiResponse({
    status: 400,
    description: 'El tag ya existe o datos inválidos.',
  })
  @ApiResponse({
    status: 403,
    description: 'Prohibido. Requiere rol de administrador.',
  })
  create(@Body() createTagDto: CreateTagDto) {
    return this.tagService.create(createTagDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los tags' })
  @ApiResponse({
    status: 200,
    description: 'Lista de tags obtenida exitosamente.',
  })
  findAll() {
    return this.tagService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un tag por su ID' })
  @ApiParam({ name: 'id', description: 'ID del tag', type: 'number' })
  @ApiResponse({ status: 200, description: 'Tag encontrado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Tag no encontrado.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tagService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Actualizar un tag' })
  @ApiParam({
    name: 'id',
    description: 'ID del tag a actualizar',
    type: 'number',
  })
  @ApiResponse({ status: 200, description: 'Tag actualizado exitosamente.' })
  @ApiResponse({
    status: 403,
    description: 'Prohibido. Requiere rol de administrador.',
  })
  @ApiResponse({ status: 404, description: 'Tag no encontrado.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTagDto: UpdateTagDto,
  ) {
    return this.tagService.update(id, updateTagDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Eliminar un tag' })
  @ApiParam({
    name: 'id',
    description: 'ID del tag a eliminar',
    type: 'number',
  })
  @ApiResponse({ status: 200, description: 'Tag eliminado exitosamente.' })
  @ApiResponse({
    status: 403,
    description: 'Prohibido. Requiere rol de administrador.',
  })
  @ApiResponse({ status: 404, description: 'Tag no encontrado.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tagService.remove(id);
  }
}
