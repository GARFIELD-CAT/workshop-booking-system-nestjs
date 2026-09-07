import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Workshop Booking API')
    .setDescription('Система бронирования мастер-классов')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('schema/swagger-ui', app, document, {
    useGlobalPrefix: true,
    jsonDocumentUrl: '/api/schema/',
    customSiteTitle: 'Workshop Booking API',
  });

  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();
