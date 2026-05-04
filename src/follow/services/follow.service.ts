import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { BusinessRepository } from 'src/shared/repositories/business.repository';
import { BusinessStatus } from 'src/shared/entities/business.entity';
import { FollowRepository } from 'src/shared/repositories/follow.repository';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { createPaginationResponse } from 'src/common/pagination.helper';


@Injectable()
export class FollowsService {
  constructor(
    private readonly followRepository: FollowRepository,
    private readonly businessRepository: BusinessRepository,
  ) {}

  async followBusiness(businessId: number, user: any) {
    const business = await this.businessRepository.findOne({
      where: { id_business: businessId, status: BusinessStatus.ACTIVE, isActive: true }
    });

    if (!business) {
      throw new NotFoundException('El negocio no existe o no está disponible en este momento.');
    }

    const existingFollow = await this.followRepository.findOne({
      where: {
        follower: { id_usuario: user.id_usuario },
        followedBusiness: { id_business: businessId },
      },
    });

    if (existingFollow) {
      throw new ConflictException('Ya sigues a este negocio.');
    }

    const follow = this.followRepository.create({
      follower: { id_usuario: user.id_usuario },
      followedBusiness: { id_business: businessId },
    });

    await this.followRepository.save(follow);
    
    await this.businessRepository.increment({ id_business: businessId }, 'followers_count', 1);

    return { message: `Ahora sigues a ${business.businessName}` };
  }

  async unfollowBusiness(businessId: number, user: any) {
    const follow = await this.followRepository.findOne({
      where: {
        follower: { id_usuario: user.id_usuario },
        followedBusiness: { id_business: businessId },
      },
    });

    if (!follow) {
      throw new BadRequestException('No sigues a este negocio.');
    }

    await this.followRepository.remove(follow);

    await this.businessRepository.decrement({ id_business: businessId }, 'followers_count', 1);

    return { message: 'Has dejado de seguir a este negocio.' };
  }

  async getFollowing(user: any, paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [follows, total] = await this.followRepository.findAndCount({
      where: { follower: { id_usuario: user.id_usuario } },
      relations: ['followedBusiness'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    if (total === 0) {
      throw new NotFoundException('Aún no sigues a ningún negocio.');
    }

    const businesses = follows.map(f => f.followedBusiness);

    return createPaginationResponse(businesses, total, page, limit);
  }

  async getBusinessFollowers(businessId: number, user: any, paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;


    const business = await this.businessRepository.findOne({
      where: { id_business: businessId },
      relations: ['user'],
    });

    if (!business) throw new NotFoundException('Negocio no encontrado');
    
    if (business.user.id_usuario !== user.id_usuario && user.rol.nombre !== 'admin') {
      throw new ForbiddenException('No tienes permiso para ver los seguidores de este negocio.');
    }

    const [follows, total] = await this.followRepository.findAndCount({
      where: { followedBusiness: { id_business: businessId } },
      relations: ['follower', 'follower.perfil'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    if (total === 0) {
      throw new NotFoundException('Este negocio aún no tiene seguidores.');
    }

    const followers = follows.map(f => ({
      id_usuario: f.follower.id_usuario,
      fecha_seguimiento: f.createdAt,
      perfil: f.follower.perfil 
    }));

    return createPaginationResponse(followers, total, page, limit);
  }
}