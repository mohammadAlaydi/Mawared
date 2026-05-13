import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import { Logger as PinoLogger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';
import { AppModule } from './app.module';
import type { Env } from './shared/config/env.schema';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(PinoLogger));

  const config = app.get(ConfigService<Env, true>);
  const env = config.get('NODE_ENV', { infer: true });
  const port = config.get('PORT', { infer: true });
  const corsOrigins = config.get('CORS_ORIGINS', { infer: true });
  const sentryDsn = config.get('SENTRY_DSN', { infer: true });

  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment: config.get('SENTRY_ENVIRONMENT', { infer: true }),
      tracesSampleRate: env === 'production' ? 0.1 : 1.0,
    });
  }

  app.use(helmet());
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    exposedHeaders: ['x-request-id'],
  });
  app.enableShutdownHooks();

  // URI versioning: /v1/...
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // OpenAPI / Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Mawared International API')
    .setDescription('Backend API for the Mawared mobile app, admin dashboard, and website.')
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('v1/docs', app, document);

  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`[mawared-api] listening on http://0.0.0.0:${port} (env=${env})`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[mawared-api] failed to bootstrap', err);
  process.exit(1);
});
