import { IsOptional, IsBooleanString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class GetPerfilesFilterDto extends PaginationDto {
  @ApiPropertyOptional({ 
    description: 'Filtrar por perfiles activos/inactivos', 
    example: 'true',
    enum: ['true', 'false'] 
  })
  @IsOptional()
  @IsBooleanString()
  isActive?: string;

  @ApiPropertyOptional({ 
    description: 'Filtrar por ID de género', 
    example: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_genero?: number;
}