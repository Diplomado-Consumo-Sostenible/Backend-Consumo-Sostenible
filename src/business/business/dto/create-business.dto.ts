import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsObject,
  IsEmail,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBusinessDto {
  @ApiProperty({
    description: 'Nombre del negocio o emprendimiento',
    example: 'Eco Burger Vegan',
  })
  @IsNotEmpty()
  @IsString()
  businessName: string;

  @ApiProperty({
    description:
      'Descripción detallada del negocio y sus prácticas sostenibles',
    example: 'Restaurante 100% plant-based con empaques biodegradables.',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional({
    description: 'URL del logo del negocio (Cloudinary/S3)',
    example: 'https://res.cloudinary.com/tu-app/image/upload/v1/logo.png',
  })
  @IsOptional()
  @IsUrl()
  logo?: string;

  @ApiPropertyOptional({
    description: 'Arreglo de URLs con imágenes del local o productos',
    example: ['https://img1.jpg', 'https://img2.jpg'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true }) // Valida que cada elemento del arreglo sea un string
  images?: string[];

  @ApiProperty({
    description: 'Dirección física del negocio',
    example: 'Calle 123 #45-67, Barrio Centro',
  })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiPropertyOptional({
    description: 'Latitud para el mapa',
    example: 4.60971,
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitud para el mapa',
    example: -74.08175,
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Teléfono de contacto',
    example: '+57 300 123 4567',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Correo electrónico público del negocio',
    example: 'contacto@ecoburger.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Página web oficial',
    example: 'https://www.ecoburger.com',
  })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({
    description: 'URL del perfil de Instagram',
    example: 'https://instagram.com/ecoburger',
  })
  @IsOptional()
  @IsUrl()
  instagramUrl?: string;

  @ApiPropertyOptional({
    description: 'URL del perfil de Facebook',
    example: 'https://facebook.com/ecoburger',
  })
  @IsOptional()
  @IsUrl()
  facebookUrl?: string;

  @ApiPropertyOptional({
    description: 'Objeto JSON con los horarios de atención',
    example: {
      lunes: '08:00-18:00',
      martes: '08:00-18:00',
      domingo: 'Cerrado',
    },
  })
  @IsOptional()
  @IsObject()
  schedule?: Record<string, string>;

  // --- RELACIONES (Se reciben los IDs) ---

  @ApiProperty({
    description: 'ID de la categoría a la que pertenece',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  categoryId: number;

  @ApiPropertyOptional({
    description: 'Arreglo con los IDs de los tags seleccionados',
    example: [1, 3, 5],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  tagIds?: number[];
}
