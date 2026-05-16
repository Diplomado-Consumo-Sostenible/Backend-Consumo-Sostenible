import { Controller, Post, Param, Body, UseGuards, ParseIntPipe, Get, Query, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsReportService } from '../services/reviews-report.service';
import { CreateReviewReportDto } from '../dto/create-review-report.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorator/user.decorator';
import { RolesGuard } from 'src/auth/jwt-auth/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { PaginationDto } from 'src/shared/pagination/dto/pagination.dto';
import { ResolveReportDto } from '../dto/resolve-report.dto';

@ApiTags('reviews-reports')
@Controller('reviews/reports')
export class ReviewsReportController {
  constructor(private readonly reportsService: ReviewsReportService) {}


  @Get('reported/admin-queue')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN') 
  @ApiOperation({ summary: 'Ver reseñas reportadas ordenadas por cantidad de reportes' })
  getReportedReviews(
    @Query() paginationDto: PaginationDto,
  ) {
    return this.reportsService.getReportedReviews(paginationDto);
  }


  @Post(':reviewId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Reportar una reseña' })
  reportReview(
    @Param('reviewId', ParseIntPipe) reviewId: number,
    @Body() dto: CreateReviewReportDto,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.reportReview(reviewId, user, dto);
  }

  @Patch('resolve/:reportId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Resolver un reporte (Borrar o Restaurar reseña)' })
  resolveReport(
    @Param('reportId', ParseIntPipe) reportId: number,
    @Body() dto: ResolveReportDto,
  ) {
    return this.reportsService.resolveReport(reportId, dto);
  }
}