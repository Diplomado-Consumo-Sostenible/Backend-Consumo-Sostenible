import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PerfilRepository } from 'src/shared/repositories/perfil.repository';
import { GeneroRepository } from 'src/shared/repositories/genero.repository';
import { UpdatePerfilDto } from '../dto/update-perfil.dto';
import { UpdateFotoDto } from '../dto/update-foto.dto';
import { createPaginationResponse } from 'src/common/pagination.helper';
import { GetPerfilesFilterDto } from '../dto/get-perfiles-filter.dto';
import { FindOptionsWhere } from 'typeorm';
import { Perfil } from 'src/shared/entities/perfil.entity';

@Injectable()
export class PerfilService {
  constructor(
    private readonly perfilRepository: PerfilRepository,
    private readonly generoRepository: GeneroRepository,
  ) {}


  async findMyProfile(userId: number) {
    const perfil = await this.perfilRepository.findOne({
      where: { 
        user: { id_usuario: userId },
        isActive: true,
      },
      relations: ['genero', 'user'],
      select: { 
        id_perfil: true, 
        nombre: true, 
        foto_perfil: true, 
        genero: { id_genero: true, nombre: true }, 
        user: { id_usuario: true, email: true } 
      },
    });

    if (!perfil) throw new NotFoundException('Perfil no encontrado o tu cuenta está inactiva.');
    return perfil;
  }


  async updateMyProfile(userId: number, dto: UpdatePerfilDto) {
    const perfil = await this.findMyProfile(userId);

    if (dto.nombre) perfil.nombre = dto.nombre;
    
    if (dto.id_genero) {
      const genero = await this.generoRepository.findOne({ where: { id_genero: dto.id_genero } });
      if (!genero) throw new BadRequestException('El género especificado no existe.');
      perfil.genero = genero;
    }

    await this.perfilRepository.save(perfil);
    return { message: 'Perfil actualizado exitosamente', perfil };
  }


  async updateMyPhoto(userId: number, dto: UpdateFotoDto) {
    const perfil = await this.findMyProfile(userId);

    if (dto.foto_perfil) perfil.foto_perfil = dto.foto_perfil;

    await this.perfilRepository.save(perfil);
    return { message: 'Foto de perfil actualizada exitosamente', perfil };
  }


  async findAll(filters: GetPerfilesFilterDto) {
    const { page = 1, limit = 10, isActive, id_genero } = filters;
    const skip = (page - 1) * limit;

    const whereCondition: FindOptionsWhere<Perfil> = {};

    if (isActive !== undefined) {
      whereCondition.isActive = isActive === 'true';
    }
    
    if (id_genero !== undefined) {
      whereCondition.genero = { id_genero: id_genero };
    }

    const [perfiles, total] = await this.perfilRepository.findAndCount({
      where: whereCondition,
      relations: ['genero', 'user'],
      skip: skip,
      take: limit,
    });

    if (total === 0) {
      const hasFilters = isActive !== undefined || id_genero !== undefined;
      const msg = hasFilters 
        ? 'No se encontraron perfiles con los filtros especificados.' 
        : 'Aún no hay perfiles registrados.';
      throw new NotFoundException(msg);
    }

    return createPaginationResponse(perfiles, total, page, limit);
  }

  async findOne(id: number) {
    const perfil = await this.perfilRepository.findOne({
      where: { id_perfil: id },
      relations: ['genero', 'user'],
    });
    
    if (!perfil) throw new NotFoundException('Perfil no encontrado');
    return perfil;
  }

  async updateAsAdmin(id: number, dto: UpdatePerfilDto) {
    const perfil = await this.findOne(id); 

    if (dto.nombre) perfil.nombre = dto.nombre;
    
    if (dto.id_genero) {
      const genero = await this.generoRepository.findOne({ where: { id_genero: dto.id_genero } });
      if (!genero) throw new BadRequestException('El género especificado no existe.');
      perfil.genero = genero;
    }

    await this.perfilRepository.save(perfil);
    return { message: 'Perfil actualizado por el administrador.', perfil };
  }
}