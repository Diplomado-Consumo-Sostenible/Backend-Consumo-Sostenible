import { Perfil } from 'src/users/perfil/entity/perfil.entity';
import { Rol } from 'src/users/rol/entity/rol.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  id_usuario: number;

  @Column({ length: 100 })
  @Unique(['email'])
  email: string;

  @Column({ length: 255 })
  password: string;

  @Column({ type: 'varchar', nullable: true })
  passwordResetOTP: string | null;

  @Column({ type: 'timestamp', nullable: true })
  passwordResetExpires: Date | null;

  @Column({ default: 0 })
  passwordResetAttempts: number;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Rol, (rol) => rol.users)
  @JoinColumn({ name: 'rolId' })
  rol: Rol;

  @OneToOne(() => Perfil, (perfil) => perfil.user)
  perfil: Perfil;
}
