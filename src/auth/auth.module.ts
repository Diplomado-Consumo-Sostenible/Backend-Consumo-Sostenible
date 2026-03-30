import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Perfil } from 'src/users/perfil/entity/perfil.entity';
import { Genero } from 'src/users/genero/entity/genero.entity';
import { Rol } from 'src/users/rol/entity/rol.entity';
import { User } from 'src/users/user/entity/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Rol, Genero, Perfil]) ],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
