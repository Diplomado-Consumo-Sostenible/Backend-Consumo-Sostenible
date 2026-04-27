import { IsNotEmpty, IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({
    description: 'Nombre del producto',
    example: 'Hamburguesa de Lentejas',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Descripción detallada del producto',
    example: 'Deliciosa hamburguesa vegana hecha a base de lentejas con pan artesanal.',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional({
    description: 'URL de la imagen del producto (Cloudinary/S3)',
    example: 'https://res.cloudinary.com/tu-app/image/upload/v1/producto.png',
  })
  @IsOptional()
  @IsUrl()
  image?: string;
}