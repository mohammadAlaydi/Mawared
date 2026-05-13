import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request } from 'express';
import { randomUUID } from 'node:crypto';
import { Observable } from 'rxjs';

/**
 * Ensures every request has a stable `x-request-id` for log correlation.
 * Pino's `genReqId` also sets it; this interceptor is the belt to that
 * suspenders so non-HTTP entry points still get correlated IDs.
 */
@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { id?: string }>();
    if (req && !req.id) {
      const incoming = req.headers['x-request-id'];
      req.id = typeof incoming === 'string' && incoming.length > 0 ? incoming : randomUUID();
    }
    return next.handle();
  }
}
