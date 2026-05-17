import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { FollowsService } from '../services/follow.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/jwt-auth/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorator/user.decorator';
import { PaginationDto } from 'src/shared/pagination/dto/pagination.dto';

@ApiTags('follows')
@ApiBearerAuth()
@Controller('follows')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}


  @Post(':businessId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Seguir a un negocio' })
  @ApiResponse({ status: 201, description: 'Negocio seguido exitosamente' })
  @ApiResponse({ status: 409, description: 'Ya sigues a este negocio' })
  followBusiness(
    @Param('businessId', ParseIntPipe) businessId: number,
    @CurrentUser() user: any,
  ) {
    return this.followsService.followBusiness(businessId, user);
  }

  @Delete(':businessId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Dejar de seguir a un negocio' })
  @ApiResponse({ status: 200, description: 'Dejaste de seguir al negocio' })
  unfollowBusiness(
    @Param('businessId', ParseIntPipe) businessId: number,
    @CurrentUser() user: any,
  ) {
    return this.followsService.unfollowBusiness(businessId, user);
  }

  @Get('my-following')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Listar los negocios que sigo (con categoría y tags)' })
  getFollowing(
    @CurrentUser() user: any,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.followsService.getFollowing(user, paginationDto);
  }

  @Get('most-followed')
  @ApiOperation({ summary: 'Listar los negocios más seguidos' })
  getMostFollowedBusinesses(@Query() paginationDto: PaginationDto) {
    return this.followsService.getMostFollowedBusinesses(paginationDto);
  }

  @Get('management/my-followers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('owner')
  @ApiOperation({ summary: 'Listar los seguidores de mi negocio (Solo Owner)' })
  getMyBusinessFollowers(
    @CurrentUser() user: any,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.followsService.getMyBusinessFollowers(user, paginationDto);
  }


  @Get('admin/business/:businessId/followers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Ver seguidores de cualquier negocio (Solo Admin)' })
  getBusinessFollowersForAdmin(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.followsService.getBusinessFollowersForAdmin(businessId, paginationDto);
  }
}