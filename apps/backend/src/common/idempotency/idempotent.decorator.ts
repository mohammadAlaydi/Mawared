import { SetMetadata } from '@nestjs/common';
import { IDEMPOTENT_KEY } from './idempotency.interceptor';

/** Marks an endpoint as idempotent — the IdempotencyInterceptor caches its
 *  responses by `Idempotency-Key` header for 24h. */
export const Idempotent = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IDEMPOTENT_KEY, true);
