import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

    // Configuración de Swagger
    const config = new DocumentBuilder()
    .setTitle('API Consumo Sostenible')
    .setDescription('Backend para la gestión de consumo responsable')
    .setVersion('1.0')
    .addTag('generos')
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  // Pipes globales para validaciones
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  //app.setGlobalPrefix('api');

  app.enableCors({
    origin: 'http://localhost:4200',
    Credential: true,
  });

  const port = process.env.SERVER_PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Server running on http://localhost:${port}/api`);
}
bootstrap();
