import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './entity/user.entity';
import { Genero } from '../genero/entity/genero.entity';
import { Rol } from '../rol/entity/rol.entity';
import { Perfil } from '../perfil/entity/perfil.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from 'src/business/business/entity/business.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Genero, Rol, Perfil, Business])],
  controllers: [UserController],
  providers: [UserService]
})
export class UserModule {}
