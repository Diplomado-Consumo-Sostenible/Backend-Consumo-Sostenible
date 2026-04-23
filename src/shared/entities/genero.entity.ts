import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Perfil } from './perfil.entity';

@Entity('genero')
export class Genero {
  @PrimaryGeneratedColumn()
  id_genero: number;

  @Column({ length: 50, unique: true })
  nombre: string;

  @OneToMany(() => Perfil, (perfil) => perfil.genero, { onDelete: 'CASCADE' })
  perfiles: Perfil[];
}
