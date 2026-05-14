import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { In, MoreThanOrEqual, Not} from 'typeorm';
import { Business, BusinessStatus } from '../../shared/entities/business.entity';
import { CreateBusinessDto } from '../dto/create-business.dto';
import { UpdateBusinessDto } from '../dto/update-business.dto';
import { User } from 'src/shared/entities/user.entity';
import { Tag } from '../../shared/entities/tags.entity';
import { MailService } from 'src/mail/mail.service';
import { FindOptionsWhere, ILike } from 'typeorm';
import { GetBusinessesFilterDto } from '../dto/get-businesses-filter.dto';
import { createPaginationResponse } from '../../shared/pagination/pagination.helper';
import { PaginationDto } from '../../shared/pagination/dto/pagination.dto';
import { BusinessRepository } from 'src/shared/repositories/business.repository';
import { CategoryRepository } from 'src/shared/repositories/category.repository';
import { TagsRepository } from 'src/shared/repositories/tags.repository';
import { PublicBusinessFilterDto } from '../dto/public-business-filter.dto';
import { RolRepository } from 'src/shared/repositories/rol.repository';
import { UserRepository } from 'src/shared/repositories/user.repository';


@Injectable()
export class BusinessService {
  constructor(
    private readonly businessRepository: BusinessRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly tagRepository: TagsRepository,
    private readonly mailService: MailService,
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RolRepository,
  ) {}

  private sanitizePublicBusiness(business: Business) {
    const { legal_document_url, is_legally_verified, ...rest } = business;
    return rest as Business;
  }

  //Metodos publicos
  async findAllPublic(filterDto: PublicBusinessFilterDto) {
    const { page = 1, limit = 10, id_category, id_tag, search } = filterDto;
    const skip = (page - 1) * limit;

    const whereConditions: FindOptionsWhere<Business> = {
      status: BusinessStatus.ACTIVE,
      isActive: true,
    };
    if (search) {
      whereConditions.businessName = ILike(`%${search}%`); 
    }

    if (id_category) {
      whereConditions.category = { id_category };
    }

    if (id_tag) {
      whereConditions.tags = { id_tags: id_tag };
    }

    const [businesses, total] = await this.businessRepository.findAndCount({
      where: whereConditions,
      relations: ['category', 'tags', 'certifications'],
      order: { createdAt: 'DESC' },
      skip: skip,
      take: limit,
    });

    if (total === 0) {
      throw new NotFoundException('No hay negocios disponibles en este momento.');
    }

    const sanitizedBusinesses = businesses.map(b => this.sanitizePublicBusiness(b));
    return createPaginationResponse(sanitizedBusinesses, total, page, limit);
  }

  async findOnePublic(id: number) {
    const business = await this.businessRepository.findOne({
      where: {
        id_business: id,
        status: BusinessStatus.ACTIVE,
        isActive: true,
      },
      relations: ['category', 'tags', 'certifications'],
    });

    if (!business) {
      throw new NotFoundException(
        'El negocio no existe o no está disponible públicamente',
      );
    }

    return this.sanitizePublicBusiness(business);
  }

  async getTopBusinesses() {
    const businesses = await this.businessRepository.find({
      where: {
        status: BusinessStatus.ACTIVE,
        isActive: true,
        total_reviews: MoreThanOrEqual(1),
      },
      relations: ['category', 'tags', 'certifications'],
      order: { 
        average_rating: 'DESC',
        total_reviews: 'DESC'
      },
      take: 5,
    });

    if (businesses.length === 0) {
      throw new NotFoundException('Aún no hay negocios calificados para mostrar.');
    }

    return businesses.map(b => this.sanitizePublicBusiness(b));
  }

  //Metodos gestion interna

  async findForManagement(user: any) {
    const roleName = user.rol.nombre;

    if (roleName === 'admin') {
      return await this.businessRepository.find({
        relations: ['category', 'tags', 'user', 'certifications'],
      });
    }

    return await this.businessRepository.find({
      where: { user: { id_usuario: user.id_usuario } },
      relations: ['category', 'tags', 'certifications'],
    });
  }


