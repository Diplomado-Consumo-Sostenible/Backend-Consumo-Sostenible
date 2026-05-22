import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  Query,
  Patch,
} from '@nestjs/common';
import { ReviewsService } from '../services/reviews.service';
import { CreateReviewDto } from '../dto/create-review.dto';
import { PaginationDto } from '../../shared/pagination/dto/pagination.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorator/user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UpdateReviewDto } from '../dto/update-review.dto';
import { GetBusinessReviewsFilterDto } from '../dto/get-business-reviews-filter.dto';
import { RolesGuard } from 'src/auth/jwt-auth/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('business/:businessId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Crear una nueva reseña para un negocio' })
  @ApiResponse({ status: 201, description: 'Reseña creada' })
  @ApiResponse({ status: 409, description: 'El usuario ya calificó este negocio' })
  createReview(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Body() createReviewDto: CreateReviewDto,
    @CurrentUser() user: any,
  ) {
    return this.reviewsService.createReview(businessId, user, createReviewDto);
  }

  @Get('my-history')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Ver mi historial de reseñas realizadas' })
  getMyReviews(
    @CurrentUser() user: any,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.reviewsService.getMyReviews(user, paginationDto);
  }

  @Get('suspicious')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN') 
  @ApiOperation({ summary: 'Ver reseñas sospechosas' })
  getSuspiciousReviews(
    @CurrentUser() user: any,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.reviewsService.getSuspiciousReviews(paginationDto);
  }
  
  @Get('my-review/business/:businessId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener mi reseña para un negocio específico' })
  getMyReviewForBusiness(
    @Param('businessId', ParseIntPipe) businessId: number,
    @CurrentUser() user: any,
  ) {
    return this.reviewsService.getMyReviewForBusiness(businessId, user);
  }

  @Get('business/:businessId')
  @ApiOperation({ summary: 'Listar las reseñas de un negocio con paginación (Público)' })
  getBusinessReviews(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Query() filterDto: GetBusinessReviewsFilterDto,
  ) {
    return this.reviewsService.getBusinessReviews(businessId, filterDto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Actualizar una reseña propia' })
  @ApiResponse({ status: 200, description: 'Reseña actualizada exitosamente' })
  updateReview(
    @Param('id', ParseIntPipe) reviewId: number,
    @Body() updateReviewDto: UpdateReviewDto,
    @CurrentUser() user: any,
  ) {
    return this.reviewsService.updateReview(reviewId, user, updateReviewDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Eliminar una reseña (Solo autor o Admin)' })
  deleteReview(
    @Param('id', ParseIntPipe) reviewId: number,
    @CurrentUser() user: any,
  ) {
    return this.reviewsService.deleteReview(reviewId, user);
  }
}