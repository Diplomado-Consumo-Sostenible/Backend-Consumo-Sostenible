import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Tag } from './tags.entity';
import { Category } from './category.entity';

export enum BusinessStatus {
  ACTIVE = 'Active',
  PENDING = 'Pending',
  REJECTED = 'Rejected',
}

@Entity('business')
export class Business {
  @PrimaryGeneratedColumn()
  id_business: number;

  @Column()
  businessName: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ nullable: true })
  logo: string;

  @Column('simple-array', { nullable: true })
  images: string[];

  @Column()
  address: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  emailBusiness: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  instagramUrl: string;

  @Column({ nullable: true })
  facebookUrl: string;

  @Column({ nullable: true })
  xUrl: string;

  @Column('json', { nullable: true })
  schedule: Record<string, string>;

  @Column({
    type: 'enum',
    enum: BusinessStatus,
    default: BusinessStatus.PENDING,
  })
  status: BusinessStatus;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.business)
  user: User;

  @ManyToOne(() => Category, (category) => category.businesses)
  category: Category;

  @ManyToMany(() => Tag, (tag) => tag.business)
  @JoinTable()
  tags: Tag[];
}