  async findAllForAdmin(filters: GetBusinessesFilterDto) {
    
    const { status, isActive, id_category, id_tag, search, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;
    const whereCondition: FindOptionsWhere<Business> = {};

    if (status) {
      whereCondition.status = status;
    }

    if (isActive !== undefined) {
      whereCondition.isActive = isActive === 'true';
    }

    if (search) {
      whereCondition.businessName = ILike(`%${search}%`); 
    }

    if (id_category) {
      whereCondition.category = { id_category };
    }

    if (id_tag) {
      whereCondition.tags = { id_tags: id_tag };
    }

    const [businesses, total] = await this.businessRepository.findAndCount({
      where: whereCondition,
      relations: ['user', 'category', 'tags', 'certifications'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    if (total === 0) {
      const hasFilters = status || isActive !== undefined;
      const errorMessage = hasFilters 
        ? 'No se encontraron negocios que coincidan con los filtros especificados.' 
        : 'Aún no hay negocios registrados en la plataforma.';
      throw new NotFoundException(errorMessage);
    }

    return createPaginationResponse(
      businesses, 
      total, 
      page, 
      limit
    );
  }

  
  async create(createBusinessDto: CreateBusinessDto, user: User) {
    try {

      const existingBusiness = await this.businessRepository.findOne({
        where: { user: { id_usuario: user.id_usuario } },
      });

      if (existingBusiness) {
        throw new ForbiddenException(
          'Solo puedes tener un negocio a la vez. Si tu negocio fue desactivado, no puedes crear uno nuevo.',
        );
      }
      
      const nameExists = await this.businessRepository.findOne({
        where: { businessName: ILike(createBusinessDto.businessName) }
      });
      if (nameExists) {
        throw new ConflictException(`El nombre '${createBusinessDto.businessName}' ya está registrado por otro negocio.`);
      }

      const { categoryId, tagIds, ...businessData } = createBusinessDto;

      const category = await this.categoryRepository.findOneBy({
        id_category: categoryId,
      });
      if (!category) throw new NotFoundException('Categoría no encontrada');

      let tags: Tag[] = [];
      if (tagIds && tagIds.length > 0) {
        tags = await this.tagRepository.findBy({ id_tags: In(tagIds) });
      }

      const newBusiness = this.businessRepository.create({
        ...businessData,
        user: user,
        category,
        tags,
        status: BusinessStatus.PENDING,
      }
    );
      
      const savedBusiness = await this.businessRepository.save(newBusiness);
      if (user.rol.nombre === 'USER') {
        const ownerRole = await this.roleRepository.findOne({ where: { nombre: 'owner' } });
        
        if (ownerRole) {
           await this.userRepository.update(user.id_usuario, { rol: ownerRole });
        }
      }
      await this.mailService.sendBusinessWelcome(user.email, savedBusiness.businessName);
      return { message: 'Negocio ' + savedBusiness.businessName + ' creado exitosamente y pendiente de revisión por un administrador' };

    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof ConflictException) throw error;
      throw new InternalServerErrorException(
        `Error al crear negocio: ${error.message}`,
      );
    }
  }

  async update(id: number, updateBusinessDto: UpdateBusinessDto, user: any) {
    const roleName = user.rol.nombre;

    const business = await this.businessRepository.findOne({
      where: { id_business: id },
      relations: ['user'],
    });

    if (!business) throw new NotFoundException('Negocio no encontrado');

    if (!business.isActive && roleName !== 'admin') {
      throw new ForbiddenException(
        `Tu negocio ${business.businessName} fue desactivado por incumplimientos, contacta a administración si crees que fue un error`,
      );
    }
    
    if (roleName !== 'admin' && business.user.id_usuario !== user.id_usuario) {
      throw new ForbiddenException(
        'No tienes permiso para editar este negocio.',
      );
    }

    const { categoryId, tagIds, ...businessData } = updateBusinessDto as any;

    if (businessData.businessName) {
      const nameExists = await this.businessRepository.findOne({
        where: { 
          businessName: ILike(businessData.businessName),
          id_business: Not(id)
        }
      });
      if (nameExists) {
        throw new ConflictException(`El nombre '${businessData.businessName}' ya está registrado por otro negocio.`);
      }
    }

    let wasResubmitted = false;

    if (roleName !== 'admin' && business.status === BusinessStatus.REJECTED) {
      business.status = BusinessStatus.PENDING;
      business.rejectionReason = null; 
      wasResubmitted = true;
    }

    if (categoryId) {
      const category = await this.categoryRepository.findOneBy({
        id_category: categoryId,
      });
      if (!category) throw new NotFoundException('Categoría no encontrada');
    }

    if (tagIds) {
      const tags = await this.tagRepository.findBy({ id_tags: In(tagIds) });
      if (tags.length !== tagIds.length) {
        throw new NotFoundException('Uno o más tags no encontrados');
      }
    }

    Object.assign(business, businessData);
    await this.businessRepository.save(business);

    if (wasResubmitted && business.user?.email) {
      await this.mailService.sendBusinessResubmitted(business.user.email, business.businessName);
    }

    return { 
      message: 'Negocio ' + business.businessName + ' actualizado exitosamente' + 
      (wasResubmitted ? ' y enviado nuevamente a revisión.' : '') 
    };

  }

  async remove(id: number, user: any) {
    const roleName = user.rol.nombre;

    const business = await this.businessRepository.findOne({
      where: { id_business: id },
      relations: ['user'],
    });

    if (!business) throw new NotFoundException('Negocio no encontrado');

    if (!business.isActive && roleName !== 'admin') {
      throw new ForbiddenException(
        `Tu negocio ${business.businessName} fue desactivado por incumplimientos, contacta a administración si crees que fue un error`,
      );
    }

    if (roleName !== 'admin' && business.user.id_usuario !== user.id_usuario) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar este negocio',
      );
    }

    await this.businessRepository.remove(business);
    return { message: `El negocio con ID ${id} fue eliminado permanentemente` };
  }

  async changeStatus(id: number, status: BusinessStatus, rejectionReason?: string) {
    const business = await this.businessRepository.findOne({
      where: { id_business: id },
      relations: ['user'],
    });
    if (!business) throw new NotFoundException('Negocio no encontrado');

    if (!Object.values(BusinessStatus).includes(status)) {
      throw new BadRequestException('Estado inválido para el negocio');
    }
    business.status = status;

    if (status === BusinessStatus.REJECTED) {
      business.rejectionReason = rejectionReason || 'No cumple con las políticas de la plataforma.';
    } else {
      business.rejectionReason = null;
    }

    const updatedBusiness = await this.businessRepository.save(business);

    if (business.user?.email) {
      await this.mailService.sendBusinessStatusChange(
        business.user.email, 
        business.businessName,
        status,
        business.rejectionReason || undefined,
      );
    }
    return {
      message: `El estado del negocio ${updatedBusiness.businessName} ha sido cambiado a ${status}`
    };
  }


  async toggleActive(id: number, isActive: boolean) {
    if (typeof isActive !== 'boolean') {
      throw new BadRequestException(
        'El campo isActive debe ser un valor booleano',
      );
    }

    const business = await this.businessRepository.findOne({
      where: { id_business: id },
      relations: ['user'],
    });

    if (!business) throw new NotFoundException('Negocio no encontrado');

    if (business.status === BusinessStatus.PENDING && isActive === false) {
      throw new BadRequestException(
        'No se puede desactivar un negocio que se encuentra en estado Pendiente.',
      );
    }

    business.isActive = isActive;
    await this.businessRepository.save(business);

    if (business.user?.email) {
      await this.mailService.sendBusinessToggle(business.user.email, business.businessName, isActive);
    }

    return {
      message: `El negocio ${business.businessName} ha sido ${isActive ? 'activado' : 'desactivado'} correctamente`
    };
  }
}
