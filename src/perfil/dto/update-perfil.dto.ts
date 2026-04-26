import { IsString, IsOptional, IsNumber, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePerfilDto {
  @ApiPropertyOptional({ description: 'Nombre del usuario', example: 'Juan Pérez' })
  @IsOptional()
  @IsString()
  nombre?: string;

  

  @ApiPropertyOptional({ description: 'ID del género', example: 1 })
  @IsOptional()
  @IsNumber()
  id_genero?: number;
}