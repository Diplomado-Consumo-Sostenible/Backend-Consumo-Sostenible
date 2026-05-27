import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMunicipioDto {
  @ApiProperty({ description: 'Nombre del municipio', example: 'Medellín' })
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @ApiProperty({
    description: 'ID del departamento al que pertenece',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  id_departamento: number;


}
