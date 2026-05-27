import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ReviewReport } from '../entities/review-report.entity';

@Injectable()
export class ReviewReportRepository extends Repository<ReviewReport> {
  constructor(dataSource: DataSource) {
    super(ReviewReport, dataSource.createEntityManager());
  }
}
