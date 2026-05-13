import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ERROR_CODES } from '@mawared/shared-types';
import { createHash } from 'node:crypto';
import { Observable, from, of, switchMap, tap } from 'rxjs';
import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/shared/prisma/prisma.service';
import type { AuthUser } from '@/common/decorators/current-user.decorator';

export const IDEMPOTENT_KEY = 'isIdempotent';

/**
 * Looks for the `Idempotency-Key` header on opted-in endpoints. If the key
 * + user + request hash matches a previous successful response, replay it.
 * If the key is reused with a different body, return 409.
 *
 * TTL is 24h (cleanup via cron).
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const required = this.reflector.getAllAndOverride<boolean>(IDEMPOTENT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return next.handle();

    const req = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const res = context.switchToHttp().getResponse<Response>();
    const header = req.headers['idempotency-key'];
    const key = typeof header === 'string' ? header.trim() : '';
    const userId = req.user?.id;

    if (!key || !userId) {
      // No key or no auth — let the request through without caching.
      return next.handle();
    }

    const bodyHash = this.hashBody(req.body);

    return from(this.prisma.idempotencyKey.findUnique({ where: { key_userId: { key, userId } } }))
      .pipe(
        switchMap((existing) => {
          if (existing) {
            if (existing.expiresAt < new Date()) {
              return from(
                this.prisma.idempotencyKey.delete({
                  where: { key_userId: { key, userId } },
                }),
              ).pipe(switchMap(() => this.executeAndStore(next, key, userId, bodyHash, res)));
            }
            if (existing.requestHash !== bodyHash) {
              throw new HttpException(
                {
                  code: ERROR_CODES.IDEMPOTENCY_KEY_CONFLICT,
                  message:
                    'Idempotency-Key was reused with a different request body.',
                },
                HttpStatus.CONFLICT,
              );
            }
            res.status(existing.statusCode);
            return of(existing.responseBody);
          }
          return this.executeAndStore(next, key, userId, bodyHash, res);
        }),
      );
  }

  private executeAndStore(
    next: CallHandler,
    key: string,
    userId: string,
    requestHash: string,
    res: Response,
  ): Observable<unknown> {
    return next.handle().pipe(
      tap((response) => {
        const statusCode = res.statusCode || HttpStatus.OK;
        this.prisma.idempotencyKey
          .create({
            data: {
              key,
              userId,
              requestHash,
              responseBody: (response ?? null) as Prisma.InputJsonValue,
              statusCode,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
          })
          .catch((err) => this.logger.warn({ err }, 'idempotency persist failed (non-fatal)'));
      }),
    );
  }

  private hashBody(body: unknown): string {
    const normalized = JSON.stringify(body ?? {}, Object.keys((body ?? {}) as object).sort());
    return createHash('sha256').update(normalized).digest('hex');
  }
}
