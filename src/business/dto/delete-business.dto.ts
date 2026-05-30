import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DeleteBusinessDto {
  @ApiPropertyOptional({
    description:
      'Contraseña actual del dueño para confirmar la eliminación (requerida si no eres administrador)',
    example: 'miContraseña123',
  })
  @IsOptional()
  @IsString()
  password?: string;
}
