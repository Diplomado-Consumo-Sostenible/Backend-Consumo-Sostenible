import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';
import { MailService } from 'src/mail/mail.service';
import { AiService, ReviewSampleDto } from 'src/shared/ai/ai.service';
import { BusinessStatus } from 'src/shared/entities/business.entity';
import { ReviewSentiment } from 'src/shared/entities/review.entity';
import { BusinessRepository } from 'src/shared/repositories/business.repository';
import { ReviewRepository } from 'src/shared/repositories/review.repository';
import { Between, MoreThan } from 'typeorm';
import {
  SummaryTrend,
  WeeklySummaryDto,
  WeeklySummaryStatsDto,
} from '../../notifications/dto/weekly-summary.dto';

@Injectable()
export class ReviewsSummaryService {
  private readonly logger = new Logger(ReviewsSummaryService.name);

  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly businessRepository: BusinessRepository,
    private readonly aiService: AiService,
    private readonly mailService: MailService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Cron('0 9 * * 1', { name: 'weekly-review-reports' })
  async sendWeeklyReportsToAllBusinesses() {
    this.logger.log('📊 Iniciando reportes semanales de sentimientos...');

    const businesses = await this.businessRepository.find({
      where: { isActive: true, status: BusinessStatus.ACTIVE },
      relations: ['user'],
      select: ['id_business', 'businessName', 'user'],
    });

    let sent = 0;
    for (const business of businesses) {
      try {
        const summary = await this.buildWeeklySummary(business.id_business);
        if (summary.stats.total > 0) {
          this.eventEmitter.emit('sentiment.weekly.summary', summary);
          if (business.user?.email) {
            await this.mailService.sendWeeklyReport(
              business.user.email,
              summary,
            );
          }
          sent++;
        }
      } catch (error) {
        this.logger.error(
          `Error en reporte semanal para negocio ${business.id_business}: ${error.message}`,
        );
      }
    }

    this.logger.log(`✅ Reportes semanales enviados: ${sent}/${businesses.length} negocios`);
  }


  async generateWeeklySummary(businessId: number): Promise<WeeklySummaryDto> {
    const summary = await this.buildWeeklySummary(businessId);

    if (summary.stats.total > 0) {
      this.eventEmitter.emit('sentiment.weekly.summary', summary);
    }

    return summary;
  }

  private async buildWeeklySummary(businessId: number): Promise<WeeklySummaryDto> {
    const business = await this.businessRepository.findOne({
      where: { id_business: businessId },
      relations: ['user'],
    });
    if (!business) throw new NotFoundException('Negocio no encontrado.');

    const weekEnd   = new Date();
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    // Reseñas de esta semana
    const thisWeekReviews = await this.reviewRepository.find({
      where: {
        business: { id_business: businessId },
        is_hidden_by_moderation: false,
        created_at: MoreThan(weekStart),
      },
      order: { created_at: 'DESC' },
    });

    const total    = thisWeekReviews.length;
    const positive = thisWeekReviews.filter(r => r.sentiment === ReviewSentiment.POSITIVE).length;
    const neutral  = thisWeekReviews.filter(r => r.sentiment === ReviewSentiment.NEUTRAL).length;
    const negative = thisWeekReviews.filter(r => r.sentiment === ReviewSentiment.NEGATIVE).length;
    const averageRating = total > 0
      ? Number((thisWeekReviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(2))
      : 0;


    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);

    const prevWeekReviews = await this.reviewRepository.find({
      where: {
        business: { id_business: businessId },
        is_hidden_by_moderation: false,
        created_at: Between(prevWeekStart, weekStart),
      },
    });

    const prevTotal = prevWeekReviews.length;
    const prevNegPct = prevTotal > 0
      ? prevWeekReviews.filter(r => r.sentiment === ReviewSentiment.NEGATIVE).length / prevTotal
      : 0;
    const currNegPct = total > 0 ? negative / total : 0;

    let trend: SummaryTrend;
    if (currNegPct < prevNegPct - 0.1)      trend = 'improving';
    else if (currNegPct > prevNegPct + 0.1) trend = 'declining';
    else                                     trend = 'stable';

    const stats: WeeklySummaryStatsDto = {
      total, positive, neutral, negative, averageRating, trend,
    };

    // Sin reseñas → sin llamada a Claude
    if (total === 0) {
      return {
        businessId,
        businessName: business.businessName,
        weekStart,
        weekEnd,
        stats,
        aiSummary: 'No se recibieron reseñas esta semana.',
        generalReview: null,
      };
    }

    const topComments: ReviewSampleDto[] = thisWeekReviews.map(r => ({
      comment: r.comment,
      sentiment: r.sentiment,
      rating: r.rating,
    }));

    const aiSummary = await this.aiService.generateWeeklySummary(
      business.businessName,
      stats,
      topComments,
    );

    return {
      businessId,
      businessName: business.businessName,
      weekStart,
      weekEnd,
      stats,
      aiSummary,
      generalReview: business.ai_reviews_summary ?? null,
    };
  }


