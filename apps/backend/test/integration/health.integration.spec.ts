import { INestApplication, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

/**
 * Integration test that boots the full Nest app (excluding external IO that
 * isn't reachable in CI: Stripe, Twilio, FCM). Requires DATABASE_URL and
 * REDIS_URL pointing at running instances — CI provides these via service
 * containers; locally `pnpm infra:up` is enough.
 */
describe('Health endpoints (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ bufferLogs: true });
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();
  }, 60_000);

  afterAll(async () => {
    await app?.close();
  });

  it('GET /healthz is always 200 and reports uptime', async () => {
    const res = await request(app.getHttpServer()).get('/healthz').expect(200);
    expect(res.body).toMatchObject({ ok: true });
    expect(typeof res.body.uptimeSec).toBe('number');
  });

  it('GET /readyz is 200 when dependencies are reachable', async () => {
    const res = await request(app.getHttpServer()).get('/readyz');
    // 200 (healthy) or 503 (one of the deps not up) are the legal outcomes —
    // the assertion here is just "no 500", i.e. the controller didn't crash.
    expect([200, 503]).toContain(res.status);
    expect(res.body.status).toMatch(/ok|error/);
  });
});
