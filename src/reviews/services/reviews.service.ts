import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { BusinessStatus } from '../../shared/entities/business.entity';
import { CreateReviewDto } from '../dto/create-review.dto';
import { PaginationDto } from '../../shared/pagination/dto/pagination.dto';
import { createPaginationResponse } from '../../shared/pagination/pagination.helper';
import { ReviewRepository } from 'src/shared/repositories/review.repository';
import { BusinessRepository } from 'src/shared/repositories/business.repository';
import { UpdateReviewDto } from '../dto/update-review.dto';
import { GetBusinessReviewsFilterDto, SortOrder } from '../dto/get-business-reviews-filter.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly businessRepository: BusinessRepository,
  ) {}

  private async updateBusinessRating(businessId: number) {
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

    const newReview = this.reviewRepository.create({
      ...createReviewDto,
      user: { id_usuario: user.id_usuario },
      business: { id_business: businessId },
    });

    await this.reviewRepository.save(newReview);
    await this.updateBusinessRating(businessId);

    return { message: 'Reseña creada con éxito.' };
  }


  async getBusinessReviews(businessId: number, filterDto: GetBusinessReviewsFilterDto) {
    const { page = 1, limit = 10, rating, order = SortOrder.DESC } = filterDto;
    const skip = (page - 1) * limit;

    const query = this.reviewRepository
      .createQueryBuilder('review')
      .innerJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('user.perfil', 'perfil')
      .where('review.business = :businessId', { id_business: businessId })
      .andWhere('user.isActive = true');

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

    Object.assign(review, updateReviewDto);
    await this.reviewRepository.save(review);

    if (updateReviewDto.rating) {
      await this.updateBusinessRating(review.business.id_business);
    }

    return { message: 'Reseña actualizada.' };
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
}