import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendPasswordResetDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Correo electrónico del usuario que desea reenviar el OTP',
    example: 'user@example.com',
  })
  email: string;
}
