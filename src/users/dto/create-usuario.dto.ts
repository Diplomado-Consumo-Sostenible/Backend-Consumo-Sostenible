import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsInt,
  IsOptional,
  IsUrl,
  Length,
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class CreateUsuarioDto {
  @ApiProperty(
    {
      description: 'El correo electrónico del usuario',
      example: 'user@example.com'
    }

  )
  @IsEmail()
  email: string;

  @ApiProperty(
    {
      description: 'La contraseña del usuario',
      example: 'password123'
    }
  )
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty(
    {
      description: 'El ID del rol del usuario',
      example: 1
    }
  )
  @IsInt()
  @IsNotEmpty()
  rolId: number;

  @ApiProperty(
    {
      description: 'El nombre del usuario',
      example: 'John Doe'
    }
  )
  @IsString()
  @IsOptional()
  nombre?: string;



  @ApiProperty(
    {
      description: 'El ID del género del usuario',
      example: 1
    }
  )
  @IsOptional()
  @IsInt()
  id_genero?: number;
}
