import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Business } from './business.entity';
import { User } from './user.entity';
import { ReviewReport } from './review-report.entity';

export enum ReviewSentiment {
  POSITIVE = 'Positive',
  NEUTRAL = 'Neutral',
  NEGATIVE = 'Negative',
}

@Entity('review')
@Unique(['user', 'business'])
export class Review {
  @PrimaryGeneratedColumn()
  id_review: number;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text' })
  comment: string;

  @Column({
    type: 'enum',
    enum: ReviewSentiment,
    default: ReviewSentiment.NEUTRAL,
  })
  sentiment: ReviewSentiment;

  @Column({ default: false })
  is_suspicious: boolean;

  @Column({ default: 0 })
  report_count: number;

  @Column({ default: false })
  is_hidden_by_moderation: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => User, (user) => user.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_usuario' })
  user: User;

  @ManyToOne(() => Business, (business) => business.reviews, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_business' })
  business: Business;

  @OneToMany(() => ReviewReport, (report) => report.review)
  reports: ReviewReport[];
}
