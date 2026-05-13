/* eslint-disable no-console */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from '../src/app.module';

/**
 * Regenerates openapi.json from the live Nest app. Run in CI: any drift
 * between the running code and the committed file fails the build.
 *
 *   pnpm --filter @mawared/backend openapi:generate
 */
async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });
  const config = new DocumentBuilder()
    .setTitle('Mawared International API')
    .setDescription('Backend API for the Mawared mobile app, admin dashboard, and website.')
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  const out = join(__dirname, '..', 'openapi.json');
  writeFileSync(out, JSON.stringify(document, null, 2));
  console.log(`[openapi] wrote ${out}`);
  await app.close();
}

main().catch((err) => {
  console.error('[openapi] failed', err);
  process.exit(1);
});
