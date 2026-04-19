import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './users/user/user.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolModule } from './users/rol/rol.module';
import { PerfilModule } from './users/perfil/perfil.module';
import { GeneroModule } from './users/genero/genero.module';
import { MailModule } from './mail/mail.module';
import { BusinessModule } from './business/business/business.module';
import { CategoryModule } from './business/category/category.module';
import { TagsModule } from './business/tags/tags.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASS'),
        database: configService.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        logging: false,
      }),
      inject: [ConfigService],
    }),
    UserModule,
    AuthModule,
    RolModule,
    PerfilModule,
    GeneroModule,
    MailModule,
    BusinessModule,
    CategoryModule,
    TagsModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
