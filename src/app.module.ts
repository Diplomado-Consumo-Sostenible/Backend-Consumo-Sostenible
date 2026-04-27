import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { RolModule } from './users/rol/rol.module';
import { PerfilModule } from './perfil/perfil.module';
import { MailModule } from './mail/mail.module';
import { BusinessModule } from './business/business.module';
import { CategoryModule } from './category/category.module';
import { TagsModule } from './tags/tags.module';
import { UserModule } from './users/user.module';
import { SharedModule } from './shared/shared.module';
import { GeneroModule } from './genero/genero.module';
import { CloudinaryModule } from './upload/cloudinary.module';
import { ProductModule } from './products/products.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
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
    SharedModule.forRoot(),
    CloudinaryModule,
    ProductModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
