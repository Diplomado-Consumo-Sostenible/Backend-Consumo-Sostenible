import { Module } from '@nestjs/common';
import { ReviewsController } from './controllers/reviews.controller';
import { ReviewsService } from './services/reviews.service';
import { ReviewsReportController } from './controllers/reviews-report.controller';
import { ReviewsReportService } from './services/reviews-report.service';
import { ReviewsSummaryService } from './services/reviews-summary.service';
import { ReviewsSummaryController } from './controllers/reviews-summary.controller';
 
@Module({
  controllers: [
    ReviewsController,
    ReviewsReportController,
    ReviewsSummaryController,
  ],
  providers: [
    ReviewsService,
    ReviewsReportService,
    ReviewsSummaryService,
  ],
})
export class ReviewsModule {}
