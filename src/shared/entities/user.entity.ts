import { Business } from './business.entity';
import { Perfil } from './perfil.entity';
import { Rol } from './rol.entity';
import { Follow } from './follow.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Review } from './review.entity';
import { ReviewReport } from './review-report.entity';
import { ReviewBlock } from './review-block.entity';
import { Notification } from './notification.entity';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  id_usuario: number;

  @Column({ length: 100, unique: true })
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

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => Rol, (rol) => rol.users)
  @JoinColumn({ name: 'rolId' })
  rol: Rol;

  @OneToOne(() => Perfil, (perfil) => perfil.user)
  perfil: Perfil;

  @OneToMany(() => Business, (business) => business.user)
  business: Business[];

  @OneToMany(() => Follow, (follow) => follow.follower)
  following: Follow[];

  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  @OneToMany(() => ReviewReport, (report) => report.user)
  reviewReports: ReviewReport[];

  @OneToMany(() => ReviewBlock, (block) => block.user)
  reviewBlocks: ReviewBlock[];

  @OneToMany(() => Notification, (notification) => notification.owner)
  notifications: Notification[];
}
