import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReportReason } from '../../shared/entities/review-report.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewReportDto {
  @ApiProperty({ enum: ReportReason })
  @IsEnum(ReportReason)
  reason: ReportReason;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  details?: string;
}