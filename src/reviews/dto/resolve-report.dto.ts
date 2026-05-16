import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ModerationAction {
  DELETE = 'Delete',
  RESTORE = 'Restore',
}

export class ResolveReportDto {
  @ApiProperty({ enum: ModerationAction })
  @IsEnum(ModerationAction)
  action: ModerationAction;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  admin_notes?: string;
}