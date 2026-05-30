import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MailService } from 'src/mail/mail.service';
import { User } from 'src/shared/entities/user.entity';
import { BusinessRepository } from 'src/shared/repositories/business.repository';
import { CategoryRepository } from 'src/shared/repositories/category.repository';
import { MunicipioRepository } from 'src/shared/repositories/municipio.repository';
import { RolRepository } from 'src/shared/repositories/rol.repository';
import { TagsRepository } from 'src/shared/repositories/tags.repository';
import { UserRepository } from 'src/shared/repositories/user.repository';
import { FindOptionsWhere, ILike, In, MoreThanOrEqual, Not } from 'typeorm';
import {
  Business,
  BusinessStatus,
} from '../../shared/entities/business.entity';
import { Tag } from '../../shared/entities/tags.entity';
import { Municipio } from '../../shared/entities/municipio.entity';
import { createPaginationResponse } from '../../shared/pagination/pagination.helper';
import { CreateBusinessDto } from '../dto/create-business.dto';
import { GetBusinessesFilterDto } from '../dto/get-businesses-filter.dto';
import {
  BusinessSortOption,
  PublicBusinessFilterDto,
} from '../dto/public-business-filter.dto';
import { UpdateBusinessDto } from '../dto/update-business.dto';
import { DeleteBusinessDto } from '../dto/delete-business.dto';

@Injectable()
export class BusinessService {
  private readonly logger = new Logger(BusinessService.name);

  constructor(
    private readonly businessRepository: BusinessRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly tagRepository: TagsRepository,
    private readonly mailService: MailService,
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RolRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly municipioRepository: MunicipioRepository,
  ) {}

  private sanitizePublicBusiness(business: Business) {
    const { legal_document_url, is_legally_verified, user, ...rest } = business;
    return { ...rest, owner_id: user?.id_usuario ?? null };
  }

  //Metodos publicos
  async findAllPublic(filterDto: PublicBusinessFilterDto) {
    const {
      page = 1,
      limit = 50,
      id_category,
      id_tag,
      id_departamento,
      id_municipio,
      search,
      sortBy,
      sortDirection = 'DESC',
    } = filterDto;
    const skip = (page - 1) * limit;

    if (!sortBy || sortBy === BusinessSortOption.RELEVANT) {
      const [businesses, total] =
        await this.businessRepository.findPublicWithRelevanceScore({
          skip,
          take: limit,
          id_category,
          id_tag,
          id_departamento,
          id_municipio,
          search,
        });

      if (total === 0)
        throw new NotFoundException(
          'No hay negocios disponibles en este momento.',
        );

      return createPaginationResponse(
        businesses.map((b) => this.sanitizePublicBusiness(b)),
        total,
        page,
        limit,
      );
    }

    const whereConditions: FindOptionsWhere<Business> = {
      status: BusinessStatus.ACTIVE,
      isActive: true,
      isDeletedByOwner: false,
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

    if (id_municipio) {
      whereConditions.municipio = { id_municipio };
    } else if (id_departamento) {
      whereConditions.municipio = { departamento: { id_departamento } };
    }

    let orderClause: any = { createdAt: sortDirection };

    if (sortBy === BusinessSortOption.RATED) {
      orderClause = {
        average_rating: sortDirection,
        total_reviews: sortDirection,
      };
    } else if (sortBy === BusinessSortOption.REVIEWS) {
      orderClause = {
        total_reviews: sortDirection,
        average_rating: sortDirection,
      };
    } else if (sortBy === BusinessSortOption.RECENT) {
      orderClause = { createdAt: sortDirection };
    }
    const [businesses, total] = await this.businessRepository.findAndCount({
      where: whereConditions,
      relations: ['category', 'tags', 'certifications', 'municipio', 'municipio.departamento'],
      order: orderClause,
      skip: skip,
      take: limit,
    });

    if (total === 0) {
      throw new NotFoundException(
        'No hay negocios disponibles en este momento.',
      );
    }

    const sanitizedBusinesses = businesses.map((b) =>
      this.sanitizePublicBusiness(b),
    );
    return createPaginationResponse(sanitizedBusinesses, total, page, limit);
  }

  async findOnePublic(id: number) {
    const business = await this.businessRepository.findOne({
      where: {
        id_business: id,
        status: BusinessStatus.ACTIVE,
        isActive: true,
        isDeletedByOwner: false,
      },
      relations: ['category', 'tags', 'certifications', 'user', 'municipio', 'municipio.departamento'],
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
        isDeletedByOwner: false,
        total_reviews: MoreThanOrEqual(1),
      },
      relations: ['category', 'tags', 'certifications'],
      order: {
        average_rating: 'DESC',
        total_reviews: 'DESC',
      },
      take: 5,
    });

    if (businesses.length === 0) {
      throw new NotFoundException(
        'Aún no hay negocios calificados para mostrar.',
      );
    }

    return businesses.map((b) => this.sanitizePublicBusiness(b));
  }

