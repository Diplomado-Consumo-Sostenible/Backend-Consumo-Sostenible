import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from 'src/shared/pagination/dto/pagination.dto';


export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class GetBusinessReviewsFilterDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrar por calificación específica (1-5)', example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ 
    description: 'Ordenar por fecha (ASC = Más antiguas, DESC = Más recientes)', 
    enum: SortOrder, 
    default: SortOrder.DESC 
  })
  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder = SortOrder.DESC;
}