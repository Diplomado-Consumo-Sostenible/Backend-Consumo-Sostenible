import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUsuarioDto } from '../dto/create-usuario.dto';
import bcrypt from 'bcryptjs';
import { UpdateUsuarioDto } from '../dto/Update-usuario.dto';
import { UserRepository } from 'src/shared/repositories/user.repository';
import { PerfilRepository } from 'src/shared/repositories/perfil.repository';
import { RolRepository } from 'src/shared/repositories/rol.repository';
import { GeneroRepository } from 'src/shared/repositories/genero.repository';
import { BusinessRepository } from 'src/shared/repositories/business.repository';
import { ChangePasswordDto } from 'src/perfil/dto/change-password.dto';
import { ChangeEmailDto } from 'src/perfil/dto/change-email.dto';
import { ReviewRepository } from 'src/shared/repositories/review.repository';
import { GetUsersFilterDto, UserSortBy } from '../dto/get-users-filter.dto';
import { createPaginationResponse } from 'src/shared/pagination/pagination.helper';

@Injectable()
export class UserService {
  constructor(
    private readonly usuarioRepository: UserRepository,
    private readonly perfilRepository: PerfilRepository,
    private readonly rolRepository: RolRepository,
    private readonly generoRepository: GeneroRepository,
    private readonly businessRepository: BusinessRepository,
    private readonly reviewRepository: ReviewRepository,
  ) {}

  private async recalculateBusinessRating(businessId: number) {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .innerJoin('review.user', 'user')
      .select('AVG(review.rating)', 'avg')
      .addSelect('COUNT(review.id_review)', 'count')
      .where('review.businessId = :businessId', { businessId })
      .andWhere('user.isActive = true')
      .getRawOne();

    const newAvg = result.avg ? parseFloat(result.avg) : 0;
    const newCount = result.count ? parseInt(result.count, 10) : 0;

    await this.businessRepository.update(businessId, {
      average_rating: Number(newAvg.toFixed(2)),
      total_reviews: newCount,
    });
  }

  async findAll(filterDto: GetUsersFilterDto = {}) {
    const {
      page = 1,
      limit = 15,
      rol,
      sortBy = UserSortBy.CREATED_AT,
      order = 'DESC',
    } = filterDto;

    const skip = (page - 1) * limit;

    const qb = this.usuarioRepository
      .createQueryBuilder('user')
      .select([
        'user.id_usuario',
        'user.email',
        'user.isActive',
        'user.createdAt',
      ])
      .innerJoin('user.rol', 'rol')
      .addSelect(['rol.id', 'rol.nombre'])
      .leftJoin('user.perfil', 'perfil')
      .addSelect(['perfil.nombre', 'perfil.foto_perfil'])
      .leftJoin('perfil.genero', 'genero')
      .addSelect(['genero.id_genero', 'genero.nombre']);

    if (rol) {
      qb.where('rol.nombre = :rol', { rol });
    }

    const sortField =
      sortBy === UserSortBy.EMAIL ? 'user.email' : 'user.createdAt';
    qb.orderBy(sortField, order);
    qb.skip(skip).take(limit);

    const roleWhere = rol ? { rol: { nombre: rol } } : {};

    const [[data, total], totalActive, totalInactive] = await Promise.all([
      qb.getManyAndCount(),
      this.usuarioRepository.count({ where: { isActive: true, ...roleWhere } }),
      this.usuarioRepository.count({
        where: { isActive: false, ...roleWhere },
      }),
    ]);

    const base = createPaginationResponse(data, total, page, limit);
    return {
      ...base,
      meta: { ...base.meta, totalActive, totalInactive },
    };
  }

  async findOne(id: number) {
    const usuario = await this.usuarioRepository.findOne({
      where: { id_usuario: id },
      relations: ['rol', 'perfil', 'perfil.genero'],
      select: {
        id_usuario: true,
        email: true,
        rol: { id: true, nombre: true },
        perfil: {
          nombre: true,
          foto_perfil: true,
          genero: {
            id_genero: true,
            nombre: true,
          },
        },
      },
    });

    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return usuario;
  }

  async toggleStatus(id: number, isActive: boolean) {
    const usuario = await this.usuarioRepository.findOne({
      where: { id_usuario: id },
      relations: ['perfil'],
    });

    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    usuario.isActive = isActive;
    await this.usuarioRepository.save(usuario);

    if (usuario.perfil) {
      usuario.perfil.isActive = isActive;
      await this.perfilRepository.save(usuario.perfil);
    }

    const userReviews = await this.reviewRepository.find({
      where: { user: { id_usuario: id } },
      relations: ['business'],
    });

    const affectedBusinessIds = [
      ...new Set(userReviews.map((r) => r.business.id_business)),
    ];

    for (const businessId of affectedBusinessIds) {
      await this.recalculateBusinessRating(businessId);
    }

    return {
      message: `Usuario ${isActive ? 'activado' : 'desactivado'} con éxito`,
      status: isActive,
    };
  }

