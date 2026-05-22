import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../shared/pagination/dto/pagination.dto';

export enum ProductSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  PRICE      = 'price',
  NAME       = 'name',
}

export class GetProductsFilterDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Buscar por nombre', example: 'orgánico' })
  search?: string;

  @IsOptional()
  @IsEnum(ProductSortBy)
  @ApiPropertyOptional({ enum: ProductSortBy, description: 'Campo de ordenamiento' })
  sortBy?: ProductSortBy;

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], description: 'Dirección del ordenamiento' })
  order?: 'ASC' | 'DESC';
}
