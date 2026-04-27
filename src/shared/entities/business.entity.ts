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
} from 'typeorm';
import { User } from './user.entity';
import { Category } from './category.entity';
import { Tag } from './tags.entity';
import { Product } from './product.entity';

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


  @ManyToOne(() => User, (user) => user.business)
  user: User;

  @ManyToOne(() => Category, (category) => category.businesses)
  category: Category;

  @ManyToMany(() => Tag, (tag) => tag.business)
  @JoinTable()
  tags: Tag[];

  @OneToMany(() => Product, (product) => product.business)
  products: Product[];
}
