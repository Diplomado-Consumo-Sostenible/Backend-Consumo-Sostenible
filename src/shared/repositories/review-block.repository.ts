import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ReviewBlock } from '../entities/review-block.entity';

@Injectable()
export class ReviewBlockRepository extends Repository<ReviewBlock> {
  constructor(dataSource: DataSource) {
    super(ReviewBlock, dataSource.createEntityManager());
  }
}
