import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rol } from './entity/rol.entity';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';


@Injectable()
export class RolService {
  constructor(
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
  ) {}

  // Crear rol
  async create(createRolDto: CreateRolDto) {
    const exists = await this.rolRepository.findOne({ where: { nombre: createRolDto.nombre } });
    if (exists) return { message: `El rol "${createRolDto.nombre}" ya existe` };
    const rol = this.rolRepository.create(createRolDto);
    await this.rolRepository.save(rol);
    return { message: 'Rol creado exitosamente', data: rol };
  }

  // Listar todos los roles
  async findAll() {
    const roles = await this.rolRepository.find({ relations: ['users'] });
    if (roles.length === 0) return { message: 'No se encontraron roles' };
    
    return this.rolRepository.find({ relations: ['users'] });
  }

  // Buscar un rol por ID
  async findOne(id: number) {
    const rol = await this.rolRepository.findOne({
      where: { id: id },
      relations: ['users'],
    });
    if (!rol) return { message: 'Rol no encontrado' };
    return rol;
  }

  // Actualizar rol
  async update(id: number, updateRolDto: UpdateRolDto) {
    const rol = await this.rolRepository.findOne({ where: { id: id } });
    if (!rol) return { message: 'Rol no encontrado' };

    Object.assign(rol, updateRolDto);
    await this.rolRepository.save(rol);
    return { message: 'Rol actualizado exitosamente', data: rol };
  }

  // Eliminar rol
  async remove(id: number) {
    const rol = await this.rolRepository.findOne({ where: { id: id } });
    if (!rol) return { message: 'Rol no encontrado' };

    await this.rolRepository.remove(rol);
    return { message: 'Rol eliminado correctamente' };
  }
}
