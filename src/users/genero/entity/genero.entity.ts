import { Perfil } from 'src/users/perfil/entity/perfil.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';


@Entity('genero')
export class Genero {
  @PrimaryGeneratedColumn()
  id_genero: number;

  @Column({ length: 50, unique: true })
  nombre: string;

  @OneToMany(() => Perfil, (perfil) => perfil.genero, { onDelete: 'CASCADE' })
  perfiles: Perfil[];
} 
