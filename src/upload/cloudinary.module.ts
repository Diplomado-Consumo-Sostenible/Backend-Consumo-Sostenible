import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // Si usas variables de entorno en Nest
import { UploadController } from './controllers/upload.controller';
import { CloudinaryService } from './services/cloudinary.service';


@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [UploadController],
  providers: [CloudinaryService],
})
export class CloudinaryModule {}