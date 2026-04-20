import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Business, BusinessStatus } from './entity/business.entity';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { User } from 'src/users/user/entity/user.entity';
import { Category } from '../category/entity/category.entity';
import { Tag } from '../tags/entity/tags.entity';

@Injectable()
export class BusinessService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  //Metodos publicos
  async findAllPublic() {
    if ((await this.businessRepository.count()) === 0) {
      throw new NotFoundException('No hay negocios disponibles');
    }
    return await this.businessRepository.find({
      where: {
        status: BusinessStatus.ACTIVE,
        isActive: true,
      },
      relations: ['category', 'tags'],
    });
  }

  async findOnePublic(id: number) {
    const business = await this.businessRepository.findOne({
      where: {
        id_business: id,
        status: BusinessStatus.ACTIVE,
        isActive: true,
      },
      relations: ['category', 'tags'],
    });

    if (!business) {
      throw new NotFoundException(
        'El negocio no existe o no está disponible públicamente',
      );
    }

    return business;
  }

  //Metodos gestion interna

  async findForManagement(user: any) {
    const roleName = user.rol.nombre;

    if (roleName === 'admin') {
      return await this.businessRepository.find({
        relations: ['category', 'tags', 'user'],
      });
    }

    return await this.businessRepository.find({
      where: { user: { id_usuario: user.id_usuario } },
      relations: ['category', 'tags'],
    });
  }

  async create(createBusinessDto: CreateBusinessDto, user: User) {
    try {
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
        user,
        category,
        tags,
        status: BusinessStatus.PENDING,
      });

      return await this.businessRepository.save(newBusiness);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
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
    
    if (roleName !== 'admin' && business.user.id_usuario !== user.id_usuario) {
      throw new ForbiddenException(
        'No tienes permiso para editar este negocio. Solo el propietario o un administrador pueden hacerlo.',
      );
    }

    // Si un owner edita su negocio, lo pasamos a estado pendiente para que el admin lo vuelva a revisar
    //if (roleName === 'owner') {
      //business.status = BusinessStatus.PENDING;
    //}
    //verificar si se esta actualizando la categoria o los tags, si es asi, validar que existan
    const { categoryId, tagIds, ...businessData } = updateBusinessDto as any;

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
    return await this.businessRepository.save(business);

  }

  async remove(id: number, user: any) {
    const roleName = user.rol.nombre;

    const business = await this.businessRepository.findOne({
      where: { id_business: id },
      relations: ['user'],
    });

    if (!business) throw new NotFoundException('Negocio no encontrado');

    if (roleName !== 'admin' && business.user.id_usuario !== user.id_usuario) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar este negocio',
      );
    }

    await this.businessRepository.remove(business);
    return { message: `El negocio con ID ${id} fue eliminado permanentemente` };
  }

  
}
