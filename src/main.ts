import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Temple Gym API')
    .setDescription('API documentation for Temple Gym project')
    .setVersion('0.1.0')
    .addTag('auth', 'authentication endpoints')
    .addTag('subscriptions', 'subscriptions endpoints')
    .addTag('memberships', 'memberships endpoints')
    .addTag('attendances', 'attendances endpoints')
    .addBearerAuth()
    .build();

    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('api-docs', app, document)

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
