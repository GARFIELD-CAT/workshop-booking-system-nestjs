import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Request, Response } from 'express';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
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
  app
    .getHttpAdapter()
    .get('/api/schema', (_request: Request, response: Response) => {
      response.json(document);
    });
  SwaggerModule.setup('schema/swagger-ui', app, document, {
    useGlobalPrefix: true,
    customSiteTitle: 'Workshop Booking API',
  });

  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();
