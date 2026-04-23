import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Business } from './business.entity';

@Entity('tag')
export class Tag {
  @PrimaryGeneratedColumn()
  id_tags: number;

  @Column()
  tag: string;

  @ManyToMany(() => Business, (business) => business.tags)
  business: Business[];
}
