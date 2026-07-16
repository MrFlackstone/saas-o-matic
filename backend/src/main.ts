import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { configureApp } from './common/configure-app';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  configureApp(app);
  app.enableCors({ origin: 'http://localhost:5173' });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('SaaS-O-Matic API')
    .setDescription('Simulación y presupuestado de suscripciones SaaS')
    .setVersion('1.0')
    .build();
  SwaggerModule.setup(
    'docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  await app.listen(3000);
}
void bootstrap();
