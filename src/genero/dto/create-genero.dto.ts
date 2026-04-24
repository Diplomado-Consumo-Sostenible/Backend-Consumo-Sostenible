import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGeneroDto {
  @ApiProperty({
    description: 'Nombre del género',
    example: 'Masculino',
  })
  @IsNotEmpty()
  @IsString()
  nombre: string;
}
