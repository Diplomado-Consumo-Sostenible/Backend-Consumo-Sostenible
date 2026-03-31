import { Module } from '@nestjs/common';
import { GeneroController } from './genero.controller';
import { GeneroService } from './genero.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Genero } from './entity/genero.entity';
import { Perfil } from '../perfil/entity/perfil.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Genero,Perfil])],
  controllers: [GeneroController],
  providers: [GeneroService]
})
export class GeneroModule {}
