import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTagDto {
  @ApiProperty({
    description: 'Nombre del tag',
    example: 'Productos Locales',
  })
  @IsNotEmpty()
  @IsString()
  tag: string;
}
