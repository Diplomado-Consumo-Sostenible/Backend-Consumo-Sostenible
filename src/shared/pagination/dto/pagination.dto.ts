import { IsOptional, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
  @IsOptional()
  @IsPositive()
  @ApiPropertyOptional({
    description: 'Cantidad de elementos a mostrar por página',
    example: 10,
    minimum: 1,
  })
  @Type(() => Number) 
  limit?: number;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'Número de página que deseas consultar',
    example: 1,
    minimum: 1,
  })
  @Min(1)
  @Type(() => Number)
  page?: number;
}