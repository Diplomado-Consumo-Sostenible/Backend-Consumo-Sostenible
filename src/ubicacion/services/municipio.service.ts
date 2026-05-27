import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { MunicipioRepository } from 'src/shared/repositories/municipio.repository';
import { DepartamentoRepository } from 'src/shared/repositories/departamento.repository';
import { CreateMunicipioDto } from '../dto/create-municipio.dto';
import { UpdateMunicipioDto } from '../dto/update-municipio.dto';
import { PaginationDto } from 'src/shared/pagination/dto/pagination.dto';
import { createPaginationResponse } from 'src/shared/pagination/pagination.helper';

@Injectable()
export class MunicipioService {
  constructor(
    private readonly municipioRepository: MunicipioRepository,
    private readonly departamentoRepository: DepartamentoRepository,
  ) {}

  async create(dto: CreateMunicipioDto) {
    try {
      const nombre = dto.nombre.trim();
      if (!nombre) {
        throw new BadRequestException(
          'El nombre del municipio no puede estar vacío.',
        );
      }

      const departamento = await this.departamentoRepository.findOne({
        where: { id_departamento: dto.id_departamento },
      });
      if (!departamento) {
        throw new NotFoundException(
          `Departamento con ID ${dto.id_departamento} no encontrado.`,
        );
      }

      const duplicate = await this.municipioRepository.findOne({
        where: {
          nombre,
          departamento: { id_departamento: dto.id_departamento },
        },
        relations: ['departamento'],
      });
      if (duplicate) {
        throw new BadRequestException(
          `El municipio "${nombre}" ya existe en el departamento "${departamento.nombre}".`,
        );
      }

      const municipio = this.municipioRepository.create({
        nombre,
        departamento,
      });
      await this.municipioRepository.save(municipio);
      return { message: 'Municipio creado correctamente.', data: municipio };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      )
        throw error;
      throw new InternalServerErrorException(
        `Error al crear el municipio: ${(error as Error).message}`,
      );
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 20 } = paginationDto;
    const skip = (page - 1) * limit;

    try {
      const [municipios, total] = await this.municipioRepository.findAndCount({
        relations: ['departamento'],
        order: { nombre: 'ASC' },
        skip,
        take: limit,
      });

      if (total === 0) {
        throw new NotFoundException('No hay municipios registrados.');
      }

      return createPaginationResponse(municipios, total, page, limit);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Error al obtener municipios: ${(error as Error).message}`,
      );
    }
  }

  async findByDepartamento(
    idDepartamento: number,
    paginationDto: PaginationDto,
  ) {
    const { page = 1, limit = 20 } = paginationDto;
    const skip = (page - 1) * limit;

    try {
      const departamento = await this.departamentoRepository.findOne({
        where: { id_departamento: idDepartamento },
      });
      if (!departamento) {
        throw new NotFoundException(
          `Departamento con ID ${idDepartamento} no encontrado.`,
        );
      }

      const [municipios, total] = await this.municipioRepository.findAndCount({
        where: { departamento: { id_departamento: idDepartamento } },
        relations: ['departamento'],
        order: { nombre: 'ASC' },
        skip,
        take: limit,
      });

      if (total === 0) {
        throw new NotFoundException(
          `El departamento "${departamento.nombre}" no tiene municipios registrados.`,
        );
      }

      return createPaginationResponse(municipios, total, page, limit);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Error al obtener municipios del departamento: ${(error as Error).message}`,
      );
    }
  }

  async findOne(id: number) {
    try {
      const municipio = await this.municipioRepository.findOne({
        where: { id_municipio: id },
        relations: ['departamento'],
      });
      if (!municipio) {
        throw new NotFoundException(`Municipio con ID ${id} no encontrado.`);
      }
      return municipio;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Error al buscar el municipio: ${(error as Error).message}`,
      );
    }
  }

  async update(id: number, dto: UpdateMunicipioDto) {
    try {
      if (!dto || Object.keys(dto).length === 0) {
        throw new BadRequestException('No se enviaron datos para actualizar.');
      }

      const municipio = await this.municipioRepository.findOne({
        where: { id_municipio: id },
        relations: ['departamento'],
      });
      if (!municipio) {
        throw new NotFoundException(`Municipio con ID ${id} no encontrado.`);
      }

      if (dto.id_departamento !== undefined) {
        const departamento = await this.departamentoRepository.findOne({
          where: { id_departamento: dto.id_departamento },
        });
        if (!departamento) {
          throw new NotFoundException(
            `Departamento con ID ${dto.id_departamento} no encontrado.`,
          );
        }
        municipio.departamento = departamento;
      }

      if (dto.nombre !== undefined) {
        const nombre = dto.nombre.trim();
        if (!nombre)
          throw new BadRequestException('El nombre no puede estar vacío.');

        const depId = municipio.departamento.id_departamento;
        const duplicate = await this.municipioRepository.findOne({
          where: { nombre, departamento: { id_departamento: depId } },
          relations: ['departamento'],
        });
        if (duplicate && duplicate.id_municipio !== id) {
          throw new BadRequestException(
            `El municipio "${nombre}" ya existe en ese departamento.`,
          );
        }
        municipio.nombre = nombre;
      }

      await this.municipioRepository.save(municipio);
      return {
        message: 'Municipio actualizado correctamente.',
        data: municipio,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      )
        throw error;
      throw new InternalServerErrorException(
        `Error al actualizar el municipio: ${(error as Error).message}`,
      );
    }
  }

  async remove(id: number) {
    try {
      const municipio = await this.municipioRepository.findOne({
        where: { id_municipio: id },
      });
      if (!municipio) {
        throw new NotFoundException(`Municipio con ID ${id} no encontrado.`);
      }
      await this.municipioRepository.remove(municipio);
      return { message: `Municipio con ID ${id} eliminado correctamente.` };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Error al eliminar el municipio: ${(error as Error).message}`,
      );
    }
  }
}
