import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {

  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create(AppModule);

    app.enableCors({
    origin: '*', // Permitir cualquier origen
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });


  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no definidas en el DTO
      forbidNonWhitelisted: false, // Lanza error si hay propiedades extra
      transform: true, // Transforma los payloads a instancias de DTO
      transformOptions: {
        enableImplicitConversion: true, // Convierte tipos automáticamente
      },
    }),
  );

  const port = parseInt(process.env.PORT || '3000', 10);

  await app.listen(port, '0.0.0.0');

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(` Database: ${process.env.DB_HOST || 'localhost'}`);
  
}

void bootstrap();
