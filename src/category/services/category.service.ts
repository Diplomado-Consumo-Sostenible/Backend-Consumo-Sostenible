import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { Category } from '../../shared/entities/category.entity';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoryRepository } from 'src/shared/repositories/category.repository';

@Injectable()
export class CategoryService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<any> {
    try {
      // 1. Validación: Que no venga vacío o con puros espacios
      const categoryName = createCategoryDto.category?.trim();
      if (!categoryName) {
        throw new BadRequestException(
          'El nombre de la categoría no puede estar vacío.',
        );
      }

      // 2. Validación: Evitar duplicados exactos
      const existingCategory = await this.categoryRepository.findOne({
        where: { category: categoryName },
      });

      if (existingCategory) {
        throw new BadRequestException(
          `La categoría "${categoryName}" ya existe.`,
        );
      }

      // Creación
      const newCategory = this.categoryRepository.create({
        category: categoryName,
      });
      await this.categoryRepository.save(newCategory);

      return {
        message: 'Categoría creada correctamente',
        data: newCategory,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        `Error al crear la categoría: ${error.message}`,
      );
    }
  }

  async findAll(): Promise<Category[]> {
    try {
      const categories = await this.categoryRepository.find({
        order: { category: 'ASC' }, // Orden alfabético
      });

      // 3. Validación: Si la tabla está vacía
      if (!categories || categories.length === 0) {
        throw new NotFoundException(
          'No se encontraron categorías registradas en el sistema.',
        );
      }

      return categories;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        `Error al obtener las categorías: ${error.message}`,
      );
    }
  }

  async findOne(id_category: number): Promise<Category> {
    try {
      // 4. Validación: Que el ID sea un número válido
      if (!id_category || isNaN(id_category)) {
        throw new BadRequestException('El ID proporcionado no es válido.');
      }

      const categoryRecord = await this.categoryRepository.findOne({
        where: { id_category },
      });

      // 5. Validación: Que el registro exista
      if (!categoryRecord) {
        throw new NotFoundException(
          `Categoría con ID ${id_category} no encontrada.`,
        );
      }

      return categoryRecord;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      )
        throw error;
      throw new InternalServerErrorException(
        `Error al buscar la categoría: ${error.message}`,
      );
    }
  }

  async update(
    id_category: number,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<any> {
    try {
      // 6. Validación: Que envíen datos en el body
      if (!updateCategoryDto || Object.keys(updateCategoryDto).length === 0) {
        throw new BadRequestException('No se enviaron datos para actualizar.');
      }

      // Reutilizamos findOne para verificar si existe
      const categoryRecord = await this.findOne(id_category);

      // 7. Validación: Si enviaron el campo category, validarlo y buscar duplicados
      if (updateCategoryDto.category !== undefined) {
        const newCategoryName = updateCategoryDto.category.trim();

        if (!newCategoryName) {
          throw new BadRequestException(
            'El nuevo nombre de la categoría no puede estar vacío.',
          );
        }

        const existingCategory = await this.categoryRepository.findOne({
          where: { category: newCategoryName },
        });

        // Asegurarnos de que el duplicado no sea la misma categoría que estamos editando
        if (existingCategory && existingCategory.id_category !== id_category) {
          throw new BadRequestException(
            `La categoría "${newCategoryName}" ya está en uso.`,
          );
        }

        categoryRecord.category = newCategoryName;
      }

      const updatedCategory =
        await this.categoryRepository.save(categoryRecord);
      return {
        message: 'Categoría actualizada correctamente',
        data: updatedCategory,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      )
        throw error;
      throw new InternalServerErrorException(
        `Error al actualizar la categoría: ${error.message}`,
      );
    }
  }

  async remove(id_category: number): Promise<{ message: string }> {
    try {
      // Reutilizamos findOne para validar el ID y existencia
      const categoryRecord = await this.findOne(id_category);

      await this.categoryRepository.remove(categoryRecord);

      return {
        message: `Categoría con ID ${id_category} eliminada correctamente.`,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      )
        throw error;
      throw new InternalServerErrorException(
        `Error al eliminar la categoría: ${error.message}`,
      );
    }
  }
}
