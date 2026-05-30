import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BusinessStatus } from '../../shared/entities/business.entity';
import { CreateReviewDto } from '../dto/create-review.dto';
import { PaginationDto } from '../../shared/pagination/dto/pagination.dto';
import { createPaginationResponse } from '../../shared/pagination/pagination.helper';
import { ReviewRepository } from 'src/shared/repositories/review.repository';
import { BusinessRepository } from 'src/shared/repositories/business.repository';
import { UpdateReviewDto } from '../dto/update-review.dto';
import {
  GetBusinessReviewsFilterDto,
  SortOrder,
} from '../dto/get-business-reviews-filter.dto';
import { AiService } from 'src/shared/ai/ai.service';
import { MailService } from 'src/mail/mail.service';
import { ReviewSentiment } from '../../shared/entities/review.entity';
import { ReviewBlockRepository } from 'src/shared/repositories/review-block.repository';
import { MoreThan } from 'typeorm';
import { User } from 'src/shared/entities/user.entity';
import { SentimentNotificationDto } from '../../notifications/dto/sentiment-notification.dto';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly businessRepository: BusinessRepository,
    private readonly aiService: AiService,
    private readonly mailService: MailService,
    private readonly blockRepository: ReviewBlockRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private async checkAndSendBusinessAlerts(
    businessId: number,
    email: string,
    businessName: string,
    oldAvg: number,
    newAvg: number,
    sentiment: ReviewSentiment,
    basePayload: SentimentNotificationDto,
  ) {
    const CRITICAL_RATING = 3.5;
    const NEGATIVE_REVIEWS_LIMIT = 5;

    if (
      newAvg > 0 &&
      newAvg < CRITICAL_RATING &&
      (oldAvg >= CRITICAL_RATING || oldAvg === 0)
    ) {
      try {
        await this.mailService.sendCriticalRatingAlert(
          email,
          businessName,
          newAvg,
        );
        this.eventEmitter.emit('sentiment.alert.critical_rating', {
          ...basePayload,
          alertType: 'critical_rating',
          currentRating: newAvg,
        });
      } catch (error) {
        this.logger.error(
          `Error enviando alerta crítica al negocio ${businessId}:`,
          error,
        );
      }
    }

    if (sentiment === ReviewSentiment.NEGATIVE) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const totalNegatives = await this.reviewRepository.count({
        where: {
          business: { id_business: businessId },
          sentiment: ReviewSentiment.NEGATIVE,
          is_hidden_by_moderation: false,
          created_at: MoreThan(thirtyDaysAgo),
        },
      });

      if (totalNegatives > 0 && totalNegatives % NEGATIVE_REVIEWS_LIMIT === 0) {
        try {
          await this.mailService.sendAccumulatedNegativesAlert(
            email,
            businessName,
            totalNegatives,
          );
          this.eventEmitter.emit('sentiment.alert.accumulated_negatives', {
            ...basePayload,
            alertType: 'accumulated_negatives',
            totalNegatives,
          });
        } catch (error) {
          this.logger.error(
            `Error enviando alerta de acumulación al negocio ${businessId}:`,
            error,
          );
        }
      }
    }
  }

  async updateBusinessRating(businessId: number) {
    const business = await this.businessRepository.findOne({
      where: { id_business: businessId },
      select: ['average_rating'],
    });
    const oldAvg = business?.average_rating || 0;

    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .innerJoin('review.user', 'user')
      .select('AVG(review.rating)', 'avg')
      .addSelect('COUNT(review.id_review)', 'count')
      .where('review.business = :businessId', { businessId })
      .andWhere('user.isActive = true')
      .andWhere('review.is_hidden_by_moderation = false')
      .getRawOne();

    const newAvg = result.avg ? parseFloat(result.avg) : 0;
    const newCount = result.count ? parseInt(result.count, 10) : 0;
    const finalAvg = Number(newAvg.toFixed(2));

    await this.businessRepository.update(businessId, {
      average_rating: finalAvg,
      total_reviews: newCount,
    });

    return { oldAvg, newAvg: finalAvg };
  }

  async createReview(
    businessId: number,
    user: User,
    createReviewDto: CreateReviewDto,
  ) {
    if (!user.isActive) {
      throw new ForbiddenException('Tu cuenta está inhabilitada.');
    }

    const isBlocked = await this.blockRepository.findOne({
      where: {
        user: { id_usuario: user.id_usuario },
        business: { id_business: businessId },
      },
    });

    if (isBlocked) {
      throw new ForbiddenException(
        'Has sido penalizado y no puedes volver a calificar este negocio.',
      );
    }

    const business = await this.businessRepository.findOne({
      where: { id_business: businessId },
      relations: ['user'],
    });

    if (!business) throw new NotFoundException('Negocio no encontrado');

    if (business.status !== BusinessStatus.ACTIVE || !business.isActive) {
      throw new BadRequestException(
        'Este negocio no está disponible para recibir reseñas.',
      );
    }

    if (business.user.id_usuario === user.id_usuario) {
      throw new ForbiddenException('No puedes calificar tu propio negocio.');
    }

    const existingReview = await this.reviewRepository.findOne({
      where: {
        user: { id_usuario: user.id_usuario },
        business: { id_business: businessId },
      },
    });

    if (existingReview)
      throw new ConflictException('Ya calificaste este negocio.');

    const aiResult = await this.aiService.analyzeSentiment(
      createReviewDto.comment,
    );

    const starDifference = Math.abs(createReviewDto.rating - aiResult.aiStars);

    if (starDifference >= 3) {
      throw new BadRequestException({
        message:
          'Tu reseña parece incongruente entre la calificación dada y el contenido del comentario.',
        code: 'SUSPICIOUS_REVIEW',
        aiStars: aiResult.aiStars,
      });
    }

    const newReview = this.reviewRepository.create({
      ...createReviewDto,
      sentiment: aiResult.sentiment,
      is_suspicious: false,
      user: { id_usuario: user.id_usuario },
      business: { id_business: businessId },
    });

    await this.reviewRepository.save(newReview);

    const { oldAvg, newAvg } = await this.updateBusinessRating(businessId);

    const notificationPayload: SentimentNotificationDto = {
      businessId,
      businessName: business.businessName,
      reviewId: newReview.id_review,
      sentiment: aiResult.sentiment,
      aiStars: aiResult.aiStars,
      probabilidades: aiResult.probabilidades,
      urgency: aiResult.urgency,
      comment: createReviewDto.comment,
      timestamp: new Date(),
      isSuspicious: false,
    };

    this.eventEmitter.emit('sentiment.review.created', notificationPayload);

    if (business.user?.email) {
      await this.checkAndSendBusinessAlerts(
        businessId,
        business.user.email,
        business.businessName,
        oldAvg,
        newAvg,
        aiResult.sentiment,
        notificationPayload,
      );
    }

    return { message: 'Reseña creada con éxito.' };
  }

  async getBusinessReviews(
    businessId: number,
    filterDto: GetBusinessReviewsFilterDto,
  ) {
    const { page = 1, limit = 10, rating, order = SortOrder.DESC } = filterDto;
    const skip = (page - 1) * limit;

    const query = this.reviewRepository
      .createQueryBuilder('review')
      .innerJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('user.perfil', 'perfil')
      .where('review.business = :businessId', { businessId })
      .andWhere('user.isActive = true')
      .andWhere('review.is_hidden_by_moderation = false');

    if (rating) {
      query.andWhere('review.rating = :rating', { rating });
    }

    query.orderBy('review.created_at', order).skip(skip).take(limit);

    const [reviews, total] = await query.getManyAndCount();

    if (total === 0) {
      return createPaginationResponse([], 0, page, limit);
    }

    const formattedReviews = reviews.map((r) => ({
      id_review: r.id_review,
      rating: r.rating,
      comment: r.comment,
      fecha: r.created_at,
      id_usuario: r.user.id_usuario,
      usuario: r.user.perfil?.nombre || 'Usuario EcoVida',
      avatar: r.user.perfil?.foto_perfil ?? null,
    }));

    return createPaginationResponse(formattedReviews, total, page, limit);
  }

  async getMyReviewForBusiness(businessId: number, user: User) {
    const review = await this.reviewRepository.findOne({
      where: {
        user: { id_usuario: user.id_usuario },
        business: { id_business: businessId },
      },
    });
    if (!review)
      throw new NotFoundException('No tienes una reseña para este negocio.');
    return {
      id_review: review.id_review,
      rating: review.rating,
      comment: review.comment,
      fecha: review.created_at,
    };
  }

  async getMyReviews(user: User, paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [reviews, total] = await this.reviewRepository.findAndCount({
      where: { user: { id_usuario: user.id_usuario } },
      relations: ['business'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    if (total === 0) {
      return createPaginationResponse([], 0, page, limit);
    }

    const formattedReviews = reviews.map((r) => ({
      id_review: r.id_review,
      rating: r.rating,
      comment: r.comment,
      fecha: r.created_at,
      negocio: {
        id_business: r.business.id_business,
        nombre: r.business.businessName,
        logo: r.business.logo,
      },
    }));

    return createPaginationResponse(formattedReviews, total, page, limit);
  }

  async updateReview(
    reviewId: number,
    user: User,
    updateReviewDto: UpdateReviewDto,
  ) {
    if (!user.isActive) {
      throw new ForbiddenException('Cuenta inhabilitada.');
    }

    const review = await this.reviewRepository.findOne({
      where: { id_review: reviewId },
      relations: ['user', 'business'],
    });

    if (!review) throw new NotFoundException('Reseña no encontrada.');
    if (review.user.id_usuario !== user.id_usuario)
      throw new ForbiddenException('No es tu reseña.');

    const business = await this.businessRepository.findOne({
      where: { id_business: review.business.id_business },
      relations: ['user'],
    });
    if (!business) throw new NotFoundException('Negocio no encontrado.');
    if (!business.isActive || business.status !== BusinessStatus.ACTIVE) {
      throw new BadRequestException(
        'El negocio ya no acepta cambios en sus reseñas.',
      );
    }

    let aiResult: Awaited<
      ReturnType<typeof this.aiService.analyzeSentiment>
    > | null = null;

    if (updateReviewDto.comment || updateReviewDto.rating) {
      const textToAnalyze = updateReviewDto.comment || review.comment;
      const currentRating = updateReviewDto.rating || review.rating;

      aiResult = await this.aiService.analyzeSentiment(textToAnalyze);
      const starDifference = Math.abs(currentRating - aiResult.aiStars);

      if (starDifference >= 3) {
        throw new BadRequestException({
          message:
            'Tu reseña parece incongruente entre la calificación y el contenido del comentario.',
          code: 'SUSPICIOUS_REVIEW',
          aiStars: aiResult.aiStars,
        });
      }

      review.sentiment = aiResult.sentiment;
      review.is_suspicious = false;
    }

    Object.assign(review, updateReviewDto);
    await this.reviewRepository.save(review);

    if (updateReviewDto.rating || updateReviewDto.comment) {
      const { oldAvg, newAvg } = await this.updateBusinessRating(
        review.business.id_business,
      );

      if (aiResult && business.user?.email) {
        const notificationPayload: SentimentNotificationDto = {
          businessId: business.id_business,
          businessName: business.businessName,
          reviewId: review.id_review,
          sentiment: aiResult.sentiment,
          aiStars: aiResult.aiStars,
          probabilidades: aiResult.probabilidades,
          urgency: aiResult.urgency,
          comment: updateReviewDto.comment || review.comment,
          timestamp: new Date(),
          isSuspicious: review.is_suspicious,
        };

        this.eventEmitter.emit('sentiment.review.created', notificationPayload);

        if (review.is_suspicious) {
          this.eventEmitter.emit(
            'sentiment.review.suspicious',
            notificationPayload,
          );
        }

        await this.checkAndSendBusinessAlerts(
          business.id_business,
          business.user.email,
          business.businessName,
          oldAvg,
          newAvg,
          review.sentiment,
          notificationPayload,
        );
      }
    }

    return { message: 'Reseña actualizada correctamente.' };
  }

  async deleteReview(reviewId: number, user: User) {
    const review = await this.reviewRepository.findOne({
      where: { id_review: reviewId },
      relations: ['user', 'business'],
    });

    if (!review) {
      throw new NotFoundException('La reseña no existe.');
    }

    if (
      review.user.id_usuario !== user.id_usuario &&
      user.rol.nombre !== 'admin'
    ) {
      throw new ForbiddenException(
        'No tienes permisos para eliminar esta reseña.',
      );
    }

    const businessId = review.business.id_business;
    await this.reviewRepository.remove(review);
    await this.updateBusinessRating(businessId);

    return { message: 'Reseña eliminada correctamente.' };
  }

  async getSuspiciousReviews(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [reviews, total] = await this.reviewRepository.findAndCount({
      where: { is_suspicious: true },
      relations: ['user', 'business'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    if (total === 0)
      throw new NotFoundException(
        'No hay reseñas sospechosas en este momento.',
      );

    const formattedReviews = reviews.map((r) => ({
      id_review: r.id_review,
      rating: r.rating,
      sentiment_ia: r.sentiment,
      comment: r.comment,
      fecha: r.created_at,
      usuario: { id: r.user.id_usuario, email: r.user.email },
      negocio: { id: r.business.id_business, nombre: r.business.businessName },
    }));

    return createPaginationResponse(formattedReviews, total, page, limit);
  }
}
