import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
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

@Injectable()
export class UserService {
  constructor(
    private readonly usuarioRepository: UserRepository,
    private readonly perfilRepository: PerfilRepository,
    private readonly rolRepository: RolRepository,
    private readonly generoRepository: GeneroRepository,
    private readonly businessRepository: BusinessRepository,
  ) {}

  async findAll() {
    return this.usuarioRepository.find({
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
        isActive: true,
      },
    });
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

    if (roleName !== 'ADMIN' && currentUser.id_usuario !== id) {
      throw new ForbiddenException('No tienes permiso para editar este perfil.');
    }

    if (updateData.rolId && roleName !== 'ADMIN') {
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

    if (roleName !== 'ADMIN' && currentUser.id_usuario !== id) {
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

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.usuarioRepository.findOne({ where: { id_usuario: userId } });
    
    if (!user) throw new NotFoundException('Usuario no encontrado.');

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) throw new UnauthorizedException('La contraseña actual es incorrecta.');

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(dto.newPassword, salt);
    
    await this.usuarioRepository.save(user);
    return { message: 'Contraseña actualizada exitosamente.' };
  }

  async changeEmail(userId: number, dto: ChangeEmailDto) {
    const user = await this.usuarioRepository.findOne({ where: { id_usuario: userId } });
    
    if (!user) throw new NotFoundException('Usuario no encontrado.');

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Contraseña incorrecta. No se puede cambiar el correo.');

    const existingEmail = await this.usuarioRepository.findOne({ where: { email: dto.newEmail } });
    if (existingEmail && existingEmail.id_usuario !== userId) {
      throw new BadRequestException('Este correo electrónico ya está en uso.');
    }

    user.email = dto.newEmail;
    await this.usuarioRepository.save(user);
    return { message: 'Correo electrónico actualizado exitosamente.' };
  }
}
