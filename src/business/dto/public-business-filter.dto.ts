import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from 'src/shared/pagination/dto/pagination.dto';

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
}