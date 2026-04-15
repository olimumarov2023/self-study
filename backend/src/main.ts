import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOrigin = process.env['CORS_ORIGIN'];
  app.enableCors({
    origin: corsOrigin ? corsOrigin.split(',').map((o) => o.trim()) : 'http://localhost:5173',
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Self-Study API')
    .setDescription('Personal learning platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);
}

bootstrap();
