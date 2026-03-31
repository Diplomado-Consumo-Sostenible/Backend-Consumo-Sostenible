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
      description: 'La URL de la foto de perfil del usuario',
      example: 'https://example.com/profile.jpg'
    }
  )
  @IsOptional()
  @IsUrl()
  foto_perfil?: string;

  @ApiProperty(
    {
      description: 'El número de teléfono del usuario',
      example: '1234567890'
    }
  )
  @IsOptional()
  @IsString()
  @Length(7, 20)
  telefono?: string;

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
