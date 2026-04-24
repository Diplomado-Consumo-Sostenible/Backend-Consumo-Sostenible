import { Business } from './business.entity';
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tag')
export class Tag {
  @PrimaryGeneratedColumn()
  id_tags: number;

  @Column()
  tag: string;

  @ManyToMany(() => Business, (business) => business.tags)
  business: Business[];
}
