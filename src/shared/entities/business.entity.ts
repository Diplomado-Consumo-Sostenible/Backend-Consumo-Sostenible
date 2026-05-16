import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Category } from './category.entity';
import { Tag } from './tags.entity';
import { Product } from './product.entity';
import { Certification } from './certifications.entity';
import { Follow } from './follow.entity';
import { Review } from './review.entity';
import { ReviewBlock } from './review-block.entity';

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

  // --- CONTACTO Y UBICACIÓN ---
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

  // --- REDES SOCIALES Y WEB ---
  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  instagramUrl: string;

  @Column({ nullable: true })
  facebookUrl: string;

  @Column({ nullable: true })
  xUrl: string;

  // --- HORARIOS ---
  @Column('json', { nullable: true })
  schedule: Record<string, string>;

  // --- VERIFICACIÓN LEGAL ---
  @Column({ nullable: true })
  legal_document_url: string;

 
  @Column({ default: false })
  is_legally_verified: boolean;

  // --- ESTADOS Y CONTROL ---
  @Column({
    type: 'enum',
    enum: BusinessStatus,
    default: BusinessStatus.PENDING,
  })
  status: BusinessStatus;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 0 })
  followers_count: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  average_rating: number;

  @Column({ default: 0 })
  total_reviews: number;

  @Column({ type: 'text', nullable: true })
  ai_reviews_summary: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  ai_summary_updated_at: Date | null;

  @ManyToOne(() => User, (user) => user.business)
  @JoinColumn({ name: 'id_usuario' })
  user: User;

  @OneToMany(() => Follow, (follow) => follow.followedBusiness)
  followers: Follow[];

  @ManyToOne(() => Category, (category) => category.businesses)
  @JoinColumn({ name: 'id_category' })
  category: Category;

  @ManyToMany(() => Tag, (tag) => tag.business)
  @JoinTable()
  tags: Tag[];

  @OneToMany(() => Product, (product) => product.business)
  products: Product[];

  @OneToMany(() => Certification, (certification) => certification.business)
  certifications: Certification[];

  @OneToMany(() => Review, (review) => review.business)
  reviews: Review[];

  @OneToMany(() => ReviewBlock, (reviewBlock) => reviewBlock.business)
  reviewBlocks: ReviewBlock[];

}
