import { IsUrl, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateFotoDto {
    @ApiProperty({ description: 'URL de la foto devuelta por Cloudinary', example: 'https://...' })
    @IsNotEmpty()
    @IsUrl()
    foto_perfil?: string;
}