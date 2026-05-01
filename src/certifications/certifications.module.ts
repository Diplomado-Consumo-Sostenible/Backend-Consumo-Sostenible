import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificationsController } from './controllers/certifications.controller';
import { CertificationsService } from './services/certifications.service';
import { Certification } from 'src/shared/entities/certifications.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Certification])],
  controllers: [CertificationsController],
  providers: [CertificationsService],
})
export class CertificationsModule {}
