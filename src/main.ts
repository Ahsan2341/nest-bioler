import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(
    '/stripe/webhook',
    bodyParser.raw({ type: 'application/json' })
  );
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not defined in DTO
      forbidNonWhitelisted: true, // Throw error if extra properties are sent
      transform: true, // Transform payload to DTO class instance
      exceptionFactory: (validationErrors = []) => {
        if (validationErrors.length > 0 && validationErrors[0].constraints) {
          const message = Object.values(validationErrors[0].constraints)[0];
          return new BadRequestException(message);
        }
        return new BadRequestException('Validation failed');
      },
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
