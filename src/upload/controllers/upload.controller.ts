import { 
  Controller, 
  Post, 
  UseInterceptors, 
  UploadedFile, 
  ParseFilePipe, 
  FileTypeValidator, 
  BadRequestException, 
  UseGuards
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../services/cloudinary.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth/jwt-auth.guard';


@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post()
  @UseInterceptors(FileInterceptor('imagen')) 
  async uploadProfileImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|webp)' }), 
        ],
        fileIsRequired: true,
      }),
    ) file: Express.Multer.File,
  ) {
    try {
      const result = await this.cloudinaryService.uploadProfileImage(file);

      const secureUrl = result.secure_url;
      
      return {
        message: 'Imagen de perfil cargada y guardada exitosamente en Ecovida',
        url: secureUrl,
      };

    } catch (error) {
      console.error(error);
      throw new BadRequestException('Hubo un problema al subir la imagen a Cloudinary');
    }
  }
}