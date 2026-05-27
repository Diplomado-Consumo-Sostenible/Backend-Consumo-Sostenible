import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Municipio } from './municipio.entity';

@Entity('departamento')
export class Departamento {
  @PrimaryGeneratedColumn()
  id_departamento: number;

  @Column({ unique: true })
  nombre: string;

  @OneToMany(() => Municipio, (municipio) => municipio.departamento)
  municipios: Municipio[];
}
