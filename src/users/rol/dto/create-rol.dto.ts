import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRolDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Nombre del rol',
    example: 'Administrador',
  })
  nombre: string;
}
