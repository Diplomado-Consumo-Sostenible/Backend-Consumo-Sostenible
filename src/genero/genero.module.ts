import { Module } from '@nestjs/common';
import { GeneroController } from './controllers/genero.controller';
import { GeneroService } from './services/genero.service';


@Module({
  controllers: [GeneroController],
  providers: [GeneroService]
})
export class GeneroModule {}
