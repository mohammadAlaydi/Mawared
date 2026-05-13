import { Global, Injectable, Logger, Module } from '@nestjs/common';
import type { AuditActorType, Prisma } from '@prisma/client';
import { PrismaService } from '@/shared/prisma/prisma.service';

export interface WriteAuditInput {
  actorType: AuditActorType;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  requestId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async write(input: WriteAuditInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorType: input.actorType,
          actorId: input.actorId ?? null,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          before: (input.before ?? null) as Prisma.InputJsonValue,
          after: (input.after ?? null) as Prisma.InputJsonValue,
          requestId: input.requestId ?? null,
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null,
        },
      });
    } catch (err) {
      // Never let audit failure break the user-facing request.
      this.logger.warn({ err, input }, 'audit log write failed (non-fatal)');
    }
  }

  async query(filters: {
    entityType?: string;
    entityId?: string;
    actorId?: string;
    action?: string;
    from?: Date;
    to?: Date;
    limit?: number;
  }) {
    const items = await this.prisma.auditLog.findMany({
      where: {
        ...(filters.entityType && { entityType: filters.entityType }),
        ...(filters.entityId && { entityId: filters.entityId }),
        ...(filters.actorId && { actorId: filters.actorId }),
        ...(filters.action && { action: filters.action }),
        ...((filters.from || filters.to) && {
          createdAt: {
            ...(filters.from && { gte: filters.from }),
            ...(filters.to && { lte: filters.to }),
          },
        }),
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(filters.limit ?? 50, 200),
    });
    return { items };
  }
}

@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