  async create(userData: CreateUsuarioDto) {
    const existingUser = await this.usuarioRepository.findOne({
      where: { email: userData.email },
    });
    if (existingUser)
      throw new BadRequestException(
        'Ya existe un usuario con este correo electrónico.',
      );

    const rol = await this.rolRepository.findOne({
      where: { id: userData.rolId },
    });
    if (!rol) throw new BadRequestException('El Rol especificado no existe.');

    const genero = await this.generoRepository.findOne({
      where: { id_genero: userData.id_genero },
    });
    if (!genero)
      throw new BadRequestException('El género especificado no existe.');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const newUser = this.usuarioRepository.create({
      email: userData.email,
      password: hashedPassword,
      rol,
    });

    const savedUser = await this.usuarioRepository.save(newUser);

    const newProfile = this.perfilRepository.create({
      genero: genero,
      nombre: userData.nombre,
      user: savedUser,
    });

    await this.perfilRepository.save(newProfile);

    return {
      message: 'Usuario creado exitosamente por el administrador.',
      usuario: { id: savedUser.id_usuario, email: savedUser.email },
    };
  }

  async update(id: number, updateData: UpdateUsuarioDto, currentUser: any) {
    const roleName = currentUser.rol.nombre;

    if (roleName !== 'ADMIN' && currentUser.id_usuario !== id) {
      throw new ForbiddenException(
        'No tienes permiso para editar este perfil.',
      );
    }

    if (updateData.rolId && roleName !== 'ADMIN') {
      throw new ForbiddenException(
        'No tienes permiso para cambiar el rol de la cuenta.',
      );
    }

    const user = await this.usuarioRepository.findOne({
      where: { id_usuario: id },
      relations: ['perfil', 'perfil.genero', 'rol'],
    });

    if (!user) throw new NotFoundException('Usuario no encontrado.');

    if (updateData.email) user.email = updateData.email;
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(updateData.password, salt);
    }
    if (updateData.rolId) {
      const rol = await this.rolRepository.findOne({
        where: { id: updateData.rolId },
      });
      if (!rol) throw new BadRequestException('El Rol especificado no existe.');
      user.rol = rol;
    }

    await this.usuarioRepository.save(user);

    if (updateData.nombre || updateData.id_genero) {
      if (updateData.nombre) user.perfil.nombre = updateData.nombre;
      if (updateData.id_genero) {
        const genero = await this.generoRepository.findOne({
          where: { id_genero: updateData.id_genero },
        });
        if (!genero)
          throw new BadRequestException('El género especificado no existe.');
        user.perfil.genero = genero;
      }
      await this.perfilRepository.save(user.perfil);
    }

    return { message: 'Perfil actualizado exitosamente.' };
  }

  async remove(id: number, currentUser: any) {
    const roleName = currentUser.rol.nombre;

    if (roleName !== 'ADMIN' && currentUser.id_usuario !== id) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar esta cuenta.',
      );
    }

    const userToDelete = await this.usuarioRepository.findOne({
      where: { id_usuario: id },
      relations: ['perfil', 'business'],
    });

    if (!userToDelete) throw new NotFoundException('Usuario no encontrado.');

    const userReviews = await this.reviewRepository.find({
      where: { user: { id_usuario: id } },
      relations: ['business'],
    });
    const affectedBusinessIds = [
      ...new Set(userReviews.map((r) => r.business.id_business)),
    ];

    if (userToDelete.business) {
      if (Array.isArray(userToDelete.business)) {
        if (userToDelete.business.length > 0) {
          await this.businessRepository.remove(userToDelete.business);
        }
      } else {
        await this.businessRepository.remove(userToDelete.business);
      }
    }

    if (userToDelete.perfil) {
      await this.perfilRepository.remove(userToDelete.perfil);
    }

    await this.usuarioRepository.remove(userToDelete);

    for (const businessId of affectedBusinessIds) {
      await this.recalculateBusinessRating(businessId);
    }

    return {
      message: `El usuario con ID ${id} y todos sus negocios han sido eliminados permanentemente.`,
    };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.usuarioRepository.findOne({
      where: { id_usuario: userId },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado.');

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch)
      throw new UnauthorizedException('La contraseña actual es incorrecta.');

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(dto.newPassword, salt);

    await this.usuarioRepository.save(user);
    return { message: 'Contraseña actualizada exitosamente.' };
  }

  async changeEmail(userId: number, dto: ChangeEmailDto) {
    const user = await this.usuarioRepository.findOne({
      where: { id_usuario: userId },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado.');

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch)
      throw new UnauthorizedException(
        'Contraseña incorrecta. No se puede cambiar el correo.',
      );

    const existingEmail = await this.usuarioRepository.findOne({
      where: { email: dto.newEmail },
    });
    if (existingEmail && existingEmail.id_usuario !== userId) {
      throw new BadRequestException('Este correo electrónico ya está en uso.');
    }

    user.email = dto.newEmail;
    await this.usuarioRepository.save(user);
    return { message: 'Correo electrónico actualizado exitosamente.' };
  }
}
