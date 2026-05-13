import 'reflect-metadata';
// Mark this process as a worker BEFORE any module loads — consumers check
// this to decide whether to spin up BullMQ Workers.
process.env.MAWARED_PROCESS = 'worker';

import { NestFactory } from '@nestjs/core';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app.module';

/**
 * Worker process bootstrap. Shares the same modules as the API but runs as a
 * standalone application context (no HTTP listener). BullMQ consumers
 * (e.g. ReservationExpiryConsumer) gate themselves on MAWARED_PROCESS === 'worker'
 * so they only run here.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { bufferLogs: true });
  app.useLogger(app.get(PinoLogger));
  app.enableShutdownHooks();
  const logger = app.get(PinoLogger);
  logger.log({ event: 'worker.ready' }, 'Mawared worker process ready');

  process.on('SIGTERM', () => app.close().then(() => process.exit(0)));
  process.on('SIGINT', () => app.close().then(() => process.exit(0)));
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[mawared-worker] failed to bootstrap', err);
  process.exit(1);
});
