import { IsOptional, IsEnum, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../shared/pagination/dto/pagination.dto';

export enum UserRoleFilter {
  ADMIN = 'ADMIN',
  USER  = 'USER',
  OWNER = 'owner',
}

export enum UserSortBy {
  EMAIL      = 'email',
  CREATED_AT = 'createdAt',
}

export class GetUsersFilterDto extends PaginationDto {
  @IsOptional()
  @IsEnum(UserRoleFilter)
  @ApiPropertyOptional({
    enum: UserRoleFilter,
    description: 'Filtrar usuarios por rol (ADMIN, USER, owner)',
    example: UserRoleFilter.USER,
  })
  rol?: UserRoleFilter;

  @IsOptional()
  @IsEnum(UserSortBy)
  @ApiPropertyOptional({
    enum: UserSortBy,
    description: 'Campo por el cual ordenar (email, createdAt)',
    example: UserSortBy.CREATED_AT,
  })
  sortBy?: UserSortBy;

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  @ApiPropertyOptional({
    enum: ['ASC', 'DESC'],
    description: 'Dirección del ordenamiento',
    example: 'DESC',
  })
  order?: 'ASC' | 'DESC';
}
