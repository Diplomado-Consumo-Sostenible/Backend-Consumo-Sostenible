import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Perfil } from '../entities/perfil.entity';

@Injectable()
export class PerfilRepository extends Repository<Perfil> {
  constructor(dataSource: DataSource) {
    super(Perfil, dataSource.createEntityManager());
  }
}
