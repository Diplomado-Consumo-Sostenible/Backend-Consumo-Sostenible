import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { Repository } from 'typeorm';
import { Rol } from '../rol/entity/rol.entity';
import { Perfil } from '../perfil/entity/perfil.entity';
import { Genero } from '../genero/entity/genero.entity';
import { Business } from 'src/business/business/entity/business.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import bcrypt from 'node_modules/bcryptjs';
import { UpdateUsuarioDto } from './dto/Update-usuario.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly usuarioRepository: Repository<User>,
    @InjectRepository(Perfil)
    private readonly perfilRepository: Repository<Perfil>,
    @InjectRepository(Rol) 
    private readonly rolRepository: Repository<Rol>,
    @InjectRepository(Genero)
    private readonly generoRepository: Repository<Genero>,
    @InjectRepository(Business) 
    private readonly businessRepository: Repository<Business>,
  ) {}

  async findAll() {
    return this.usuarioRepository.find({
      relations: ['rol', 'perfil'],
      select: {
        id_usuario: true,
        email: true,
        rol: { id: true, nombre: true },
        perfil: {
          nombre: true,
          foto_perfil: true,
        },
        isActive: true,
      },
    });
  }

  async findOne(id: number) {
    const usuario = await this.usuarioRepository.findOne({
      where: { id_usuario: id },
      relations: ['rol', 'perfil'],
      select: {
        id_usuario: true,
        email: true,
        rol: { id: true, nombre: true },
        perfil: {
          nombre: true,
          foto_perfil: true,
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

    return {
      message: `Usuario ${isActive ? 'activado' : 'desactivado'} con éxito`,
      status: isActive,
    };
  }

  async create(userData: CreateUsuarioDto) {
    const existingUser = await this.usuarioRepository.findOne({ where: { email: userData.email } });
    if (existingUser) throw new BadRequestException('Ya existe un usuario con este correo electrónico.');

    const rol = await this.rolRepository.findOne({ where: { id: userData.rolId } });
    if (!rol) throw new BadRequestException('El Rol especificado no existe.');

    const genero = await this.generoRepository.findOne({ where: { id_genero: userData.id_genero } });
    if (!genero) throw new BadRequestException('El género especificado no existe.');

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

    if (roleName !== 'admin' && currentUser.id_usuario !== id) {
      throw new ForbiddenException('No tienes permiso para editar este perfil.');
    }

    if (updateData.rolId && roleName !== 'admin') {
      throw new ForbiddenException('No tienes permiso para cambiar el rol de la cuenta.');
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
      const rol = await this.rolRepository.findOne({ where: { id: updateData.rolId } });
      if (!rol) throw new BadRequestException('El Rol especificado no existe.');
      user.rol = rol;
    }

    await this.usuarioRepository.save(user);

    if (updateData.nombre || updateData.id_genero) {
      if (updateData.nombre) user.perfil.nombre = updateData.nombre;
      if (updateData.id_genero) {
        const genero = await this.generoRepository.findOne({ where: { id_genero: updateData.id_genero } });
        if (!genero) throw new BadRequestException('El género especificado no existe.');
        user.perfil.genero = genero;
      }
      await this.perfilRepository.save(user.perfil);
    }

    return { message: 'Perfil actualizado exitosamente.' };
  }


  async remove(id: number, currentUser: any) {
    const roleName = currentUser.rol.nombre;

    if (roleName !== 'admin' && currentUser.id_usuario !== id) {
      throw new ForbiddenException('No tienes permiso para eliminar esta cuenta.');
    }

    const userToDelete = await this.usuarioRepository.findOne({
      where: { id_usuario: id },
      relations: ['perfil', 'business'], 
    });

    if (!userToDelete) throw new NotFoundException('Usuario no encontrado.');

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

    return { message: `El usuario con ID ${id} y todos sus negocios han sido eliminados permanentemente.` };
  }
}
