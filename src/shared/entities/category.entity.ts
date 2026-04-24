import { Business } from './business.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('category')
export class Category {
  @PrimaryGeneratedColumn()
  id_category: number;

  @Column()
  category: string;

  @OneToMany(() => Business, (business) => business.category)
  businesses: Business[];
}
