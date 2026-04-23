import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsBooleanString } from 'class-validator';
import { BusinessStatus } from '../entity/business.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class GetBusinessesFilterDto extends PaginationDto{
  @ApiPropertyOptional({ enum: BusinessStatus, description: 'Filtrar por estado del negocio' })
  @IsOptional()
  @IsEnum(BusinessStatus)
  status?: BusinessStatus;

  @ApiPropertyOptional({ description: 'Filtrar por negocios activos/inactivos (true/false)' })
  @IsOptional()
  @IsBooleanString()
  isActive?: string;
}