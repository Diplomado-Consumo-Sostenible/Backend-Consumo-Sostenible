import { Module } from '@nestjs/common';
import { ReviewsController } from './controllers/reviews.controller';
import { ReviewsService } from './services/reviews.service';
import { ReviewsReportController } from './controllers/reviews-report.controller';
import { ReviewsReportService } from './services/reviews-report.service';

@Module({
  controllers: [ReviewsController, ReviewsReportController],
  providers: [ReviewsService, ReviewsReportService],
})
export class ReviewsModule {}
