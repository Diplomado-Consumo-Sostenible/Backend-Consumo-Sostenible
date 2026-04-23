/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { ScheduleModule } from '@nestjs/schedule';
import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MailModule } from 'src/mail/mail.module';

import { User } from './entities/user.entity';
import { Rol } from './entities/rol.entity';
import { Perfil } from './entities/perfil.entity';
import { Genero } from './entities/genero.entity';
import { Business } from './entities/business.entity';
import { Category } from './entities/category.entity';
import { Tag } from './entities/tags.entity';

import { UserRepository } from './repositories/user.repository';
import { RolRepository } from './repositories/rol.repository';
import { PerfilRepository } from './repositories/perfil.repository';
import { GeneroRepository } from './repositories/genero.repository';
import { BusinessRepository } from './repositories/business.repository';
import { CategoryRepository } from './repositories/category.repository';
import { TagsRepository } from './repositories/tags.repository';

@Module({})
export class SharedModule {
  static forRoot(): DynamicModule {
    return {
      global: true,
      module: SharedModule,
      imports: [
        ScheduleModule.forRoot(),
        EventEmitterModule.forRoot(),
        TypeOrmModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            const dbHost = configService.get<string>('DB_HOST');
            const isLocal = dbHost === 'localhost' || dbHost === '127.0.0.1';
            const sslEnabled =
              configService.get('DB_SSL') === 'true' && !isLocal;

            const config: any = {
              type: 'postgres',
              host: dbHost,
              port: configService.get<number>('DB_PORT'),
              username: configService.get<string>('DB_USERNAME'),
              password: configService.get<string>('DB_PASSWORD'),
              database: configService.get<string>('DB_DATABASE'),
              autoLoadEntities: true,
              synchronize: false,
              logging: false,
              extra: {
                keepAlive: true,
                max: 20,
                idleTimeoutMillis: 60000,
                connectionTimeoutMillis: 60000,
              },
            };
            if (sslEnabled) {
              config.ssl = true;
              config.extra = {
                ...config.extra,
                ssl: { rejectUnauthorized: false },
              };
            }
            return config;
          },
        }),
        TypeOrmModule.forFeature([
          User,
          Rol,
          Perfil,
          Genero,
          Business,
          Category,
          Tag,
        ]),
        MailModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            secret: configService.get<string>('JWT_SECRET'),
            signOptions: {
              expiresIn: (configService.get<string>('JWT_EXPIRES_IN') ||
                '2h') as any,
            },
          }),
        }),
      ],
      providers: [
        UserRepository,
        RolRepository,
        PerfilRepository,
        GeneroRepository,
        BusinessRepository,
        CategoryRepository,
        TagsRepository,
      ],
      exports: [
        TypeOrmModule,
        UserRepository,
        RolRepository,
        PerfilRepository,
        GeneroRepository,
        BusinessRepository,
        CategoryRepository,
        TagsRepository,
        JwtModule,
        PassportModule,
        MailModule,
      ],
    };
  }
}
