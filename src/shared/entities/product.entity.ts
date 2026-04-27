import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Business } from './business.entity';

@Entity('product')
export class Product {
  @PrimaryGeneratedColumn()
  id_product: number;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ nullable: true })
  image: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Business, (business) => business.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_business' })
  business: Business;
}