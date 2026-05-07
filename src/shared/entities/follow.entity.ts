import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique
} from 'typeorm';
import { User } from './user.entity';
import { Business } from './business.entity';

@Entity('follow')
@Unique(['follower', 'followedBusiness'])
export class Follow {
  @PrimaryGeneratedColumn()
  id_follow!: number;

  @ManyToOne(() => User, (user) => user.following, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'followerId' })
  follower!: User;

  @ManyToOne(() => Business, (business) => business.followers, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'followedBusinessId' })
  followedBusiness!: Business;

  @CreateDateColumn({type: 'timestamptz'})
  createdAt!: Date;
}