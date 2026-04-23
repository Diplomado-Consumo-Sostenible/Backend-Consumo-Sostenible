import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller';
import { GeneroController } from './controllers/genero.controller';
import { UserService } from './services/user.service';

@Module({
  controllers: [UserController, GeneroController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
