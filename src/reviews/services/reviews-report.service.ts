import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateReviewReportDto } from '../dto/create-review-report.dto';
import { ReviewsService } from './reviews.service';
import { ReviewRepository } from 'src/shared/repositories/review.repository';
import { ReviewReportRepository } from 'src/shared/repositories/review-report.repository';
import { MoreThanOrEqual } from 'typeorm';
import { ModerationAction, ResolveReportDto } from '../dto/resolve-report.dto';
import { ReportStatus } from 'src/shared/entities/review-report.entity';
import { ReviewBlockRepository } from 'src/shared/repositories/review-block.repository';
import { UserRepository } from 'src/shared/repositories/user.repository';
import { MailService } from 'src/mail/mail.service';
import { GetReportedReviewsFilterDto } from '../dto/get-reported-reviews-filter.dto';

@Injectable()
export class ReviewsReportService {
  private readonly AUTO_HIDE_THRESHOLD = 3; 

  private readonly BAN_THRESHOLD = 3;

  constructor(
    private readonly reportRepository: ReviewReportRepository,
    private readonly reviewRepository: ReviewRepository,
    private readonly reviewsService: ReviewsService,
    private readonly blockRepository: ReviewBlockRepository,
    private readonly userRepository: UserRepository,
    private readonly mailService: MailService,
    private readonly eventEmitter: EventEmitter2,
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

        this.eventEmitter.emit('review.hidden', {
          reviewAuthorId: review.user.id_usuario,
          reviewId:       review.id_review,
          businessId:     review.business.id_business,
          businessName:   review.business.businessName,
        });
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

    const totalGlobal = await this.reviewRepository
      .createQueryBuilder('review')
      .where('review.report_count >= :min', { min: 1 })
      .getCount();

    const whereCondition: any = { report_count: MoreThanOrEqual(1) };
    if (reason) {
      whereCondition.reports = { reason };
    }

    const [reviews, total] = await this.reviewRepository.findAndCount({
      where: whereCondition,
      relations: ['reports', 'reports.user', 'user', 'business'],
      order: { report_count: 'DESC' },
      skip,
      take: limit,
    });

    if (total === 0) {
      return {
        data: [],
        meta: { total: 0, totalGlobal, page, totalPages: 1 },
      };
    }

    const formattedData = reviews.map(r => ({
      id_review:               r.id_review,
      rating:                  r.rating,
      comment:                 r.comment,
      sentiment:               r.sentiment,
      is_suspicious:           r.is_suspicious,
      report_count:            r.report_count,
      is_hidden_by_moderation: r.is_hidden_by_moderation,
      created_at:              r.created_at,
      user: {
        id_usuario: r.user.id_usuario,
        email:      r.user.email,
      },
      business: {
        id_business:  r.business.id_business,
        businessName: r.business.businessName,
      },
      reports: r.reports.map(rep => ({
        id_report:      rep.id_report,
        reason:         rep.reason,
        details:        rep.details,
        created_at:     rep.created_at,
        reporter_email: rep.user.email,
      })),
    }));

    return {
      data: formattedData,
      meta: {
        total,
        totalGlobal,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
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
      const reviewAuthorId = review.user.id_usuario;
      const businessName   = review.business.businessName;

      const block = this.blockRepository.create({
        user:     { id_usuario: reviewAuthorId },
        business: { id_business: businessId },
      });
      await this.blockRepository.save(block);

      const penaltyCount = await this.blockRepository.count({
        where: { user: { id_usuario: reviewAuthorId } },
      });

      const isBanned = penaltyCount >= this.BAN_THRESHOLD;
      if (isBanned) {
        await this.userRepository.update(
          { id_usuario: reviewAuthorId },
          { isActive: false },
        );
      }

      await this.reviewRepository.remove(review);
      await this.reviewsService.updateBusinessRating(businessId);

      this.eventEmitter.emit('review.deleted_by_moderation', {
        reviewAuthorId,
        reviewId,
        businessId,
        businessName,
        penaltyCount,
        isBanned,
      });

      try {
        await this.mailService.sendReviewDeletedAlert(userEmail, businessName);
      } catch (error) {
        console.error(`No se pudo enviar correo de penalización a ${userEmail}:`, error);
      }
    } 
    else if (dto.action === ModerationAction.RESTORE) {
      const reviewAuthorId = review.user.id_usuario;
      const businessName   = review.business.businessName;

      review.is_hidden_by_moderation = false;
      review.report_count = 0;
      await this.reviewRepository.save(review);

      await this.reportRepository.update(
        { review: { id_review: reviewId } },
        { status: ReportStatus.DISMISSED },
      );

      await this.reviewsService.updateBusinessRating(businessId);

      this.eventEmitter.emit('review.restored_by_moderation', {
        reviewAuthorId,
        reviewId,
        businessId,
        businessName,
      });
    }

    return { 
      message: `Acción '${dto.action}' ejecutada con éxito sobre la reseña #${reviewId}` 
    };
  }
}