import { IsString, IsNotEmpty, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCertificationDto {
  @ApiProperty({ 
    description: 'Nombre de la certificación',
    example: 'Sello Orgánico 100%' 
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    description: 'Entidad emisora de la certificación',
    example: 'Ministerio de Agricultura' 
  })
  @IsString()
  @IsNotEmpty()
  issuing_entity: string;

  @ApiProperty({ 
    description: 'URL de verificación de la certificación',
    example: 'https://verificacion.gob/12345' 
  })
  @IsUrl()
  @IsNotEmpty()
  verification_url: string;

  @ApiProperty({ 
    description: 'URL del badge de la certificación',
    example: 'https://res.cloudinary.com/.../sello.png' 
  })
  @IsUrl()
  @IsNotEmpty()
  badge_url: string;
}