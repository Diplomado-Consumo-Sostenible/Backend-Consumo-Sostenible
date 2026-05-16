import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, Unique } from 'typeorm';
import { User } from './user.entity';
import { Business } from './business.entity';

@Entity('review_blocks')
@Unique(['user', 'business'])
export class ReviewBlock {
  @PrimaryGeneratedColumn()
  id_block: number;

  @CreateDateColumn({ type: 'timestamptz' })
  blocked_at: Date;

  @ManyToOne(() => User, (user) => user.reviewBlocks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_usuario' })
  user: User;

  @ManyToOne(() => Business, (business) => business.reviewBlocks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_business' })
  business: Business;
}