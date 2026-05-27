import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Departamento } from '../entities/departamento.entity';

@Injectable()
export class DepartamentoRepository extends Repository<Departamento> {
  constructor(dataSource: DataSource) {
    super(Departamento, dataSource.createEntityManager());
  }
}
