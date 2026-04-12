import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { Repository } from 'typeorm';
import { Rol } from '../rol/entity/rol.entity';
import { Perfil } from '../perfil/entity/perfil.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly usuarioRepository: Repository<User>,
    @InjectRepository(Perfil)
    private readonly perfilRepository: Repository<Perfil>,
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
}
