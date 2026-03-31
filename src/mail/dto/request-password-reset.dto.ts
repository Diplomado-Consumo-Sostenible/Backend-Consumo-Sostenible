import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestPasswordResetDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Correo electrónico del usuario que solicita el restablecimiento de contraseña',
    example: 'user@example.com',
  })
  email: string;
}
