import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import type { Request } from 'express';
import { AuditService } from '@/shared/audit/audit.service';
import { AUDIT_KEY, type AuditMeta } from '@/common/decorators/audit.decorator';
import type { AuthUser } from '@/common/decorators/current-user.decorator';

/**
 * Writes an AuditLog row after a successful response. Wired per-controller
 * via `@UseInterceptors(AuditInterceptor)` + `@Audit({...})` on the method.
 *
 * For now we capture `after` as the response body. `before` is left null —
 * callers that need before/after diffs should call AuditService.write()
 * directly inside the service with both snapshots.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly audit: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const meta = this.reflector.get<AuditMeta | undefined>(AUDIT_KEY, context.getHandler());
    if (!meta) return next.handle();

    const req = context.switchToHttp().getRequest<
      Request & { id?: string; user?: AuthUser }
    >();
    const user = req.user;
    const entityIdFrom = meta.entityIdFrom ?? 'param';
    const entityIdKey = meta.entityIdKey ?? 'id';
    const source: Record<string, unknown> =
      entityIdFrom === 'param'
        ? ((req.params as Record<string, unknown>) ?? {})
        : ((req.body as Record<string, unknown>) ?? {});
    const entityId = String(source[entityIdKey] ?? '');

    return next.handle().pipe(
      tap((response) => {
        if (!entityId) {
          this.logger.warn({ action: meta.action, meta }, 'audit: entityId missing — skipping');
          return;
        }
        void this.audit.write({
          actorType: user ? 'STAFF' : 'SYSTEM',
          actorId: user?.id ?? null,
          action: meta.action,
          entityType: meta.entityType,
          entityId,
          after: response ?? null,
          requestId: (req.id as string | undefined) ?? null,
          ipAddress: req.ip ?? null,
          userAgent: (req.headers['user-agent'] as string | undefined) ?? null,
        });
      }),
    );
  }
}
