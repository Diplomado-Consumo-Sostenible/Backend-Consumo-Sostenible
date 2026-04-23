import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GeneroRepository } from 'src/shared/repositories/genero.repository';

@ApiTags('generos')
@Controller('generos')
export class GeneroController {
  constructor(private readonly generoRepository: GeneroRepository) {}

  @Get()
  @ApiOperation({ summary: 'Listar géneros disponibles' })
  findAll() {
    return this.generoRepository.find();
  }
}
