import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { CreateReviewReportDto } from '../dto/create-review-report.dto';
import { ReviewsService } from './reviews.service';
import { ReviewRepository } from 'src/shared/repositories/review.repository';
import { ReviewReportRepository } from 'src/shared/repositories/review-report.repository';
import { createPaginationResponse } from 'src/shared/pagination/pagination.helper';
import { MoreThanOrEqual } from 'typeorm';
import { PaginationDto } from 'src/shared/pagination/dto/pagination.dto';
import { ModerationAction, ResolveReportDto } from '../dto/resolve-report.dto';
import { ReportStatus } from 'src/shared/entities/review-report.entity';
import { ReviewBlockRepository } from 'src/shared/repositories/review-block.repository';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class ReviewsReportService {
  private readonly AUTO_HIDE_THRESHOLD = 3; 

  constructor(
    private readonly reportRepository: ReviewReportRepository,
    private readonly reviewRepository: ReviewRepository,
    private readonly reviewsService: ReviewsService,
    private readonly blockRepository: ReviewBlockRepository,
    private readonly mailService: MailService,
  ) {}

  async reportReview(reviewId: number, user: any, dto: CreateReviewReportDto) {
    const review = await this.reviewRepository.findOne({ 
      where: { id_review: reviewId },
      relations: ['user', 'business'] 
    });

    if (!review) throw new NotFoundException('Reseña no encontrada.');

    if (review.user?.id_usuario === user.id_usuario) {
      throw new BadRequestException('No puedes reportar tu propia reseña.');
    }

    try {
      const newReport = this.reportRepository.create({
        reason: dto.reason,
        details: dto.details,
        user: { id_usuario: user.id_usuario },
        review: { id_review: reviewId },
      });

      await this.reportRepository.save(newReport);

      // 1. Incrementamos el contador
      review.report_count += 1;
      let wasAutoHidden = false;

      // 2. Lógica de Auto-Ocultamiento
      if (review.report_count >= this.AUTO_HIDE_THRESHOLD && !review.is_hidden_by_moderation) {
        review.is_hidden_by_moderation = true;
        wasAutoHidden = true;
      }

      await this.reviewRepository.save(review);

      if (wasAutoHidden) {
        await this.reviewsService.updateBusinessRating(review.business.id_business);
      }

      return { 
        message: wasAutoHidden 
          ? 'Gracias por tu reporte. Esta reseña ha recibido múltiples quejas y ha sido ocultada temporalmente mientras un administrador la revisa.'
          : 'Reporte enviado exitosamente. Un administrador lo revisará.' 
      };

    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Ya has reportado esta reseña anteriormente.');
      }
      throw new InternalServerErrorException('Error al procesar el reporte.');
    }
  }

  async getReportedReviews(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [reviews, total] = await this.reviewRepository.findAndCount({
      where: { report_count: MoreThanOrEqual(1) },
      relations: ['reports', 'reports.user', 'user', 'business'],
      order: { report_count: 'DESC' },
      skip,
      take: limit,
    });

    if (total === 0) throw new NotFoundException('No hay reseñas reportadas.');


    return createPaginationResponse(reviews, total, page, limit);
    }

async resolveReport(reportId: number, dto: ResolveReportDto) {
    const report = await this.reportRepository.findOne({
      where: { id_report: reportId },
      relations: ['review', 'review.business', 'review.user'],
    });

    if (!report) throw new NotFoundException('Reporte no encontrado.');
    if (report.status !== ReportStatus.PENDING) {
      throw new BadRequestException('Este reporte ya ha sido procesado.');
    }

    const { review } = report;
    const businessId = review.business.id_business;
    const userEmail = review.user.email;

    if (dto.action === ModerationAction.DELETE) {
      const block = this.blockRepository.create({
        user: { id_usuario: review.user.id_usuario },
        business: { id_business: businessId }
      });
      await this.blockRepository.save(block);
      await this.reviewRepository.remove(review);
      await this.reviewsService.updateBusinessRating(review.business.id_business);

      try {
        await this.mailService.sendReviewDeletedAlert(userEmail, review.business.businessName);
      } catch (error) {
        console.error(`No se pudo enviar correo de penalización a ${userEmail}:`, error);
      }
    } 
    
    else if (dto.action === ModerationAction.RESTORE) {
      review.is_hidden_by_moderation = false;
      review.report_count = 0;
      await this.reviewRepository.save(review);

      report.status = ReportStatus.DISMISSED;
      await this.reportRepository.save(report);

      await this.reviewsService.updateBusinessRating(review.business.id_business);
    }

    return { 
      message: `Acción '${dto.action}' ejecutada con éxito sobre la reseña #${review.id_review}` 
    };
  }
}