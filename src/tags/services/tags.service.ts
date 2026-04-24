import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Tag } from '../../shared/entities/tags.entity';
import { CreateTagDto } from '../dto/create-tags';
import { UpdateTagDto } from '../dto/update-tags';
import { TagsRepository } from 'src/shared/repositories/tags.repository';

@Injectable()
export class TagsService {
  constructor(
    private readonly tagRepository: TagsRepository,
  ) {}

  async create(createTagDto: CreateTagDto): Promise<any> {
    try {
      const tagName = createTagDto.tag?.trim();
      if (!tagName) {
        throw new BadRequestException(
          'El nombre del tag no puede estar vacío.',
        );
      }

      // 2. Validación: Evitar duplicados exactos
      const existingTag = await this.tagRepository.findOne({
        where: { tag: tagName },
      });

      if (existingTag) {
        throw new BadRequestException(`El tag "${tagName}" ya existe.`);
      }

      // Creación
      const newTag = this.tagRepository.create({ tag: tagName });
      await this.tagRepository.save(newTag);

      return {
        message: 'Tag creado correctamente',
        data: newTag,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        `Error al crear el tag: ${error.message}`,
      );
    }
  }

  async findAll(): Promise<Tag[]> {
    try {
      const tags = await this.tagRepository.find({
        order: { tag: 'ASC' },
      });

      if (!tags || tags.length === 0) {
        throw new NotFoundException(
          'No se encontraron tags registrados en el sistema.',
        );
      }

      return tags;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Error al obtener los tags: ${error.message}`,
      );
    }
  }

  async findOne(id_tags: number): Promise<Tag> {
    try {
      if (!id_tags || isNaN(id_tags)) {
        throw new BadRequestException('El ID proporcionado no es válido.');
      }

      const tag = await this.tagRepository.findOne({
        where: { id_tags },
      });

      if (!tag) {
        throw new NotFoundException(`Tag con ID ${id_tags} no encontrado.`);
      }

      return tag;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      )
        throw error;
      throw new InternalServerErrorException(
        `Error al buscar el tag: ${error.message}`,
      );
    }
  }

  async update(id_tags: number, updateTagDto: UpdateTagDto): Promise<any> {
    try {
      if (!updateTagDto || Object.keys(updateTagDto).length === 0) {
        throw new BadRequestException('No se enviaron datos para actualizar.');
      }

      const tag = await this.findOne(id_tags);

      if (updateTagDto.tag !== undefined) {
        const newTagName = updateTagDto.tag.trim();

        if (!newTagName) {
          throw new BadRequestException(
            'El nuevo nombre del tag no puede estar vacío.',
          );
        }

        const existingTag = await this.tagRepository.findOne({
          where: { tag: newTagName },
        });

        if (existingTag && existingTag.id_tags !== id_tags) {
          throw new BadRequestException(
            `El tag "${newTagName}" ya está en uso.`,
          );
        }

        tag.tag = newTagName;
      }

      const updatedTag = await this.tagRepository.save(tag);
      return {
        message: 'Tag actualizado correctamente',
        data: updatedTag,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      )
        throw error;
      throw new InternalServerErrorException(
        `Error al actualizar el tag: ${error.message}`,
      );
    }
  }

  async remove(id_tags: number): Promise<{ message: string }> {
    try {
      const tag = await this.findOne(id_tags);

      await this.tagRepository.remove(tag);

      return { message: `Tag con ID ${id_tags} eliminado correctamente.` };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      )
        throw error;
      throw new InternalServerErrorException(
        `Error al eliminar el tag: ${error.message}`,
      );
    }
  }
}
