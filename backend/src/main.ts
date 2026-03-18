/**
 * Ponto de entrada da aplicação CraftCard API.
 *
 * Configura toda a camada de segurança (Helmet, CORS, limites de payload),
 * compressão de resposta, cookie parser e filtros/interceptors globais.
 *
 * O deploy é feito via Render (free tier). O comando de start em produção
 * executa `prisma migrate deploy && node dist/main`.
 */
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import * as compression from 'compression';
import helmet from 'helmet';
import * as express from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/exceptions/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import type { EnvConfig } from './common/config/env.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<EnvConfig>);
  const logger = new Logger('Bootstrap');

  // Prefixo global — todas as rotas ficam sob /api/*
  app.setGlobalPrefix('api');

  // Limite de tamanho do body para prevenir ataques de DoS com payloads grandes
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // Compressão Gzip/Brotli para reduzir o tamanho das respostas
  app.use(compression());

  // Headers de segurança via Helmet (CSP, X-Frame-Options, etc.)
  // crossOriginResourcePolicy: 'cross-origin' necessário para servir imagens do R2/CDN
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          'img-src': ["'self'", 'data:', 'https:'],
        },
      },
    }),
  );

  // CORS — aceita múltiplas origens separadas por vírgula na env CORS_ORIGIN
  // credentials: true é necessário para enviar/receber cookies httpOnly (JWT refresh token)
  const corsOrigin = configService.get('CORS_ORIGIN', { infer: true })!;
  app.enableCors({
    origin: corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Parser de cookies — necessário para ler refresh tokens dos cookies httpOnly
  app.use(cookieParser());

  // Filtro global de exceções (padroniza todas as respostas de erro)
  // Interceptors: LoggingInterceptor registra tempo de resposta, ResponseInterceptor padroniza formato
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new ResponseInterceptor());

  const port = configService.get('PORT', { infer: true }) || 3000;
  await app.listen(port);
  logger.log(`CraftCard API running on port ${port}`);
}

bootstrap();
