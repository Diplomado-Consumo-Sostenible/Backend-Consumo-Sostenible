import { IsNotEmpty, IsString, Length, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  @ApiProperty({
    description: 'OTP para restablecer la contraseña',
    example: '123456',
  })
  otp: string;

  @MinLength(6)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Nueva contraseña',
    example: 'newPassword123',
  })
  newPassword: string;
}
