import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/jwt-auth/roles.guard';
import { ReviewsSummaryService } from '../services/reviews-summary.service';

@ApiTags('reviews-summary')
@Controller('reviews/summary')
export class ReviewsSummaryController {
  constructor(private readonly summaryService: ReviewsSummaryService) {}

  @Get('business/:businessId/weekly')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Generar reporte semanal IA para un negocio (admin)',
  })
  @ApiResponse({ status: 200, description: 'Reporte semanal generado con IA' })
  generateWeeklySummary(@Param('businessId', ParseIntPipe) businessId: number) {
    return this.summaryService.generateWeeklySummary(businessId);
  }

  @Post('business/:businessId/general/regenerate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'owner')
  @ApiOperation({
    summary: 'Regenerar reseña general IA de todas las reviews (admin)',
  })
  @ApiResponse({
    status: 200,
    description:
      'Reseña general generada y guardada en business.ai_reviews_summary',
  })
  regenerateGeneralSummary(
    @Param('businessId', ParseIntPipe) businessId: number,
  ) {
    return this.summaryService.generateGeneralSummary(businessId);
  }

  @Get('business/:businessId/general')
  @ApiOperation({
    summary: 'Obtener la reseña general IA guardada de un negocio (público)',
  })
  @ApiResponse({ status: 200, description: 'Reseña general guardada' })
  getSavedGeneralSummary(
    @Param('businessId', ParseIntPipe) businessId: number,
  ) {
    return this.summaryService.getSavedGeneralSummary(businessId);
  }
}
