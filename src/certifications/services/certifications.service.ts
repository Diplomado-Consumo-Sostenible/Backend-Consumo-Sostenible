import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Certification, CertificationStatus } from 'src/shared/entities/certifications.entity';
import { CreateCertificationDto } from '../dto/create-certification.dto';
import { CertificationRepository } from 'src/shared/repositories/certifications.repository';
import { BusinessRepository } from 'src/shared/repositories/business.repository';
import { createPaginationResponse } from 'src/shared/pagination/pagination.helper';
import { GetCertificationsFilterDto } from '../dto/get-certifications-filter.dto';
import { FindOptionsWhere } from 'typeorm';
import { PaginationDto } from 'src/shared/pagination/dto/pagination.dto';


@Injectable()
export class CertificationsService {
  constructor(
    private readonly certificationRepository: CertificationRepository,
    private readonly businessRepository: BusinessRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}


  async findActiveByBusiness(businessId: number, paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [certifications, total] = await this.certificationRepository.findAndCount({
      where: {
        business: { id_business: businessId },
        status: CertificationStatus.ACTIVE,
      },
      order: { id_certification: 'DESC' },
      skip,
      take: limit,
    });

    if (total === 0) {
      throw new NotFoundException('Este negocio no tiene certificaciones activas.');
    }

    return createPaginationResponse(
      certifications,
      total,
      page,
      limit
    );
  }


  async create(createCertificationDto: CreateCertificationDto, user: any) {
    const business = await this.businessRepository.findOne({
      where: { user: { id_usuario: user.id_usuario } },
    });

    if (!business) {
      throw new NotFoundException('No tienes un negocio registrado para asociar esta certificación.');
    }

    const newCertification = this.certificationRepository.create({
      ...createCertificationDto,
      verification_url: createCertificationDto.verification_url ?? '',
      business,
      status: CertificationStatus.PENDING,
    });

    await this.certificationRepository.save(newCertification);

    return { 
      message: 'Certificación enviada exitosamente. Está pendiente de revisión por administración.' 
    };
  }

  async findMyCertifications(user: any, paginationDto: PaginationDto) {
    const { page = 1, limit = 9 } = paginationDto;
    const skip = (page - 1) * limit;

    const business = await this.businessRepository.findOne({
      where: { user: { id_usuario: user.id_usuario } },
    });

    if (!business) throw new NotFoundException('No tienes un negocio registrado.');

    const businessId = business.id_business;

    const [[certs, total], totalPending, totalApproved] = await Promise.all([
      this.certificationRepository.findAndCount({
        where: { business: { id_business: businessId } },
        order: { id_certification: 'DESC' },
        skip,
        take: limit,
      }),
      this.certificationRepository.count({
        where: { business: { id_business: businessId }, status: CertificationStatus.PENDING },
      }),
      this.certificationRepository.count({
        where: { business: { id_business: businessId }, status: CertificationStatus.ACTIVE },
      }),
    ]);

    const base = createPaginationResponse(certs, total, page, limit);
    return { ...base, meta: { ...base.meta, totalPending, totalApproved } };
  }

  async update(id: number, dto: CreateCertificationDto, user: any) {
    const certification = await this.certificationRepository.findOne({
      where: { id_certification: id },
      relations: ['business', 'business.user'],
    });

    if (!certification) throw new NotFoundException('Certificación no encontrada.');

    if (certification.business.user.id_usuario !== user.id_usuario) {
      throw new ForbiddenException('No tienes permiso para editar esta certificación.');
    }

    if (certification.status !== CertificationStatus.REJECTED) {
      throw new BadRequestException('Solo puedes editar certificaciones que hayan sido rechazadas.');
    }

    certification.name             = dto.name;
    certification.issuing_entity   = dto.issuing_entity;
    certification.verification_url = dto.verification_url ?? '';
    certification.badge_url        = dto.badge_url;
    certification.status           = CertificationStatus.PENDING;

    await this.certificationRepository.save(certification);
    return { message: 'Certificación actualizada y enviada a revisión nuevamente.' };
  }

  async remove(id: number, user: any) {
    const roleName = user.rol.nombre;

    const certification = await this.certificationRepository.findOne({
      where: { id_certification: id },
      relations: ['business', 'business.user'],
    });

    if (!certification) throw new NotFoundException('Certificación no encontrada');

    if (roleName !== 'admin' && certification.business.user.id_usuario !== user.id_usuario) {
      throw new ForbiddenException('No tienes permiso para eliminar esta certificación');
    }

    await this.certificationRepository.remove(certification);
    return { message: 'Certificación eliminada correctamente' };
  }


  async findAllForAdmin(filters: GetCertificationsFilterDto) {
    const { status, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const whereCondition: FindOptionsWhere<Certification> = {};
    if (status) whereCondition.status = status;

    const [[certifications, total], totalGlobal, totalPending, totalApproved] = await Promise.all([
      this.certificationRepository.findAndCount({
        where: whereCondition,
        relations: ['business', 'business.user'],
        order: { id_certification: 'DESC' },
        skip,
        take: limit,
      }),
      this.certificationRepository.count(),
      this.certificationRepository.count({ where: { status: CertificationStatus.PENDING } }),
      this.certificationRepository.count({ where: { status: CertificationStatus.ACTIVE } }),
    ]);

    const base = createPaginationResponse(certifications, total, page, limit);
    return { ...base, meta: { ...base.meta, totalGlobal, totalPending, totalApproved } };
  }

  async changeStatus(id: number, status: CertificationStatus) {
    const certification = await this.certificationRepository.findOne({
      where: { id_certification: id },
      relations: ['business', 'business.user'],
    });

    if (!certification) throw new NotFoundException('Certificación no encontrada');

    if (!Object.values(CertificationStatus).includes(status)) {
      throw new BadRequestException('Estado inválido para la certificación');
    }

    certification.status = status;
    await this.certificationRepository.save(certification);

    const ownerId    = certification.business.user.id_usuario;
    const businessId = certification.business.id_business;

    if (status === CertificationStatus.ACTIVE) {
      this.eventEmitter.emit('certification.approved', {
        ownerId,
        businessId,
        businessName:      certification.business.businessName,
        certificationName: certification.name,
        issuingEntity:     certification.issuing_entity,
      });
    } else if (status === CertificationStatus.REJECTED) {
      this.eventEmitter.emit('certification.rejected', {
        ownerId,
        businessId,
        businessName:      certification.business.businessName,
        certificationName: certification.name,
        issuingEntity:     certification.issuing_entity,
      });
    }

    return {
      message: `El estado de la certificación ha sido cambiado a ${status}`,
    };
  }
}