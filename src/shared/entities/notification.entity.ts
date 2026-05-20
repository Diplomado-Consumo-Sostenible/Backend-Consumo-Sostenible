import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Business } from './business.entity';

export enum NotificationAlertType {
  CRITICAL_RATING       = 'critical_rating',
  ACCUMULATED_NEGATIVES = 'accumulated_negatives',
  SUSPICIOUS_REVIEW     = 'suspicious_review',
  NEGATIVE_REVIEW       = 'negative_review',
  WEEKLY_SUMMARY        = 'weekly_summary',
}

@Entity('notification')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  /** FK expuesta como columna para filtrar sin JOIN */
  @Column({ name: 'ownerId' })
  ownerId: number;

  @ManyToOne(() => User, (user) => user.notifications, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column({ name: 'businessId', nullable: true })
  businessId: number | null;

  @ManyToOne(() => Business, (business) => business.notifications, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'businessId' })
  business: Business | null;

  @Column({ type: 'varchar', length: 50 })
  alertType: NotificationAlertType;

  @Column({ default: false })
  isRead: boolean;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
