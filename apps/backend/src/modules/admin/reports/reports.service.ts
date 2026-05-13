import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/shared/prisma/prisma.service';
import type { AuthUser } from '@/common/decorators/current-user.decorator';
import type { ReportsQueryDto } from './dto/reports-query.dto';

/**
 * Aggregated reports for the admin dashboard. We use `$queryRaw` (via the
 * tagged-template `Prisma.sql` helper) instead of `groupBy` so the queries
 * are explicit, fast, and easy to audit. Branch managers are silently
 * scoped to their branch.
 */
@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async revenue(q: ReportsQueryDto, actor: AuthUser) {
    const branchId = this.effectiveBranch(actor, q.branchId);
    const branchClause = branchId
      ? Prisma.sql`AND "branchId" = ${branchId}::uuid`
      : Prisma.empty;

    type Row = {
      day: Date;
      currency: string;
      gross_minor: bigint;
      net_minor: bigint;
      order_count: bigint;
    };

    const rows = await this.prisma.$queryRaw<Row[]>(Prisma.sql`
      SELECT
        date_trunc('day', "createdAt") AS day,
        currency,
        SUM("totalMinor")::bigint                                              AS gross_minor,
        SUM(CASE WHEN status = 'REFUNDED' THEN 0 ELSE "totalMinor" END)::bigint AS net_minor,
        COUNT(*)::bigint                                                       AS order_count
      FROM "Order"
      WHERE "deletedAt" IS NULL
        AND status::text IN ('PAID','UNDER_REVIEW','CONFIRMED','IN_PROGRESS','COMPLETED','REFUNDED')
        AND "createdAt" >= ${q.from}
        AND "createdAt" <  ${q.to}
        ${branchClause}
      GROUP BY 1, 2
      ORDER BY 1 ASC
    `);

    return {
      from: q.from,
      to: q.to,
      branchId: branchId ?? null,
      items: rows.map((r) => ({
        day: r.day,
        currency: r.currency,
        grossMinor: r.gross_minor.toString(),
        netMinor: r.net_minor.toString(),
        orderCount: Number(r.order_count),
      })),
    };
  }

  async ordersByStatus(q: ReportsQueryDto, actor: AuthUser) {
    const branchId = this.effectiveBranch(actor, q.branchId);
    const branchClause = branchId
      ? Prisma.sql`AND "branchId" = ${branchId}::uuid`
      : Prisma.empty;

    type Row = { status: string; n: bigint };
    const rows = await this.prisma.$queryRaw<Row[]>(Prisma.sql`
      SELECT status::text AS status, COUNT(*)::bigint AS n
      FROM "Order"
      WHERE "deletedAt" IS NULL
        AND "createdAt" >= ${q.from}
        AND "createdAt" <  ${q.to}
        ${branchClause}
      GROUP BY status
      ORDER BY n DESC
    `);
    return {
      from: q.from,
      to: q.to,
      branchId: branchId ?? null,
      items: rows.map((r) => ({ status: r.status, count: Number(r.n) })),
    };
  }

  async refunds(q: ReportsQueryDto, actor: AuthUser) {
    const branchId = this.effectiveBranch(actor, q.branchId);
    const branchClause = branchId
      ? Prisma.sql`AND o."branchId" = ${branchId}::uuid`
      : Prisma.empty;

    type Row = {
      currency: string;
      refund_count: bigint;
      refund_minor: bigint;
      total_paid_orders: bigint;
    };
    const rows = await this.prisma.$queryRaw<Row[]>(Prisma.sql`
      SELECT
        o.currency,
        COUNT(r.id)::bigint                                  AS refund_count,
        COALESCE(SUM(r."amountMinor"),0)::bigint             AS refund_minor,
        SUM(CASE WHEN o.status::text IN ('PAID','UNDER_REVIEW','CONFIRMED','IN_PROGRESS','COMPLETED','REFUNDED') THEN 1 ELSE 0 END)::bigint AS total_paid_orders
      FROM "Order" o
      LEFT JOIN "Refund" r
        ON r."orderId" = o.id AND r.status = 'SUCCEEDED'
      WHERE o."deletedAt" IS NULL
        AND o."createdAt" >= ${q.from}
        AND o."createdAt" <  ${q.to}
        ${branchClause}
      GROUP BY o.currency
    `);
    return {
      from: q.from,
      to: q.to,
      branchId: branchId ?? null,
      items: rows.map((r) => {
        const total = Number(r.total_paid_orders);
        const refunded = Number(r.refund_count);
        return {
          currency: r.currency,
          refundCount: refunded,
          refundMinor: r.refund_minor.toString(),
          totalPaidOrders: total,
          refundRate: total > 0 ? refunded / total : 0,
        };
      }),
    };
  }

  /**
   * Single-call rollup feeding the admin dashboard homepage. Combines:
   *  - revenue (yesterday vs day-before-yesterday delta + 30-day series)
   *  - order counts by status
   *  - worker availability counts
   *  - new customer count (last 30d)
   *  - 10 most recent orders
   *
   * Branch managers a