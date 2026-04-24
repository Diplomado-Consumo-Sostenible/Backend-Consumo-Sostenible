import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
import { GeneroController } from '../genero/controllers/genero.controller';

@Module({
  controllers: [UserController, 
   // GeneroController
  ],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}