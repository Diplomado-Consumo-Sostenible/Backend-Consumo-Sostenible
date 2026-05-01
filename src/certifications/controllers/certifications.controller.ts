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

import { CreateCertificationDto } from '../dto/create-certification.dto';
import { CertificationStatus } from 'src/shared/entities/certifications.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/jwt-auth/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorator/user.decorator';
import { CertificationsService } from '../services/certifications.service';
import { GetCertificationsFilterDto } from '../dto/get-certifications-filter.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@ApiTags('certifications')
@Controller('certifications')
export class CertificationsController {
  constructor(private readonly certificationsService: CertificationsService) {}

  //ENDPOINT PUBLICO
  
  @Get('business/:businessId')
  @ApiOperation({ summary: 'Obtener certificaciones activas de un negocio (Público)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de certificaciones activas' })
  @ApiResponse({ status: 404, description: 'El negocio no tiene certificaciones activas' })
  findActiveByBusiness(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.certificationsService.findActiveByBusiness(businessId, paginationDto);
  }

  // ENDPOINT OWNER

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner')
  @ApiOperation({ summary: 'Crear solicitud de certificación (Solo Owner)' })
  @ApiResponse({ status: 201, description: 'Certificación enviada a revisión' })
  create(
    @Body() createCertificationDto: CreateCertificationDto,
    @CurrentUser() user: any,
  ) {
    return this.certificationsService.create(createCertificationDto, user);
  }

  @Get('management/my-certifications')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner')
  @ApiOperation({ summary: 'Ver mis certificaciones enviadas (Solo Owner)' })
  findMyCertifications(@CurrentUser() user: any) {
    return this.certificationsService.findMyCertifications(user);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner', 'ADMIN')
  @ApiOperation({ summary: 'Eliminar una certificación (Owner o Admin)' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.certificationsService.remove(id, user);
  }

  // ENDPOINT ADMIN

  @Get('admin/list')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Listar certificaciones con filtros y paginación (Solo Admin)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de certificaciones' })
  @ApiResponse({ status: 403, description: 'Prohibido. Requiere rol de admin.' })
  findAllForAdmin(@Query() filters: GetCertificationsFilterDto) {
    return this.certificationsService.findAllForAdmin(filters);
  }

  @Patch('admin/:id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Aprobar o rechazar certificación (Solo Admin)' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        status: { type: 'string', enum: ['Active', 'Pending', 'Rejected'], example: 'Active' }
      } 
    } 
  })
  changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: CertificationStatus,
  ) {
    return this.certificationsService.changeStatus(id, status);
  }
}