import { IsInt, IsNotEmpty, IsString, Max, Min, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateReviewDto {
  @ApiProperty({ description: 'Calificación del 1 al 5', example: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  rating?: number;

  @ApiProperty({ description: 'Comentario de la reseña', example: 'Excelente servicio y productos.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  comment?: string;

}