import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Perfil } from 'src/users/perfil/entity/perfil.entity';
import { Genero } from 'src/users/genero/entity/genero.entity';
import { Rol } from 'src/users/rol/entity/rol.entity';
import { User } from 'src/users/user/entity/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [TypeOrmModule.forFeature([User, Rol, Genero, Perfil]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') ||
          'fallback_secret_key_123456789',
        signOptions: { expiresIn: '30m' },
      }),
    }),],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
