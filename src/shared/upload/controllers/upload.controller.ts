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
import { ApiOperation, ApiResponse } from '@nestjs/swagger';


@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post()
  @ApiOperation({ summary: 'Subir imagen de perfil con recorte automático 400*400' })
  @ApiResponse({ status: 201, description: 'Imagen de perfil cargada exitosamente' })
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
  
  

  @Post('general')
  @ApiOperation({ summary: 'Subir imágenes generales (negocios, productos, certificaciones) sin recorte forzado' })
  @ApiResponse({ status: 201, description: 'Imagen cargada exitosamente' })
  @UseInterceptors(FileInterceptor('imagen'))
  async uploadGeneralImage(
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
      const result = await this.cloudinaryService.uploadImage(file);
      const secureUrl = result.secure_url;

      return {
        message: 'Imagen cargada exitosamente',
        url: secureUrl,
      };

    } catch (error) {
      console.error(error);
      throw new BadRequestException('Hubo un problema al subir la imagen a Cloudinary');
    }
  }
}