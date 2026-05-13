import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app.module';

/**
 * Worker process bootstrap. Shares the same modules as the API but runs as a
 * standalone application (no HTTP listener). BullMQ consumer wiring lands in
 * M2 — for M0 this just boots, logs "ready", and stays alive for healthcheck.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { bufferLogs: true });
  app.useLogger(app.get(PinoLogger));
  app.enableShutdownHooks();
  const logger = app.get(PinoLogger);
  logger.log({ event: 'worker.ready' }, 'Mawared worker process ready');

  // Keep the process alive until SIGTERM / SIGINT.
  process.on('SIGTERM', () => app.close().then(() => process.exit(0)));
  process.on('SIGINT', () => app.close().then(() => process.exit(0)));
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[mawared-worker] failed to bootstrap', err);
  process.exit(1);
});
