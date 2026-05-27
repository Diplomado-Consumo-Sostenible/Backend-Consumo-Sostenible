import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/shared/pagination/dto/pagination.dto';
import { ReportReason } from 'src/shared/entities/review-report.entity';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetReportedReviewsFilterDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: ReportReason,
    description: 'Filtra las reseñas por el motivo específico del reporte',
  })
  @IsOptional()
  @IsEnum(ReportReason, { message: 'El motivo del reporte no es válido' })
  reason?: ReportReason;
}
