import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Genero } from './genero.entity';

@Entity('perfil')
export class Perfil {
  @PrimaryGeneratedColumn()
  id_perfil: number;

  @Column({ length: 150, nullable: true })
  nombre: string;

  @Column({ length: 255, nullable: true })
  foto_perfil: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;


  @OneToOne(() => User, (user) => user.perfil, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_usuario' })
  user: User;

  @ManyToOne(() => Genero, (genero) => genero.perfiles, { nullable: true })
  @JoinColumn({ name: 'id_genero' })
  genero: Genero;
}
