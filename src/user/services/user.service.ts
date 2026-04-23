import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { createPaginationResponse } from 'src/common/pagination.helper';
import { UserRepository } from 'src/shared/repositories/user.repository';
import { RolRepository } from 'src/shared/repositories/rol.repository';
import { GeneroRepository } from 'src/shared/repositories/genero.repository';
import { Genero } from 'src/shared/entities/genero.entity';
import { PerfilRepository } from 'src/shared/repositories/perfil.repository';
import { CreateUsuarioDto } from '../dto/create-usuario.dto';
import { UpdateUsuarioDto } from '../dto/update-usuario.dto';
import { UserQueryDto } from '../dto/user-query.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly rolRepository: RolRepository,
    private readonly generoRepository: GeneroRepository,
    private readonly perfilRepository: PerfilRepository,
  ) {}

  async create(dto: CreateUsuarioDto) {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existing)
      throw new BadRequestException(
        'Ya existe un usuario con este correo electrónico.',
      );

    const rol = await this.rolRepository.findOne({ where: { nombre: 'USER' } });
    if (!rol)
      throw new BadRequestException(
        'El rol USER no existe en la base de datos.',
      );

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    const user = this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      rol,
    });
    const savedUser = await this.userRepository.save(user);

    let genero: Genero | undefined;
    if (dto.id_genero) {
      const found = await this.generoRepository.findOne({
        where: { id_genero: dto.id_genero },
      });
      if (!found)
        throw new BadRequestException('El género especificado no existe.');
      genero = found;
    }

    const perfil = this.perfilRepository.create({
      nombre: dto.nombre,
      ...(genero ? { genero } : {}),
      user: savedUser,
    });
    await this.perfilRepository.save(perfil);

    return {
      message: 'Usuario registrado correctamente.',
      usuario: {
        id: savedUser.id_usuario,
        email: savedUser.email,
        rol: savedUser.rol.nombre,
      },
    };
  }

  async findAll(query: UserQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.rol', 'rol')
      .leftJoinAndSelect('user.perfil', 'perfil')
      .leftJoin('perfil.genero', 'genero')
      .addSelect(['genero.id_genero', 'genero.nombre'])
      .select([
        'user.id_usuario',
        'user.email',
        'user.isActive',
        'rol.nombre',
        'perfil.nombre',
        'perfil.foto_perfil',
        'genero.id_genero',
        'genero.nombre',
      ]);

    if (query.search) {
      qb.where('user.email ILIKE :s OR perfil.nombre ILIKE :s', {
        s: `%${query.search}%`,
      });
    }

    qb.orderBy('user.id_usuario', query.order ?? 'ASC')
      .skip(skip)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return createPaginationResponse(data, total, page, limit);
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: { id_usuario: id },
      relations: ['rol', 'perfil'],
    });
    if (!user) throw new NotFoundException('Usuario no encontrado.');
    return user;
  }

  async update(id: number, dto: UpdateUsuarioDto) {
    const user = await this.userRepository.findOne({
      where: { id_usuario: id },
      relations: ['rol', 'perfil', 'perfil.genero'],
    });
    if (!user) throw new NotFoundException('Usuario no encontrado.');

    if (dto.password) {
      const salt = await bcrypt.genSalt(10);
      dto.password = await bcrypt.hash(dto.password, salt);
    }

    Object.assign(user, {
      email: dto.email ?? user.email,
      password: dto.password ?? user.password,
    });
    await this.userRepository.save(user);

    if (dto.nombre !== undefined || dto.id_genero !== undefined) {
      const perfil = user.perfil;
      if (perfil) {
        if (dto.nombre !== undefined) perfil.nombre = dto.nombre;
        if (dto.id_genero !== undefined) {
          const genero = await this.generoRepository.findOne({
            where: { id_genero: dto.id_genero },
          });
          if (!genero)
            throw new BadRequestException('El género especificado no existe.');
          perfil.genero = genero;
        }
        await this.perfilRepository.save(perfil);
      }
    }

    return this.findOne(id);
  }

  async toggleStatus(id: number) {
    const user = await this.findOne(id);
    user.isActive = !user.isActive;
    await this.userRepository.save(user);
    return { id_usuario: user.id_usuario, isActive: user.isActive };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.userRepository.delete({ id_usuario: id });
    return { message: 'Usuario eliminado correctamente.' };
  }
}
