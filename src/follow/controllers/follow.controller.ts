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
import { PaginationDto } from 'src/common/dto/pagination.dto';

@ApiTags('follows')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('follows')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}


  @Post(':businessId')
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
  @ApiOperation({ summary: 'Dejar de seguir a un negocio' })
  @ApiResponse({ status: 200, description: 'Dejaste de seguir al negocio' })
  unfollowBusiness(
    @Param('businessId', ParseIntPipe) businessId: number,
    @CurrentUser() user: any,
  ) {
    return this.followsService.unfollowBusiness(businessId, user);
  }

  @Get('my-following')
  @ApiOperation({ summary: 'Listar los negocios que sigo' })
  getFollowing(
    @CurrentUser() user: any,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.followsService.getFollowing(user, paginationDto);
  }

  // --- RUTAS PARA DUEÑOS (OWNERS) ---

  @Get('business/:businessId/followers')
  @UseGuards(RolesGuard)
  @Roles('owner', 'ADMIN')
  @ApiOperation({ summary: 'Listar los seguidores de mi negocio (Owner/Admin)' })
  getBusinessFollowers(
    @Param('businessId', ParseIntPipe) businessId: number,
    @CurrentUser() user: any,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.followsService.getBusinessFollowers(businessId, user, paginationDto);
  }
}