  async generateGeneralSummary(businessId: number): Promise<{
    generalReview: string;
    aiSummary: string;
    updatedAt: Date;
    stats: { total: number; positive: number; negative: number; neutral: number; averageRating: number };
  }> {
    const business = await this.businessRepository.findOne({
      where: { id_business: businessId },
    });
    if (!business) throw new NotFoundException('Negocio no encontrado.');

    const allReviews = await this.reviewRepository.find({
      where: {
        business: { id_business: businessId },
        is_hidden_by_moderation: false,
      },
      order: { created_at: 'DESC' },
      take: 100,
    });

    const total    = allReviews.length;
    const positive = allReviews.filter(r => r.sentiment === ReviewSentiment.POSITIVE).length;
    const negative = allReviews.filter(r => r.sentiment === ReviewSentiment.NEGATIVE).length;
    const neutral  = allReviews.filter(r => r.sentiment === ReviewSentiment.NEUTRAL).length;
    const averageRating = total > 0
      ? Number((allReviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(2))
      : 0;

    const stats = { total, positive, negative, neutral, averageRating };

    if (total === 0) {
      return {
        generalReview: 'Este negocio aún no tiene reseñas.',
        aiSummary: 'Sin datos suficientes.',
        updatedAt: new Date(),
        stats,
      };
    }

    const reviewsData: ReviewSampleDto[] = allReviews.map(r => ({
      comment: r.comment,
      sentiment: r.sentiment,
      rating: r.rating,
    }));


    const [generalReview, aiSummary] = await Promise.all([
      this.aiService.generateGeneralReview(business.businessName, reviewsData),
      this.aiService.generateWeeklySummary(
        business.businessName,
        { total, positive, neutral, negative, averageRating, trend: positive > negative ? 'improving' : 'stable' },
        reviewsData,
      ),
    ]);


    const updatedAt = new Date();
    await this.businessRepository.update(businessId, {
      ai_reviews_summary: generalReview,
      ai_summary_updated_at: updatedAt,
    });


    this.eventEmitter.emit('sentiment.general.summary', {
      businessId,
      businessName: business.businessName,
      generalReview,
      aiSummary,
      stats,
      updatedAt,
    });

    return { generalReview, aiSummary, updatedAt, stats };
  }


  async getSavedGeneralSummary(businessId: number) {
    const business = await this.businessRepository.findOne({
      where: { id_business: businessId },
      select: ['id_business', 'businessName', 'ai_reviews_summary', 'ai_summary_updated_at', 'total_reviews', 'average_rating'],
    });
    if (!business) throw new NotFoundException('Negocio no encontrado.');

    return {
      businessId,
      businessName: business.businessName,
      generalReview: business.ai_reviews_summary,
      updatedAt: business.ai_summary_updated_at,
      totalReviews: business.total_reviews,
      averageRating: business.average_rating,
      hasAiSummary: !!business.ai_reviews_summary,
    };
  }
}
