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
  CRITICAL_RATING = 'critical_rating',
  ACCUMULATED_NEGATIVES = 'accumulated_negatives',
  SUSPICIOUS_REVIEW = 'suspicious_review',
  NEGATIVE_REVIEW = 'negative_review',
  WEEKLY_SUMMARY = 'weekly_summary',
  NEW_PRODUCT = 'new_product',
  REVIEW_HIDDEN = 'review_hidden',
  REVIEW_DELETED = 'review_deleted',
  REVIEW_RESTORED = 'review_restored',
  BUSINESS_CREATED = 'business_created',
  BUSINESS_APPROVED = 'business_approved',
  BUSINESS_REJECTED = 'business_rejected',
  BUSINESS_RESUBMITTED = 'business_resubmitted',
  CERTIFICATION_APPROVED = 'certification_approved',
  CERTIFICATION_REJECTED = 'certification_rejected',
}

@Entity('notification')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

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
