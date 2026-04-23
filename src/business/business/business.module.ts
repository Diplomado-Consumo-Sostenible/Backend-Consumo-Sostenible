import { Module } from '@nestjs/common';
import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tag } from '../tags/entity/tags.entity';
import { Category } from '../category/entity/category.entity';
import { Business } from './entity/business.entity';
import { User } from 'src/users/user/entity/user.entity';
import { MailModule } from 'src/mail/mail.module';


@Module({
  imports: [MailModule ,TypeOrmModule.forFeature([Tag, Category, Business, User])],
  controllers: [BusinessController],
  providers: [BusinessService],
})
export class BusinessModule {}
