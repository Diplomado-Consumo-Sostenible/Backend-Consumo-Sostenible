import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DepartamentoRepository } from 'src/shared/repositories/departamento.repository';
import { CreateDepartamentoDto } from '../dto/create-departamento.dto';
import { UpdateDepartamentoDto } from '../dto/update-departamento.dto';

@Injectable()
export class DepartamentoService {
  constructor(
    private readonly departamentoRepository: DepartamentoRepository,
  ) {}

  async create(dto: CreateDepartamentoDto) {
    try {
      const nombre = dto.nombre.trim();
      if (!nombre) {
        throw new BadRequestException(
          'El nombre del departamento no puede estar vacío.',
        );
      }

      const existing = await this.departamentoRepository.findOne({
        where: { nombre },
      });
      if (existing) {
        throw new BadRequestException(`El departamento "${nombre}" ya existe.`);
      }

      const departamento = this.departamentoRepository.create({
        nombre,
      });
      await this.departamentoRepository.save(departamento);
      return {
        message: 'Departamento creado correctamente.',
        data: departamento,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        `Error al crear el departamento: ${(error as Error).message}`,
      );
    }
  }

  async findAll() {
    try {
      const departamentos = await this.departamentoRepository.find({
        order: { nombre: 'ASC' },
      });
      if (departamentos.length === 0) {
        throw new NotFoundException('No hay departamentos registrados.');
      }
      return departamentos;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Error al obtener departamentos: ${(error as Error).message}`,
      );
    }
  }

  async findOne(id: number) {
    try {
      const departamento = await this.departamentoRepository.findOne({
        where: { id_departamento: id },
        relations: ['municipios'],
        order: { municipios: { nombre: 'ASC' } },
      });
      if (!departamento) {
        throw new NotFoundException(`Departamento con ID ${id} no encontrado.`);
      }
      return departamento;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Error al buscar el departamento: ${(error as Error).message}`,
      );
    }
  }

  async update(id: number, dto: UpdateDepartamentoDto) {
    try {
      if (!dto || Object.keys(dto).length === 0) {
        throw new BadRequestException('No se enviaron datos para actualizar.');
      }

      const departamento = await this.departamentoRepository.findOne({
        where: { id_departamento: id },
      });
      if (!departamento) {
        throw new NotFoundException(`Departamento con ID ${id} no encontrado.`);
      }

      if (dto.nombre !== undefined) {
        const nombre = dto.nombre.trim();
        if (!nombre)
          throw new BadRequestException('El nombre no puede estar vacío.');

        const duplicate = await this.departamentoRepository.findOne({
          where: { nombre },
        });
        if (duplicate && duplicate.id_departamento !== id) {
          throw new BadRequestException(
            `El departamento "${nombre}" ya existe.`,
          );
        }
        departamento.nombre = nombre;
      }

      await this.departamentoRepository.save(departamento);
      return {
        message: 'Departamento actualizado correctamente.',
        data: departamento,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      )
        throw error;
      throw new InternalServerErrorException(
        `Error al actualizar el departamento: ${(error as Error).message}`,
      );
    }
  }

  async remove(id: number) {
    try {
      const departamento = await this.departamentoRepository.findOne({
        where: { id_departamento: id },
      });
      if (!departamento) {
        throw new NotFoundException(`Departamento con ID ${id} no encontrado.`);
      }
      await this.departamentoRepository.remove(departamento);
      return { message: `Departamento con ID ${id} eliminado correctamente.` };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Error al eliminar el departamento: ${(error as Error).message}`,
      );
    }
  }
}
