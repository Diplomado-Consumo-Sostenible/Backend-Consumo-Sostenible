import { Module } from '@nestjs/common';
import { GeneroController } from './genero.controller';

@Module({
  controllers: [GeneroController],
})
export class GeneroModule {}
