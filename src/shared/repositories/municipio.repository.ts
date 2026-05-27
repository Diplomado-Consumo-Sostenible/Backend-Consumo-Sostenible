import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Municipio } from '../entities/municipio.entity';

@Injectable()
export class MunicipioRepository extends Repository<Municipio> {
  constructor(dataSource: DataSource) {
    super(Municipio, dataSource.createEntityManager());
  }
}
