import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Departamento } from './departamento.entity';
import { Business } from './business.entity';

@Entity('municipio')
export class Municipio {
  @PrimaryGeneratedColumn()
  id_municipio: number;

  @Column()
  nombre: string;

  @ManyToOne(() => Departamento, (departamento) => departamento.municipios, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_departamento' })
  departamento: Departamento;

  @OneToMany(() => Business, (business) => business.municipio)
  businesses: Business[];
}
