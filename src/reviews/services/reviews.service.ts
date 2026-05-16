import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { BusinessStatus } from '../../shared/entities/business.entity';
import { CreateReviewDto } from '../dto/create-review.dto';
import { PaginationDto } from '../../shared/pagination/dto/pagination.dto';
import { createPaginationResponse } from '../../shared/pagination/pagination.helper';
import { ReviewRepository } from 'src/shared/repositories/review.repository';
import { BusinessRepository } from 'src/shared/repositories/business.repository';
import { UpdateReviewDto } from '../dto/update-review.dto';
import { GetBusinessReviewsFilterDto, SortOrder } from '../dto/get-business-reviews-filter.dto';
import { AiService } from 'src/shared/ai/ai.service';
import { MailService } from 'src/mail/mail.service';
import { ReviewSentiment } from '../../shared/entities/review.entity';
import { ReviewBlockRepository } from 'src/shared/repositories/review-block.repository';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly businessRepository: BusinessRepository,
    private readonly aiService: AiService,
    private readonly mailService: MailService,
    private readonly blockRepository: ReviewBlockRepository,
  ) {}

  async updateBusinessRating(businessId: number) {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .innerJoin('review.user', 'user')
      .select('AVG(review.rating)', 'avg')
      .addSelect('COUNT(review.id_review)', 'count')
      .where('review.business = :businessId', { businessId })
      .andWhere('user.isActive = true')
      .getRawOne();

    const newAvg = result.avg ? parseFloat(result.avg) : 0;
    const newCount = result.count ? parseInt(result.count, 10) : 0;

    await this.businessRepository.update(businessId, {
      average_rating: Number(newAvg.toFixed(2)),
      total_reviews: newCount,
    });
  }


  async createReview(businessId: number, user: any, createReviewDto: CreateReviewDto) {
    if (!user.isActive) {
      throw new ForbiddenException('Tu cuenta está inhabilitada.');
    }

    const isBlocked = await this.blockRepository.findOne({
      where: { 
        user: { id_usuario: user.id_usuario }, 
        business: { id_business: businessId } 
      }
    });

    if (isBlocked) {
      throw new ForbiddenException('Has sido penalizado y no puedes volver a calificar este negocio.');
    }

    const business = await this.businessRepository.findOne({
      where: { id_business: businessId },
      relations: ['user'],
    });

    if (!business) throw new NotFoundException('Negocio no encontrado');

    if (business.status !== BusinessStatus.ACTIVE || !business.isActive) {
      throw new BadRequestException('Este negocio no está disponible para recibir reseñas.');
    }

    if (business.user.id_usuario === user.id_usuario) {
      throw new ForbiddenException('No puedes calificar tu propio negocio.');
    }

    const existingReview = await this.reviewRepository.findOne({
      where: { user: { id_usuario: user.id_usuario }, business: { id_business: businessId } },
    });

    if (existingReview) throw new ConflictException('Ya calificaste este negocio.');


    const aiResult = await this.aiService.analyzeSentiment(createReviewDto.comment);
    let isSuspicious = false;


    const starDifference = Math.abs(createReviewDto.rating - aiResult.aiStars);
    if (starDifference >= 3) {
      isSuspicious = true;
    }


    if (aiResult.sentiment === ReviewSentiment.NEGATIVE && business.user?.email) {
      try {
        await this.mailService.sendNegativeReviewAlert(
          business.user.email,
          business.businessName,
          createReviewDto.comment
        );
      } catch (error) {
        this.logger.error(`Error enviando correo al negocio ${businessId}:`, error);
      }
    }

    const newReview = this.reviewRepository.create({
      ...createReviewDto,
      sentiment: aiResult.sentiment,
      is_suspicious: isSuspicious,
      user: { id_usuario: user.id_usuario },
      business: { id_business: businessId },
    });

    await this.reviewRepository.save(newReview);
    await this.updateBusinessRating(businessId);

    return { 
      message: isSuspicious 
        ? 'Tu reseña fue publicada, pero ha sido marcada para revisión por incongruencia.'
        : 'Reseña creada con éxito.' 
    };
  }


  async getBusinessReviews(businessId: number, filterDto: GetBusinessReviewsFilterDto) {
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

    query.orderBy('review.created_at', order)
         .skip(skip)
         .take(limit);

    const [reviews, total] = await query.getManyAndCount();

    if (total === 0) throw new NotFoundException('No hay reseñas para mostrar con estos filtros.');

    const formattedReviews = reviews.map(r => ({
      id_review: r.id_review,
      rating: r.rating,
      comment: r.comment,
      fecha: r.created_at,
      usuario: r.user.perfil?.nombre || 'Usuario EcoVida'
    }));

    return createPaginationResponse(formattedReviews, total, page, limit);
  }


  async getMyReviews(user: any, paginationDto: PaginationDto) {
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
      throw new NotFoundException('Aún no has escrito ninguna reseña.');
    }

    const formattedReviews = reviews.map(r => ({
      id_review: r.id_review,
      rating: r.rating,
      comment: r.comment,
      fecha: r.created_at,
      negocio: {
        id_business: r.business.id_business,
        nombre: r.business.businessName
      }
    }));

    return createPaginationResponse(formattedReviews, total, page, limit);
  }


  async updateReview(reviewId: number, user: any, updateReviewDto: UpdateReviewDto) {
    if (!user.isActive) {
      throw new ForbiddenException('Cuenta inhabilitada.');
    }

    const review = await this.reviewRepository.findOne({
      where: { id_review: reviewId },
      relations: ['user', 'business']
    });

    if (!review) throw new NotFoundException('Reseña no encontrada.');
    if (review.user.id_usuario !== user.id_usuario) throw new ForbiddenException('No es tu reseña.');

    const business = await this.businessRepository.findOne({ where: { id_business: review.business.id_business }});
    if (!business) {
        throw new NotFoundException('Negocio no encontrado.');
    }
    if (!business.isActive || business.status !== BusinessStatus.ACTIVE) {
        throw new BadRequestException('El negocio ya no acepta cambios en sus reseñas.');
    }

    if (updateReviewDto.comment || updateReviewDto.rating) {
      const textToAnalyze = updateReviewDto.comment || review.comment;
      const currentRating = updateReviewDto.rating || review.rating;

      const aiResult = await this.aiService.analyzeSentiment(textToAnalyze);
      const starDifference = Math.abs(currentRating - aiResult.aiStars);
      
      review.sentiment = aiResult.sentiment;
      review.is_suspicious = starDifference >= 3;
    }

    Object.assign(review, updateReviewDto);
    await this.reviewRepository.save(review);

    if (updateReviewDto.rating) {
      await this.updateBusinessRating(review.business.id_business);
    }

    return { 
      message: review.is_suspicious 
        ? 'Reseña actualizada, pero ha sido marcada para revisión por incongruencia.'
        : 'Reseña actualizada correctamente.' 
    };
  }


  async deleteReview(reviewId: number, user: any) {
    const review = await this.reviewRepository.findOne({
      where: { id_review: reviewId },
      relations: ['user', 'business'],
    });

    if (!review) {
      throw new NotFoundException('La reseña no existe.');
    }

    if (review.user.id_usuario !== user.id_usuario && user.rol.nombre !== 'admin') {
      throw new ForbiddenException('No tienes permisos para eliminar esta reseña.');
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

    if (total === 0) throw new NotFoundException('No hay reseñas sospechosas en este momento.');

    const formattedReviews = reviews.map(r => ({
      id_review: r.id_review,
      rating: r.rating,
      sentiment_ia: r.sentiment,
      comment: r.comment,
      fecha: r.created_at,
      usuario: { id: r.user.id_usuario, email: r.user.email },
      negocio: { id: r.business.id_business, nombre: r.business.businessName }
    }));

    return createPaginationResponse(formattedReviews, total, page, limit);
  }
}