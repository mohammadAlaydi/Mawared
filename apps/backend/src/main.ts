import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import { Logger as PinoLogger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';
import express, { type Request } from 'express';
import { AppModule } from './app.module';
import type { Env } from './shared/config/env.schema';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });
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

  // Webhooks need the raw body to verify signatures (Stripe, Signit). Carve
  // each path out before Nest's JSON body parser fires.
  const rawJson = express.raw({ type: 'application/json' });
  const rawBodyHandler = (req: Request, res: import('express').Response, next: import('express').NextFunction): void => {
    rawJson(req, res, (err) => {
      if (err) return next(err);
      (req as Request & { rawBody?: Buffer }).rawBody = req.body as Buffer;
      try {
        if (Buffer.isBuffer(req.body)) {
          req.body = JSON.parse(req.body.toString('utf8'));
        }
      } catch {
        // leave req.body as the raw buffer; controller will fail validation
      }
      next();
    });
  };
  app.use('/v1/payments/webhooks/stripe', rawBodyHandler);
  app.use('/v1/verifications/webhooks/signit', rawBodyHandler);

  app.use(helmet());
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    exposedHeaders: ['x-request-id'],
  });
  app.enableShutdownHooks();

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

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
