import { Module } from '@nestjs/common';
import { PerfilController } from './controllers/perfil.controller';
import { PerfilService } from './services/perfil.service';
import { CloudinaryService } from 'src/shared/upload/services/cloudinary.service';

@Module({
  controllers: [PerfilController],
  providers: [PerfilService, CloudinaryService],
})
export class PerfilModule {}
