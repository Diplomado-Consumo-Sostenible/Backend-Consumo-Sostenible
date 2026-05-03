import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsBooleanString } from 'class-validator';
import { BusinessStatus } from '../../shared/entities/business.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PublicBusinessFilterDto } from './public-business-filter.dto';

export class GetBusinessesFilterDto extends IntersectionType(PaginationDto, PublicBusinessFilterDto) {
  @ApiPropertyOptional({ enum: BusinessStatus, description: 'Filtrar por estado del negocio' })
  @IsOptional()
  @IsEnum(BusinessStatus)
  status?: BusinessStatus;

  @ApiPropertyOptional({ description: 'Filtrar por negocios activos/inactivos (true/false)' })
  @IsOptional()
  @IsBooleanString()
  isActive?: string;
}