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
import { ProductService } from '../services/product.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/jwt-auth/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { CurrentUser } from 'src/auth/decorator/user.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('product')
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get('business/:businessId')
  @ApiOperation({ summary: 'Listar todos los productos de un negocio (Público)' })
  @ApiResponse({ status: 200, description: 'Lista de productos del negocio' })
  @ApiResponse({ status: 404, description: 'Negocio no encontrado o sin productos' })
  findAllByBusiness(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.productService.findAllByBusiness(businessId, paginationDto);
  }

  // --- RUTAS PROTEGIDAS ---

  @Post('business/:businessId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'ADMIN')
  @ApiOperation({ summary: 'Agregar un producto a un negocio (Dueño o Admin)' })
  @ApiResponse({ status: 201, description: 'Producto creado exitosamente' })
  @ApiResponse({ status: 403, description: 'Prohibido. No eres el dueño de este negocio.' })
  @ApiResponse({ status: 404, description: 'Negocio no encontrado' })
  create(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user: any,
  ) {
    return this.productService.create(businessId, createProductDto, user);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'ADMIN')
  @ApiOperation({ summary: 'Actualizar un producto (Dueño o Admin)' })
  @ApiResponse({ status: 200, description: 'Producto actualizado exitosamente' })
  @ApiResponse({ status: 403, description: 'Prohibido. No eres el dueño de este producto.' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user: any,
  ) {
    return this.productService.update(id, updateProductDto, user);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'ADMIN')
  @ApiOperation({ summary: 'Eliminar un producto (Dueño o Admin)' })
  @ApiResponse({ status: 200, description: 'Producto eliminado exitosamente' })
  @ApiResponse({ status: 403, description: 'Prohibido. No eres el dueño de este producto.' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.productService.remove(id, user);
  }
}