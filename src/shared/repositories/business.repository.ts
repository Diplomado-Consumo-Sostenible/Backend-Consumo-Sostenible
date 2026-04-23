import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Business } from '../entities/business.entity';

@Injectable()
export class BusinessRepository extends Repository<Business> {
  constructor(dataSource: DataSource) {
    super(Business, dataSource.createEntityManager());
  }
}
