import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto'; // Ajusta la ruta según tu proyecto
import { CertificationStatus } from 'src/shared/entities/certifications.entity';

export class GetCertificationsFilterDto extends PaginationDto {
  @IsOptional()
  @IsEnum(CertificationStatus)
  @ApiPropertyOptional({
    description: 'Filtrar por estado de la certificación (Active, Pending, Rejected)',
    enum: CertificationStatus,
    example: CertificationStatus.PENDING,
  })
  status?: CertificationStatus;
}