import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ILike } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { GetProductsFilterDto } from '../dto/get-products-filter.dto';
import { createPaginationResponse } from '../../shared/pagination/pagination.helper';
import { ProductRepository } from 'src/shared/repositories/products.reposiroty';
import { BusinessRepository } from 'src/shared/repositories/business.repository';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly businessRepository: BusinessRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAllByBusiness(businessId: number, filterDto: GetProductsFilterDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      order = 'DESC',
    } = filterDto;

    const skip = (page - 1) * limit;

    const business = await this.businessRepository.findOne({
      where: { id_business: businessId },
    });
    if (!business) throw new NotFoundException('Negocio no encontrado');

    const where: any = {
      business: { id_business: businessId },
      isActive: true,
    };
    if (search?.trim()) {
      where.name = ILike(`%${search.trim()}%`);
    }

    const [products, total] = await this.productRepository.findAndCount({
      where,
      order: { [sortBy]: order },
      skip,
      take: limit,
    });

    return createPaginationResponse(products, total, page, limit);
  }

  async create(
    businessId: number,
    createProductDto: CreateProductDto,
    user: any,
  ) {
    const roleName = user.rol.nombre;

    const business = await this.businessRepository.findOne({
      where: { id_business: businessId },
      relations: ['user'],
    });

    if (!business) throw new NotFoundException('Negocio no encontrado');
    if (roleName !== 'admin' && business.user.id_usuario !== user.id_usuario) {
      throw new ForbiddenException(
        'No tienes permiso para agregar productos a este negocio.',
      );
    }

    if (business.isActive === false) {
      throw new ForbiddenException(
        'No puedes agregar productos a un negocio inactivo. Por favor, contacta al administrador para más información.',
      );
    }

    if (business.status !== 'Active') {
      throw new ForbiddenException(
        'No puedes agregar productos a un negocio que no está activo. Por favor, espera a que tu negocio sea aprobado por el administrador.',
      );
    }

    const newProduct = this.productRepository.create({
      ...createProductDto,
      business,
    });

    const savedProduct = await this.productRepository.save(newProduct);

    this.eventEmitter.emit('product.created', {
      businessId: business.id_business,
      businessName: business.businessName,
      businessLogo: business.logo ?? null,
      productId: savedProduct.id_product,
      productName: savedProduct.name,
      productImage: savedProduct.image ?? null,
    });

    return { message: `Producto creado exitosamente: ${savedProduct.name}` };
  }

  async update(
    productId: number,
    updateProductDto: UpdateProductDto,
    user: any,
  ) {
    const roleName = user.rol.nombre;

    const product = await this.productRepository.findOne({
      where: { id_product: productId },
      relations: ['business', 'business.user'],
    });

    if (!product) throw new NotFoundException('Producto no encontrado');

    if (
      roleName !== 'admin' &&
      product.business.user.id_usuario !== user.id_usuario
    ) {
      throw new ForbiddenException(
        'No tienes permiso para editar este producto.',
      );
    }

    if (product.business.isActive === false) {
      throw new ForbiddenException(
        'No puedes editar productos de un negocio inactivo. Por favor, contacta al administrador para más información.',
      );
    }

    if (product.business.status !== 'Active') {
      throw new ForbiddenException(
        'No puedes editar productos de un negocio que no está aprovado. Por favor, contacta al administrador para más información.',
      );
    }

    Object.assign(product, updateProductDto);
    await this.productRepository.save(product);

    return {
      message: `Producto actualizado exitosamente: ${product.name}`,
      product,
    };
  }

  async remove(productId: number, user: any) {
    const roleName = user.rol.nombre;

    const product = await this.productRepository.findOne({
      where: { id_product: productId },
      relations: ['business', 'business.user'],
    });

    if (!product) throw new NotFoundException('Producto no encontrado');

    if (
      roleName !== 'admin' &&
      product.business.user.id_usuario !== user.id_usuario
    ) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar este producto.',
      );
    }

    if (product.business.isActive === false) {
      throw new ForbiddenException(
        'No puedes eliminar productos de un negocio inactivo. Por favor, contacta al administrador para más información.',
      );
    }
    if (product.business.status !== 'Active') {
      throw new ForbiddenException(
        'No puedes eliminar productos de un negocio que no está aprovado. Por favor, contacta al administrador para más información.',
      );
    }

    await this.productRepository.remove(product);
    return {
      message: `El producto con ID ${productId} fue eliminado permanentemente`,
    };
  }
}
