import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Follow } from '../entities/follow.entity';

@Injectable()
export class FollowRepository extends Repository<Follow> {
  constructor(dataSource: DataSource) {
    super(Follow, dataSource.createEntityManager());
  }
}
