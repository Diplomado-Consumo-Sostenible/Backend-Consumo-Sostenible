import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Tag } from '../entities/tags.entity';


@Injectable()
export class TagsRepository extends Repository<Tag> {
  constructor(dataSource: DataSource) {
    super(Tag, dataSource.createEntityManager());
  }
}