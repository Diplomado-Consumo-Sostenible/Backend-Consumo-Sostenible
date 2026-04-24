import { Module } from '@nestjs/common';
import { MailModule } from 'src/mail/mail.module';
import { BusinessController } from './controllers/business.controller';
import { BusinessService } from './services/business.service';


@Module({
  imports: [MailModule],
  controllers: [BusinessController],
  providers: [BusinessService],
})
export class BusinessModule {}
