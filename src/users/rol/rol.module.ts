import { Module } from '@nestjs/common';
import { RolController } from './rol.controller';
import { RolService } from './rol.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rol } from '../../shared/entities/rol.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Rol])],
  controllers: [RolController],
  providers: [RolService]
})
export class RolModule {}
