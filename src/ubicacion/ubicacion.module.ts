import { Module } from '@nestjs/common';
import { DepartamentoController } from './controllers/departamento.controller';
import { MunicipioController } from './controllers/municipio.controller';
import { DepartamentoService } from './services/departamento.service';
import { MunicipioService } from './services/municipio.service';

@Module({
  controllers: [DepartamentoController, MunicipioController],
  providers: [DepartamentoService, MunicipioService],
})
export class UbicacionModule {}
