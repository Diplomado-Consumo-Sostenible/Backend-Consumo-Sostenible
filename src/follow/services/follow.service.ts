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
import { PaginationDto } from 'src/shared/pagination/dto/pagination.dto';
import { createPaginationResponse } from 'src/shared/pagination/pagination.helper';
import { TagsRepository } from 'src/shared/repositories/tags.repository';
import { CategoryRepository } from 'src/shared/repositories/category.repository';


@Injectable()
export class FollowsService {
  constructor(
    private readonly followRepository: FollowRepository,
    private readonly businessRepository: BusinessRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly tagRepository: TagsRepository,
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
      relations: ['followedBusiness', 
        'followedBusiness.category', 
        'followedBusiness.tags'],
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

  async getMyBusinessFollowers(user: any, paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const business = await this.businessRepository.findOne({
      where: { user: { id_usuario: user.id_usuario } },
    });

    if (!business) {
      throw new NotFoundException('No tienes un negocio registrado para ver seguidores.');
    }

    const [follows, total] = await this.followRepository.findAndCount({
      where: { followedBusiness: { id_business: business.id_business } },
      relations: ['follower', 'follower.perfil'], 
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    if (total === 0) {
      throw new NotFoundException('Aún no tienes seguidores.');
    }

    const followers = follows.map(f => ({
      id_usuario: f.follower.id_usuario,
      fecha_seguimiento: f.createdAt,
      perfil: f.follower.perfil 
    }));

    return createPaginationResponse(followers, total, page, limit);
  }


  async getBusinessFollowersForAdmin(businessId: number, paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [follows, total] = await this.followRepository.findAndCount({
      where: { followedBusiness: { id_business: businessId } },
      relations: ['follower', 'follower.perfil'], 
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    if (total === 0) {
      throw new NotFoundException('Este negocio no tiene seguidores.');
    }

    const followers = follows.map(f => ({
      id_usuario: f.follower.id_usuario,
      fecha_seguimiento: f.createdAt,
      perfil: f.follower.perfil 
    }));

    return createPaginationResponse(followers, total, page, limit);
  }
}
