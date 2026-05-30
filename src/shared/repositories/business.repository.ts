import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Business } from '../entities/business.entity';

@Injectable()
export class BusinessRepository extends Repository<Business> {
  constructor(dataSource: DataSource) {
    super(Business, dataSource.createEntityManager());
  }

  async findPublicWithRelevanceScore(opts: {
    skip: number;
    take: number;
    id_category?: number;
    id_tag?: number;
    id_departamento?: number;
    id_municipio?: number;
    search?: string;
  }): Promise<[Business[], number]> {
    const qb = this.createQueryBuilder('b')
      .leftJoinAndSelect('b.category', 'category')
      .leftJoinAndSelect('b.tags', 'tags')
      .leftJoinAndSelect('b.certifications', 'certifications')
      .leftJoinAndSelect('b.municipio', 'municipio')
      .leftJoinAndSelect('municipio.departamento', 'dep')
      .where('b.status = :status', { status: 'Active' })
      .andWhere('b.isActive = :isActive', { isActive: true })
      .andWhere('b.isDeletedByOwner = :isDeletedByOwner', { isDeletedByOwner: false });

    if (opts.id_category) {
      qb.andWhere('category.id_category = :id_category', {
        id_category: opts.id_category,
      });
    }
    if (opts.id_tag) {
      qb.andWhere('tags.id_tags = :id_tag', { id_tag: opts.id_tag });
    }
    if (opts.id_municipio) {
      qb.andWhere('municipio.id_municipio = :id_municipio', {
        id_municipio: opts.id_municipio,
      });
    } else if (opts.id_departamento) {
      qb.andWhere('dep.id_departamento = :id_departamento', {
        id_departamento: opts.id_departamento,
      });
    }
    if (opts.search) {
      qb.andWhere('b.businessName ILIKE :search', {
        search: `%${opts.search}%`,
      });
    }

    qb.addSelect(
      `
      (
        (CAST(b.average_rating  AS FLOAT) / 5.0) * 0.40 +
        (LN(CAST(b.total_reviews   AS FLOAT) + 1) / LN(51)) * 0.25 +
        (LN(CAST(b.followers_count AS FLOAT) + 1) / LN(51)) * 0.25 +
        (1.0 / (1.0 + EXTRACT(EPOCH FROM (NOW() - b."createdAt")) / 7776000.0)) * 0.10
      )
    `,
      'relevance_score',
    )
      .orderBy('relevance_score', 'DESC')
      .skip(opts.skip)
      .take(opts.take);

    return qb.getManyAndCount();
  }
}
