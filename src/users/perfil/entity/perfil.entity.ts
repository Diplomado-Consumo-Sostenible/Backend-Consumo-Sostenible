import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { User } from 'src/users/user/entity/user.entity';
import { Genero } from 'src/users/genero/entity/genero.entity';

@Entity('perfil')
export class Perfil {
  @PrimaryGeneratedColumn()
  id_perfil: number;

  @Column({ length: 150, nullable: true })
  nombre: string;

  @Column({ length: 255, nullable: true })
  foto_perfil: string;

  @Column({ length: 20, nullable: true })
  telefono: string;

  @OneToOne(() => User, (user) => user.perfil, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_usuario' })
  user: User;

  @ManyToOne(() => Genero, (genero) => genero.perfiles, { nullable: true })
  @JoinColumn({ name: 'id_genero' })
  genero: Genero;
}
