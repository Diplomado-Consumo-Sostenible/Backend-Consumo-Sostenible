import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  ValidationPipe,
  Query,
} from '@nestjs/common';
import { GeneroService } from '../services/genero.service';
import { CreateGeneroDto } from '../dto/create-genero.dto';
import { UpdateGeneroDto } from '../dto/Update-genero.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/jwt-auth/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';


@ApiTags('generos')
@Controller('genero')
export class GeneroController {
  constructor(private readonly generoService: GeneroService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Crear un nuevo género' })
  @ApiResponse({ status: 201, description: 'Género creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Error al crear el género.' })
  create(@Body(new ValidationPipe()) createGeneroDto: CreateGeneroDto) {
    return this.generoService.create(createGeneroDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener una lista paginada de géneros' })
  @ApiResponse({ status: 200, description: 'Lista de géneros obtenida exitosamente.' })
  @ApiResponse({ status: 400, description: 'Error al obtener los géneros.' })
  findAll(@Query(new ValidationPipe()) paginationDto: PaginationDto,) {
    return this.generoService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un género por su ID' })
  @ApiResponse({ status: 200, description: 'Género obtenido exitosamente.' })
  @ApiResponse({ status: 404, description: 'Género no encontrado.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.generoService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Actualizar un género por su ID' })
  @ApiResponse({ status: 200, description: 'Género actualizado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Error al actualizar el género.' })
  @ApiResponse({ status: 404, description: 'Género no encontrado.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe()) updateGeneroDto: UpdateGeneroDto,
  ) {
    return this.generoService.update(id, updateGeneroDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Eliminar un género por su ID' })
  @ApiResponse({ status: 200, description: 'Género eliminado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Género no encontrado.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.generoService.remove(id);
  }
}
