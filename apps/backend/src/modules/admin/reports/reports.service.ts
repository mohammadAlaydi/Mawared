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
   * Branch managers are silently scoped to their own branch.
   */
  async overview(actor: AuthUser, requestedBranchId?: string) {
    const branchId = this.effectiveBranch(actor, requestedBranchId);
    const branchClauseOrder = branchId
      ? Prisma.sql`AND o."branchId" = ${branchId}::uuid`
      : Prisma.empty;
    const branchClauseWorker = branchId
      ? Prisma.sql`AND "branchId" = ${branchId}::uuid`
      : Prisma.empty;

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setUTCHours(0, 0, 0, 0);
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setUTCDate(startOfYesterday.getUTCDate() - 1);
    const startOfDayBefore = new Date(startOfYesterday);
    startOfDayBefore.setUTCDate(startOfDayBefore.getUTCDate() - 1);
    const thirtyDaysAgo = new Date(startOfToday);
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);

    type RevenueRow = { currency: string; minor: bigint };
    const [yesterdayRevenue, dayBeforeRevenue, last30Series] = await Promise.all([
      this.prisma.$queryRaw<RevenueRow[]>(Prisma.sql`
        SELECT o.currency, COALESCE(SUM(o."totalMinor"), 0)::bigint AS minor
        FROM "Order" o
        WHERE o."deletedAt" IS NULL
          AND o.status::text IN ('PAID','UNDER_REVIEW','CONFIRMED','IN_PROGRESS','COMPLETED')
          AND o."createdAt" >= ${startOfYesterday}
          AND o."createdAt" <  ${startOfToday}
          ${branchClauseOrder}
        GROUP BY o.currency
      `),
      this.prisma.$queryRaw<RevenueRow[]>(Prisma.sql`
        SELECT o.currency, COALESCE(SUM(o."totalMinor"), 0)::bigint AS minor
        FROM "Order" o
        WHERE o."deletedAt" IS NULL
          AND o.status::text IN ('PAID','UNDER_REVIEW','CONFIRMED','IN_PROGRESS','COMPLETED')
          AND o."createdAt" >= ${startOfDayBefore}
          AND o."createdAt" <  ${startOfYesterday}
          ${branchClauseOrder}
        GROUP BY o.currency
      `),
      this.prisma.$queryRaw<{ day: Date; currency: string; minor: bigint }[]>(Prisma.sql`
        SELECT date_trunc('day', o."createdAt") AS day,
               o.currency,
               COALESCE(SUM(o."totalMinor"), 0)::bigint AS minor
        FROM "Order" o
        WHERE o."deletedAt" IS NULL
          AND o.status::text IN ('PAID','UNDER_REVIEW','CONFIRMED','IN_PROGRESS','COMPLETED')
          AND o."createdAt" >= ${thirtyDaysAgo}
          AND o."createdAt" <  ${startOfToday}
          ${branchClauseOrder}
        GROUP BY 1, 2
        ORDER BY 1 ASC
      `),
    ]);

    type StatusRow = { status: string; n: bigint };
    const ordersByStatus = await this.prisma.$queryRaw<StatusRow[]>(Prisma.sql`
      SELECT o.status::text AS status, COUNT(*)::bigint AS n
      FROM "Order" o
      WHERE o."deletedAt" IS NULL
        ${branchClauseOrder}
      GROUP BY o.status
    `);

    type WorkerRow = { availability: string; n: bigint };
    const workersByAvailability = await this.prisma.$queryRaw<WorkerRow[]>(Prisma.sql`
      SELECT availability::text AS availability, COUNT(*)::bigint AS n
      FROM "Worker"
      WHERE "deletedAt" IS NULL
        ${branchClauseWorker}
      GROUP BY availability
    `);

    const newCustomers30d = await this.prisma.customer.count({
      where: { user: { createdAt: { gte: thirtyDaysAgo } } },
    });

    const recentOrders = await this.prisma.order.findMany({
      where: {
        deletedAt: null,
        ...(branchId ? { branchId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        status: true,
        currency: true,
        totalMinor: true,
        createdAt: true,
        customer: {
          select: {
            firstName: true,
            lastName: true,
            user: { select: { phoneE164: true } },
          },
        },
      },
    });

    return {
      branchId: branchId ?? null,
      revenue: {
        yesterday: yesterdayRevenue.map((r) => ({
          currency: r.currency,
          minor: r.minor.toString(),
        })),
        dayBefore: dayBeforeRevenue.map((r) => ({
          currency: r.currency,
          minor: r.minor.toString(),
        })),
        last30Days: last30Series.map((r) => ({
          day: r.day,
          currency: r.currency,
          minor: r.minor.toString(),
        })),
      },
      ordersByStatus: ordersByStatus.map((r) => ({
        status: r.status,
        count: Number(r.n),
      })),
      workersByAvailability: workersByAvailability.map((r) => ({
        availability: r.availability,
        count: Number(r.n),
      })),
      newCustomers30d,
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        status: o.status,
        currency: o.currency,
        totalMinor: o.totalMinor.toString(),
        createdAt: o.createdAt,
        customerName:
          [o.customer?.firstName, o.customer?.lastName].filter(Boolean).join(' ') || null,
        customerPhone: o.customer?.user?.phoneE164 ?? null,
      })),
    };
  }

  /**
   * Worker fleet breakdown for the dashboard: counts by availability status
   * and by nationality. Branch managers are scoped to their branch.
   */
  async activeWorkers(actor: AuthUser, requestedBranchId?: string) {
    const branchId = this.effectiveBranch(actor, requestedBranchId);
    const branchClause = branchId
      ? Prisma.sql`AND w."branchId" = ${branchId}::uuid`
      : Prisma.empty;

    type AvailRow = { availability: string; n: bigint };
    const byAvailability = await this.prisma.$queryRaw<AvailRow[]>(Prisma.sql`
      SELECT w.availability::text AS availability, COUNT(*)::bigint AS n
      FROM "Worker" w
      WHERE w."deletedAt" IS NULL
        ${branchClause}
      GROUP BY w.availability
    `);

    type NationalityRow = {
      nationality_id: string;
      code: string;
      name_ar: string;
      name_en: string;
      flag: string;
      n: bigint;
    };
    const byNationality = await this.prisma.$queryRaw<NationalityRow[]>(Prisma.sql`
      SELECT w."nationalityId" AS nationality_id,
             n.code            AS code,
             n."nameAr"        AS name_ar,
             n."nameEn"        AS name_en,
             n."flagEmoji"     AS flag,
             COUNT(*)::bigint  AS n
      FROM "Worker" w
      JOIN "Nationality" n ON n.id = w."nationalityId"
      WHERE w."deletedAt" IS NULL
        ${branchClause}
      GROUP BY w."nationalityId", n.code, n."nameAr", n."nameEn", n."flagEmoji"
      ORDER BY n DESC
    `);

    const total = byAvailability.reduce((sum, r) => sum + Number(r.n), 0);

    return {
      branchId: branchId ?? null,
      total,
      byAvailability: byAvailability.map((r) => ({
        availability: r.availability,
        count: Number(r.n),
      })),
      byNationality: byNationality.map((r) => ({
        nationalityId: r.nationality_id,
        code: r.code,
        nameAr: r.name_ar,
        nameEn: r.name_en,
        flagEmoji: r.flag,
        count: Number(r.n),
      })),
    };
  }

  private effectiveBranch(actor: AuthUser, requested?: string): string | undefined {
    if (actor.role === 'BRANCH_MANAGER') return actor.branchId;
    return requested;
  }
}