  //Metodos gestion interna

  async findForManagement(user: User) {
    const roleName = user.rol.nombre;

    if (roleName === 'admin') {
      return await this.businessRepository.find({
        relations: ['category', 'tags', 'user', 'certifications', 'municipio', 'municipio.departamento'],
      });
    }

    return await this.businessRepository.find({
      where: { user: { id_usuario: user.id_usuario } },
      relations: ['category', 'tags', 'certifications', 'municipio', 'municipio.departamento'],
    });
  }

  async findAllForAdmin(filters: GetBusinessesFilterDto) {
    const {
      status,
      isActive,
      id_category,
      id_tag,
      id_departamento,
      id_municipio,
      search,
      sortBy,
      sortDirection = 'DESC',
      page = 1,
      limit = 10,
    } = filters;
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

    if (id_municipio) {
      whereCondition.municipio = { id_municipio };
    } else if (id_departamento) {
      whereCondition.municipio = { departamento: { id_departamento } };
    }

    let orderClause: any = { createdAt: sortDirection };

    if (sortBy === BusinessSortOption.RATED) {
      orderClause = {
        average_rating: sortDirection,
        total_reviews: sortDirection,
      };
    } else if (sortBy === BusinessSortOption.REVIEWS) {
      orderClause = {
        total_reviews: sortDirection,
        average_rating: sortDirection,
      };
    } else if (sortBy === BusinessSortOption.RECENT) {
      orderClause = { createdAt: sortDirection };
    }

    const [businesses, total] = await this.businessRepository.findAndCount({
      where: whereCondition,
      relations: ['user', 'category', 'tags', 'certifications', 'municipio', 'municipio.departamento'],
      order: orderClause,
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

    return createPaginationResponse(businesses, total, page, limit);
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
        where: { businessName: ILike(createBusinessDto.businessName) },
      });
      if (nameExists) {
        throw new ConflictException(
          `El nombre '${createBusinessDto.businessName}' ya está registrado por otro negocio.`,
        );
      }

      const { categoryId, tagIds, municipioId, ...businessData } = createBusinessDto;

      const category = await this.categoryRepository.findOneBy({
        id_category: categoryId,
      });
      if (!category) throw new NotFoundException('Categoría no encontrada');

      let tags: Tag[] = [];
      if (tagIds && tagIds.length > 0) {
        tags = await this.tagRepository.findBy({ id_tags: In(tagIds) });
      }

      let municipio: Municipio | null = null;
      if (municipioId) {
        municipio = await this.municipioRepository.findOneBy({
          id_municipio: municipioId,
        });
        if (!municipio) throw new NotFoundException('Municipio no encontrado');
      }

      const newBusiness = this.businessRepository.create({
        ...businessData,
        user: user,
        category,
        tags,
        municipio,
        status: BusinessStatus.PENDING,
      });

      const savedBusiness = await this.businessRepository.save(newBusiness);
      if (user.rol.nombre === 'USER') {
        const ownerRole = await this.roleRepository.findOne({
          where: { nombre: 'owner' },
        });

        if (ownerRole) {
          await this.userRepository.update(user.id_usuario, { rol: ownerRole });
        }
      }

      try {
        await this.mailService.sendBusinessWelcome(
          user.email,
          savedBusiness.businessName,
        );
      } catch (mailErr) {
        this.logger.warn(`Email de bienvenida no enviado: ${(mailErr as Error).message}`);
      }

      this.eventEmitter.emit('business.created', {
        ownerId: user.id_usuario,
        businessId: savedBusiness.id_business,
        businessName: savedBusiness.businessName,
      });

      return {
        message:
          'Negocio ' +
          savedBusiness.businessName +
          ' creado exitosamente y pendiente de revisión por un administrador',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof ConflictException
      )
        throw error;
      throw new InternalServerErrorException(
        `Error al crear negocio: ${(error as Error).message}`,
      );
    }
  }

  async update(id: number, updateBusinessDto: UpdateBusinessDto, user: User) {
    const roleName = user.rol.nombre;

    const business = await this.businessRepository.findOne({
      where: { id_business: id },
      relations: ['user', 'municipio'],
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

    const { categoryId, tagIds, municipioId, ...businessData } = updateBusinessDto as any;

    if (businessData.businessName) {
      const nameExists = await this.businessRepository.findOne({
        where: {
          businessName: ILike(businessData.businessName),
          id_business: Not(id),
        },
      });
      if (nameExists) {
        throw new ConflictException(
          `El nombre '${businessData.businessName}' ya está registrado por otro negocio.`,
        );
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

    if (municipioId !== undefined) {
      if (municipioId === null) {
        business.municipio = null;
      } else {
        const municipio = await this.municipioRepository.findOneBy({
          id_municipio: municipioId,
        });
        if (!municipio) throw new NotFoundException('Municipio no encontrado');
        business.municipio = municipio;
      }
    }

    Object.assign(business, businessData);
    await this.businessRepository.save(business);

    if (wasResubmitted && business.user?.email) {
      try {
        await this.mailService.sendBusinessResubmitted(
          business.user.email,
          business.businessName,
        );
      } catch (mailErr) {
        this.logger.warn(`Email de reenvío no enviado: ${(mailErr as Error).message}`);
      }
    }

    if (wasResubmitted && business.user?.id_usuario) {
      this.eventEmitter.emit('business.resubmitted', {
        ownerId: business.user.id_usuario,
        businessId: business.id_business,
        businessName: business.businessName,
      });
    }

    return {
      message:
        'Negocio ' +
        business.businessName +
        ' actualizado exitosamente' +
        (wasResubmitted ? ' y enviado nuevamente a revisión.' : ''),
    };
  }

  async remove(id: number, dto: DeleteBusinessDto, user: User) {
    const roleName = user.rol.nombre;
    const isAdmin = roleName === 'admin';

    const business = await this.businessRepository.findOne({
      where: { id_business: id },
      relations: ['user'],
    });

    if (!business) throw new NotFoundException('Negocio no encontrado');

    if (!isAdmin && business.user.id_usuario !== user.id_usuario) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar este negocio.',
      );
    }


    if (!business.isActive && !isAdmin) {
      throw new ForbiddenException(
        `El negocio "${business.businessName}" fue desactivado por moderación. Contacta a administración.`,
      );
    }

    if (business.isDeletedByOwner && !isAdmin) {
      throw new BadRequestException(
        `El negocio "${business.businessName}" ya fue marcado para eliminación. Puedes reactivarlo si cambiaste de opinión.`,
      );
    }

    if (!isAdmin) {
      if (!dto.password) {
        throw new BadRequestException(
          'Debes proporcionar tu contraseña para confirmar la eliminación del negocio.',
        );
      }

      const userWithPassword = await this.userRepository.findOne({
        where: { id_usuario: user.id_usuario },
      });

      if (!userWithPassword) {
        throw new NotFoundException('Usuario no encontrado.');
      }

      const passwordMatch = await bcrypt.compare(
        dto.password,
        userWithPassword.password,
      );

      if (!passwordMatch) {
        throw new UnauthorizedException(
          'Contraseña incorrecta. No se pudo confirmar la eliminación.',
        );
      }
    }

    business.isDeletedByOwner = true;
    await this.businessRepository.save(business);

    return {
      message: `El negocio "${business.businessName}" ha sido eliminado. Puedes reactivarlo cuando quieras desde tu panel.`,
    };
  }

  async requestReactivation(id: number, user: User) {
    const business = await this.businessRepository.findOne({
      where: { id_business: id },
      relations: ['user'],
    });

    if (!business) throw new NotFoundException('Negocio no encontrado');

    if (business.user.id_usuario !== user.id_usuario) {
      throw new ForbiddenException('No tienes permiso para solicitar la reactivación de este negocio.');
    }

    if (business.isActive) {
      throw new BadRequestException('El negocio ya se encuentra activo.');
    }

    this.eventEmitter.emit('business.reactivation_requested', {
      ownerId: user.id_usuario,
      businessId: business.id_business,
      businessName: business.businessName,
    });

    return {
      message: `Solicitud de reactivación enviada para "${business.businessName}". Un administrador la revisará pronto.`,
    };
  }

  async reactivateBusiness(id: number, user: User) {
    const roleName = user.rol.nombre;
    const isAdmin = roleName === 'admin';

    const business = await this.businessRepository.findOne({
      where: { id_business: id },
      relations: ['user'],
    });

    if (!business) throw new NotFoundException('Negocio no encontrado');

    if (!isAdmin && business.user.id_usuario !== user.id_usuario) {
      throw new ForbiddenException(
        'No tienes permiso para reactivar este negocio.',
      );
    }

    if (!business.isDeletedByOwner) {
      throw new BadRequestException(
        'Este negocio no se encuentra en estado de eliminación por el dueño.',
      );
    }

    if (!business.isActive && !isAdmin) {
      throw new ForbiddenException(
        `El negocio fue desactivado por moderación mientras estuvo eliminado. Contacta a administración.`,
      );
    }

    business.isDeletedByOwner = false;
    await this.businessRepository.save(business);

    return {
      message: `El negocio "${business.businessName}" ha sido reactivado exitosamente y vuelve a estar visible.`,
    };
  }

  async changeStatus(
    id: number,
    status: BusinessStatus,
    rejectionReason?: string,
  ) {
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
      business.rejectionReason =
        rejectionReason || 'No cumple con las políticas de la plataforma.';
    } else {
      business.rejectionReason = null;
    }

    const updatedBusiness = await this.businessRepository.save(business);

    if (business.user?.email) {
      try {
        await this.mailService.sendBusinessStatusChange(
          business.user.email,
          business.businessName,
          status,
          business.rejectionReason || undefined,
        );
      } catch (mailErr) {
        this.logger.warn(`Email de cambio de estado no enviado: ${(mailErr as Error).message}`);
      }
    }

    const ownerId = business.user?.id_usuario;
    if (ownerId) {
      if (status === BusinessStatus.ACTIVE) {
        this.eventEmitter.emit('business.approved', {
          ownerId,
          businessId: updatedBusiness.id_business,
          businessName: updatedBusiness.businessName,
        });
      } else if (status === BusinessStatus.REJECTED) {
        this.eventEmitter.emit('business.rejected', {
          ownerId,
          businessId: updatedBusiness.id_business,
          businessName: updatedBusiness.businessName,
          rejectionReason: updatedBusiness.rejectionReason,
        });
      }
    }

    return {
      message: `El estado del negocio ${updatedBusiness.businessName} ha sido cambiado a ${status}`,
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
      try {
        await this.mailService.sendBusinessToggle(
          business.user.email,
          business.businessName,
          isActive,
        );
      } catch (mailErr) {
        this.logger.warn(`Email de toggle no enviado: ${(mailErr as Error).message}`);
      }
    }

    return {
      message: `El negocio ${business.businessName} ha sido ${isActive ? 'activado' : 'desactivado'} correctamente`,
    };
  }
}
