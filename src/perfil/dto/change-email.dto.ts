import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeEmailDto {
  @ApiProperty({ description: 'Nuevo correo electrónico' , example: 'nuevo correo@example.com' })
  @IsNotEmpty()
  @IsEmail()
  newEmail!: string;

  @ApiProperty({ description: 'Contraseña actual por seguridad' , example: 'contraseña123' })
  @IsNotEmpty()
  @IsString()
  password!: string;
}