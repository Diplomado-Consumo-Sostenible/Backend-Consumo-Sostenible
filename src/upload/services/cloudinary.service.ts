import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }


  async uploadImage(file: Express.Multer.File): Promise<any> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { folder: 'ecovida_images' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      upload.end(file.buffer); 
    });
  }


  async uploadProfileImage(file: Express.Multer.File): Promise<any> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { 
          folder: 'ecovida_perfiles', 
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' }, 
            { quality: 'auto', fetch_format: 'webp' } 
          ]
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );
      upload.end(file.buffer); 
    });
  }
}