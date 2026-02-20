import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { json } from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/exceptions/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import type { EnvConfig } from './common/config/env.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<EnvConfig>);
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix('api');

  // Helmet security headers
  app.use(helmet());

  // CORS
  const corsOrigin = configService.get('CORS_ORIGIN', { infer: true })!;
  app.enableCors({
    origin: corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
  });

  // Cookie parser
  app.use(cookieParser());

  // Raw body for Stripe webhooks (must be before global json parser)
  app.use('/api/stripe/webhook', json({ type: 'application/json', verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }}));

  // Global filters and interceptors
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new ResponseInterceptor());

  const port = configService.get('PORT', { infer: true }) || 3000;
  await app.listen(port);
  logger.log(`CraftCard API running on port ${port}`);
}

bootstrap();
