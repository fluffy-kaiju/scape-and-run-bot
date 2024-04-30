import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppService } from './app.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const log = new Logger('bootstrap');

  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(AppService);
  log.log(service.getHello());
  await service.start();
  app.close();
}
bootstrap();
