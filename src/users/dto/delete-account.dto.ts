import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DeleteAccountDto {
  @ApiPropertyOptional({
    description:
      'Contraseña actual para confirmar la eliminación de la cuenta (requerida si no eres administrador)',
    example: 'miContraseña123',
  })
  @IsOptional()
  @IsString()
  password?: string;
}
