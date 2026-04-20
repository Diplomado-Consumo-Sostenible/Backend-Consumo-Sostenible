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
} from '@nestjs/common';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/jwt-auth/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { BusinessStatus } from './entity/business.entity';
import { CurrentUser } from 'src/auth/decorator/user.decorator';

@ApiTags('business')
@ApiBearerAuth()
@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  //rutas publicas
  @Get()
  @ApiOperation({ summary: 'Listar todos los negocios (Público)' })
  @ApiResponse({ status: 200, description: 'Lista de negocios disponibles' })
  @ApiResponse({ status: 404, description: 'No hay negocios disponibles' })
  findAllPublic() {
    return this.businessService.findAllPublic();
  }

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
  @Roles('owner', 'admin')
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
  @Roles('owner', 'admin')
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
  @Roles('owner', 'admin')
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
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Eliminar un negocio (Dueño o Admin)' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.businessService.remove(id, user);
  }


}
