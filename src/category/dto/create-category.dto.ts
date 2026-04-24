import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Nombre de la Categoria',
    example: 'Restaurante',
  })
  @IsNotEmpty()
  @IsString()
  category: string;
}
