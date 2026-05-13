import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit';

export interface AuditMeta {
  action: string;
  entityType: string;
  /**
   * Param/body key holding the entityId.
   * Default: `id` (works for routes like `:id`).
   */
  entityIdFrom?: 'param' | 'body';
  entityIdKey?: string;
}

/**
 * Attach to an admin controller method. The AuditInterceptor will write an
 * AuditLog row after the method returns successfully.
 */
export const Audit = (meta: AuditMeta): MethodDecorator => SetMetadata(AUDIT_KEY, meta);
