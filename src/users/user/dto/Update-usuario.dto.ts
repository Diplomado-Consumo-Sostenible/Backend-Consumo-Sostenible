import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateUsuarioDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @IsInt()
  @IsNotEmpty()
  @IsOptional()
  rolId?: number;
}
