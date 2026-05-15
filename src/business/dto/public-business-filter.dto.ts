import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/shared/pagination/dto/pagination.dto';


export enum BusinessSortOption {
  RECENT   = 'recent',
  RATED    = 'rated',
  REVIEWS  = 'reviews',
  RELEVANT = 'relevant',
}

export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class PublicBusinessFilterDto extends PaginationDto {

  @ApiPropertyOptional({ description: 'Buscar negocio por nombre' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'ID de la categoría para filtrar' })
  @IsOptional()
  @Type(() => Number) 
  @IsNumber()
  id_category?: number;

  @ApiPropertyOptional({ description: 'ID del tag para filtrar' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id_tag?: number; 

  @ApiPropertyOptional({ description: 'Ordenar por: recent, rated o reviews' })
  @IsOptional()
  @IsEnum(BusinessSortOption, {
    message: 'sortBy debe ser un valor válido: recent, rated o reviews',
  })
  sortBy?: BusinessSortOption;

  @ApiPropertyOptional({ description: 'Dirección de ordenamiento: ASC o DESC' })
  @IsOptional()
  @IsEnum(SortDirection)
  sortDirection?: SortDirection;
}