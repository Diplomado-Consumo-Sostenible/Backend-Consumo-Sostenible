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
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
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

@ApiTags('category')
@ApiBearerAuth()
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Crear una nueva categoría' })
  @ApiResponse({ status: 201, description: 'Categoría creada exitosamente.' })
  @ApiResponse({
    status: 400,
    description: 'La categoría ya existe o datos inválidos.',
  })
  @ApiResponse({
    status: 403,
    description: 'Prohibido. Requiere rol de administrador.',
  })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las categorías' })
  @ApiResponse({
    status: 200,
    description: 'Lista de categorías obtenida exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'No hay categorías registradas.' })
  findAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una categoría por su ID' })
  @ApiParam({ name: 'id', description: 'ID de la categoría', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Categoría encontrada exitosamente.',
  })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Actualizar una categoría' })
  @ApiParam({
    name: 'id',
    description: 'ID de la categoría a actualizar',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Categoría actualizada exitosamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o categoría duplicada.',
  })
  @ApiResponse({
    status: 403,
    description: 'Prohibido. Requiere rol de administrador.',
  })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Eliminar una categoría' })
  @ApiParam({
    name: 'id',
    description: 'ID de la categoría a eliminar',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Categoría eliminada exitosamente.',
  })
  @ApiResponse({
    status: 403,
    description: 'Prohibido. Requiere rol de administrador.',
  })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.remove(id);
  }
}
