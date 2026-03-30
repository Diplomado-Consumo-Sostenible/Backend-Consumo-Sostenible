import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Genero } from './entity/genero.entity';
import { CreateGeneroDto } from './dto/create-genero.dto';
import { UpdateGeneroDto } from './dto/Update-genero.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { createPaginationResponse, PaginationResult } from 'src/common/pagination.helper';

@Injectable()
export class GeneroService {
  constructor(
    @InjectRepository(Genero)
    private readonly generoRepository: Repository<Genero>,
  ) {}

  async create(createGeneroDto: CreateGeneroDto): Promise<Genero> {
    try {
      const { nombre } = createGeneroDto;
      const exists = await this.generoRepository.findOne({ where: { nombre } });
      if (exists) {
        throw new BadRequestException(`El género "${nombre}" ya existe.`);
      }
      const genero = this.generoRepository.create(createGeneroDto);
      await this.generoRepository.save(genero);
      return genero;
    } catch (error) {
      throw new BadRequestException(
        `Error al crear el género: ${error.message}`,
      );
    }
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginationResult<Genero>> {
    const { limit = 10, page = 1 } = paginationDto;
    const skip = (page - 1) * limit;

    try {
      
      const [generos, total] = await this.generoRepository.findAndCount({
        take: limit,
        skip: skip,
        select: {
          id_genero: true,
          nombre: true,
        },
      })
      if (generos.length === 0) {
        throw new NotFoundException('No se encontraron géneros.');
      }

      return createPaginationResponse(generos, total, page, limit);

    } catch (error) {
      throw new BadRequestException(
        `Error al buscar los géneros: ${error.message}`,
      );
    }
  }

  async findOne(id: number): Promise<Genero> {
    try {
      const genero = await this.generoRepository.findOne({
        where: { id_genero: id },
        select: {
          id_genero: true,
          nombre: true,
        },
      });
      if (!genero) {
        throw new NotFoundException(`Género con ID ${id} no encontrado.`);
      }
      return genero;
    } catch (error) {
      throw new BadRequestException(
        `Error al buscar el género: ${error.message}`,
      );
    }
  }

  async update(id: number, updateGeneroDto: UpdateGeneroDto): Promise<Genero> {
    try {
      const genero = await this.findOne(id);
      if (updateGeneroDto.nombre && updateGeneroDto.nombre !== genero.nombre) {
        const exists = await this.generoRepository.findOne({
          where: { nombre: updateGeneroDto.nombre },
        });
        if (exists) {
          throw new BadRequestException(
            `El género "${updateGeneroDto.nombre}" ya existe.`,
          );
        }
      }
      Object.assign(genero, updateGeneroDto);
      return await this.generoRepository.save(genero);
    } catch (error) {
      throw new BadRequestException(
        `Error al actualizar el género: ${error.message}`,
      );
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    try {
      const genero = await this.findOne(id);
      await this.generoRepository.remove(genero);
      return { message: 'Género eliminado correctamente' };
    } catch (error) {
      throw new BadRequestException(
        `Error al eliminar el género: ${error.message}`,
      );
    }
  }
}
