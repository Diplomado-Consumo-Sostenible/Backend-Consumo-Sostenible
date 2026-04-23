import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GeneroRepository } from 'src/shared/repositories/genero.repository';

@ApiTags('genero')
@Controller('genero')
export class GeneroController {
  constructor(private readonly generoRepository: GeneroRepository) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los géneros' })
  findAll() {
    return this.generoRepository.find({ order: { nombre: 'ASC' } });
  }
}
