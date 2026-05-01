import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Business } from './business.entity';


export enum CertificationStatus {
  ACTIVE = 'Active',
  PENDING = 'Pending',
  REJECTED = 'Rejected',
}

@Entity('certifications')
export class Certification {
  @PrimaryGeneratedColumn()
  id_certification: number;

  @Column()
  name: string;

  @Column()
  issuing_entity: string;

  @Column()
  verification_url: string;
  
  @Column()
  badge_url: string;

  @Column({ type: 'enum',
      enum: CertificationStatus,
      default: CertificationStatus.PENDING, 
    })
  status: CertificationStatus;

  @ManyToOne(() => Business, (business) => business.certifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_business' })
  business: Business;
}
