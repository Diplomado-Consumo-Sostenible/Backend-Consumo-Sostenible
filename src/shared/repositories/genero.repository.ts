import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Genero } from '../entities/genero.entity';

@Injectable()
export class GeneroRepository extends Repository<Genero> {
  constructor(dataSource: DataSource) {
    super(Genero, dataSource.createEntityManager());
  }
}