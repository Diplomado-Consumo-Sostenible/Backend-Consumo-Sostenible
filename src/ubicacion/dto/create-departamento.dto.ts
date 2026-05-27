import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDepartamentoDto {
  @ApiProperty({ description: 'Nombre del departamento', example: 'Antioquia' })
  @IsNotEmpty()
  @IsString()
  nombre: string;


}
