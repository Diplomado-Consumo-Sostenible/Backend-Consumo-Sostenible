import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Certification, CertificationStatus } from 'src/shared/entities/certifications.entity';
import { CreateCertificationDto } from '../dto/create-certification.dto';
import { CertificationRepository } from 'src/shared/repositories/certifications.repository';
import { BusinessRepository } from 'src/shared/repositories/business.repository';
import { createPaginationResponse } from 'src/common/pagination.helper';
import { GetCertificationsFilterDto } from '../dto/get-certifications-filter.dto';
import { FindOptionsWhere } from 'typeorm';
import { PaginationDto } from 'src/common/dto/pagination.dto';


@Injectable()
export class CertificationsService {
  constructor(
    private readonly certificationRepository: CertificationRepository,
    private readonly businessRepository: BusinessRepository,
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
      business,
      status: CertificationStatus.PENDING,
    });

    await this.certificationRepository.save(newCertification);

    return { 
      message: 'Certificación enviada exitosamente. Está pendiente de revisión por administración.' 
    };
  }

  async findMyCertifications(user: any) {
    const business = await this.businessRepository.findOne({
      where: { user: { id_usuario: user.id_usuario } },
    });

    if (!business) {
      throw new NotFoundException('No tienes un negocio registrado.');
    }

    return await this.certificationRepository.find({
      where: { business: { id_business: business.id_business } },
    });
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

    if (status) {
      whereCondition.status = status;
    }

    const [certifications, total] = await this.certificationRepository.findAndCount({
      where: whereCondition,
      relations: ['business', 'business.user'],
      order: { id_certification: 'DESC' },
      skip,
      take: limit,
    });

    if (total === 0) {
      const errorMessage = status 
        ? `No se encontraron certificaciones con el estado especificado (${status}).` 
        : 'Aún no hay certificaciones registradas en la plataforma.';
      throw new NotFoundException(errorMessage);
    }


    return createPaginationResponse(
      certifications, 
      total, 
      page, 
      limit
    );
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

    //integrar this.mailService para notificar al Owner
    
    return {
      message: `El estado de la certificación ha sido cambiado a ${status}`,
    };
  }
}