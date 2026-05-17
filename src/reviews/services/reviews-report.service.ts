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
import { GetReportedReviewsFilterDto } from '../dto/get-reported-reviews-filter.dto';

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

      review.report_count += 1;
      let wasAutoHidden = false;

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

  async getReportedReviews(filterDto: GetReportedReviewsFilterDto) {
    const { page = 1, limit = 10, reason } = filterDto;
    const skip = (page - 1) * limit;
    
    const whereCondition: any = { report_count: MoreThanOrEqual(1) };

    if (reason) {
      whereCondition.reports = { reason: reason };
    }


    const [reviews, total] = await this.reviewRepository.findAndCount({
      where: whereCondition,
      relations: ['reports', 'reports.user', 'user', 'business'],
      order: { report_count: 'DESC' },
      skip,
      take: limit,
    });

    if (total === 0) throw new NotFoundException('No se encontraron reseñas con esos criterios.');

    const formattedData = reviews.map(r => ({
      id_review: r.id_review,
      rating: r.rating,
      comment: r.comment,
      sentiment: r.sentiment,
      is_suspicious: r.is_suspicious,
      report_count: r.report_count,
      is_hidden_by_moderation: r.is_hidden_by_moderation,
      created_at: r.created_at,
      user: {
        id_usuario: r.user.id_usuario,
        email: r.user.email,
      },
      business: {
        id_business: r.business.id_business,
        businessName: r.business.businessName,
      },
      reports: r.reports.map(rep => ({
        id_report: rep.id_report,
        reason: rep.reason,
        details: rep.details,
        created_at: rep.created_at,
        reporter_email: rep.user.email
      }))
    }));

    return createPaginationResponse(formattedData, total, page, limit);
    }

async moderateReview(reviewId: number, dto: ResolveReportDto) {
    const review = await this.reviewRepository.findOne({
      where: { id_review: reviewId },
      relations: ['business', 'user'],
    });

    if (!review) throw new NotFoundException('La reseña no existe o ya fue eliminada.');

    const businessId = review.business.id_business;
    const userEmail = review.user.email;

    if (dto.action === ModerationAction.DELETE) {
      const block = this.blockRepository.create({
        user: { id_usuario: review.user.id_usuario },
        business: { id_business: businessId }
      });
      await this.blockRepository.save(block);
    
      await this.reviewRepository.remove(review);
      await this.reviewsService.updateBusinessRating(businessId);

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


      await this.reportRepository.update(
        { review: { id_review: reviewId } },
        { status: ReportStatus.DISMISSED }
      );


      await this.reviewsService.updateBusinessRating(businessId);
    }

    return { 
      message: `Acción '${dto.action}' ejecutada con éxito sobre la reseña #${reviewId}` 
    };
  }
}