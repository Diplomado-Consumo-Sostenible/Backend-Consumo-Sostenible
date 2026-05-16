import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Review } from './review.entity';

export enum ReportReason {
  OFFENSIVE = 'Lenguaje ofensivo o inapropiado',
  SPAM = 'Spam o publicidad',
  FAKE = 'Reseña falsa o no es cliente',
  OTHER = 'Otro',
}

export enum ReportStatus {
  PENDING = 'Pendiente',
  RESOLVED = 'Resuelto',
  DISMISSED = 'Descartado', 
}

@Entity('review_reports')
@Unique(['user', 'review'])
export class ReviewReport {
  @PrimaryGeneratedColumn()
  id_report: number;

  @Column({
    type: 'enum',
    enum: ReportReason,
  })
  reason: ReportReason;

  @Column({ type: 'text', nullable: true })
  details: string;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING,
  })
  status: ReportStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;


  @ManyToOne(() => User, (user) => user.reviewReports, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_usuario' })
  user: User;


  @ManyToOne(() => Review, (review) => review.reports, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_review' })
  review: Review;
}