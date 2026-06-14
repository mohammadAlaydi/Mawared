import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/shared/prisma/prisma.service';
import type { AuthUser } from '@/common/decorators/current-user.decorator';

/**
 * Derived, real-time activity feed for the admin dashboard notification bell.
 *
 * There is no separate "admin notification" table — admins are interested in
 * *business events*, not stored messages. So we synthesise the feed from live
 * data the moment it's requested: new website leads, orders awaiting review,
 * freshly paid orders, new customer sign-ups, and identity verifications that
 * are mid-flight. Every item carries the real contact details (name, phone,
 * e-mail) so staff can act without drilling in.
 *
 * Read/unread state is intentionally NOT stored here. The feed is ephemeral and
 * idempotent (item ids are stable `${type}:${entityId}` keys), so the dashboard
 * tracks which ids the operator has already seen client-side. That keeps this
 * endpoint a pure, cache-friendly read with no migration footprint.
 */

const PER_SOURCE = 10;
const MAX_ITEMS = 25;
const NEW_CUSTOMER_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const LEAD_PREVIEW_CHARS = 140;

export type AdminNotificationType =
  | 'LEAD'
  | 'ORDER_REVIEW'
  | 'ORDER_PAID'
  | 'CUSTOMER_NEW'
  | 'VERIFICATION_PENDING';

export interface AdminNotificationItem {
  /** Stable across requests: `${type}:${entityId}`. Used for client read-state. */
  id: string;
  type: AdminNotificationType;
  titleAr: string;
  descriptionAr: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  /** Dashboard route to open on click, or null for purely informational items. */
  href: string | null;
  entityId: string;
  createdAt: string;
}

export interface AdminNotificationsResponse {
  items: AdminNotificationItem[];
  generatedAt: string;
}

const ORDER_SELECT = {
  id: true,
  orderNumber: true,
  status: true,
  totalMinor: true,
  currency: true,
  createdAt: true,
  customer: {
    select: {
      firstName: true,
      lastName: true,
      user: { select: { phoneE164: true, email: true } },
    },
  },
} satisfies Prisma.OrderSelect;

@Injectable()
export class AdminNotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForAdmin(actor: AuthUser): Promise<AdminNotificationsResponse> {
    // Branch managers only see orders for their own branch. Leads, customers,
    // and verifications are org-wide concerns and stay unscoped.
    const branchId = actor.role === 'BRANCH_MANAGER' ? actor.branchId : undefined;
    const branchFilter = branchId ? { branchId } : {};
    const newCustomerSince = new Date(Date.now() - NEW_CUSTOMER_WINDOW_MS);

    const [leads, reviewOrders, paidOrders, newCustomers, pendingVerifications] = await Promise.all(
      [
        this.prisma.lead.findMany({
          where: { status: 'NEW' },
          orderBy: { createdAt: 'desc' },
          take: PER_SOURCE,
          select: {
            id: true,
            fullName: true,
            phoneE164: true,
            email: true,
            message: true,
            createdAt: true,
          },
        }),
        this.prisma.order.findMany({
          where: { deletedAt: null, status: 'UNDER_REVIEW', ...branchFilter },
          orderBy: { createdAt: 'desc' },
          take: PER_SOURCE,
          select: ORDER_SELECT,
        }),
        this.prisma.order.findMany({
          where: { deletedAt: null, status: 'PAID', ...branchFilter },
          orderBy: { createdAt: 'desc' },
          take: PER_SOURCE,
          select: ORDER_SELECT,
        }),
        this.prisma.user.findMany({
          where: { role: 'CUSTOMER', deletedAt: null, createdAt: { gte: newCustomerSince } },
          orderBy: { createdAt: 'desc' },
          take: PER_SOURCE,
          select: {
            id: true,
            phoneE164: true,
            email: true,
            createdAt: true,
            customer: { select: { firstName: true, lastName: true } },
          },
        }),
        this.prisma.customer.findMany({
          // DB enum is PENDING (Signit session initiated, awaiting callback).
          where: { verificationStatus: 'PENDING' },
          orderBy: { verificationLastCheckedAt: 'desc' },
          take: PER_SOURCE,
          select: {
            userId: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            verificationLastCheckedAt: true,
            user: { select: { phoneE164: true, email: true } },
          },
        }),
      ],
    );

    const items: AdminNotificationItem[] = [];

    for (const lead of leads) {
      const preview = lead.message.trim().slice(0, LEAD_PREVIEW_CHARS);
      items.push({
        id: `LEAD:${lead.id}`,
        type: 'LEAD',
        titleAr: 'استفسار جديد من الموقع',
        descriptionAr: preview.length ? preview : null,
        customerName: lead.fullName,
        customerPhone: lead.phoneE164,
        customerEmail: lead.email,
        href: null,
        entityId: lead.id,
        createdAt: lead.createdAt.toISOString(),
      });
    }

    for (const order of reviewOrders) {
      items.push(this.orderItem(order, 'ORDER_REVIEW', 'طلب بانتظار المراجعة'));
    }

    for (const order of paidOrders) {
      items.push(this.orderItem(order, 'ORDER_PAID', 'طلب جديد مدفوع'));
    }

    for (const user of newCustomers) {
      items.push({
        id: `CUSTOMER_NEW:${user.id}`,
        type: 'CUSTOMER_NEW',
        titleAr: 'عميل جديد',
        descriptionAr: null,
        customerName: fullName(user.customer?.firstName, user.customer?.lastName),
        customerPhone: user.phoneE164,
        customerEmail: user.email,
        href: '/dashboard/customers',
        entityId: user.id,
        createdAt: user.createdAt.toISOString(),
      });
    }

    for (const customer of pendingVerifications) {
      const at = customer.verificationLastCheckedAt ?? customer.createdAt;
      items.push({
        id: `VERIFICATION_PENDING:${customer.userId}`,
        type: 'VERIFICATION_PENDING',
        titleAr: 'توثيق هوية قيد المعالجة',
        descriptionAr: null,
        customerName: fullName(customer.firstName, customer.lastName),
        customerPhone: customer.user?.phoneE164 ?? null,
        customerEmail: customer.user?.email ?? null,
        href: '/dashboard/customers',
        entityId: customer.userId,
        createdAt: at.toISOString(),
      });
    }

    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return {
      items: items.slice(0, MAX_ITEMS),
      generatedAt: new Date().toISOString(),
    };
  }

  private orderItem(
    order: Prisma.OrderGetPayload<{ select: typeof ORDER_SELECT }>,
    type: AdminNotificationType,
    titleAr: string,
  ): AdminNotificationItem {
    return {
      id: `${type}:${order.id}`,
      type,
      titleAr,
      descriptionAr: `${order.orderNumber} · ${formatMinor(order.totalMinor, order.currency)}`,
      customerName: fullName(order.customer?.firstName, order.customer?.lastName),
      customerPhone: order.customer?.user?.phoneE164 ?? null,
      customerEmail: order.customer?.user?.email ?? null,
      href: '/dashboard/orders',
      entityId: order.id,
      createdAt: order.createdAt.toISOString(),
    };
  }
}

function fullName(first?: string | null, last?: string | null): string | null {
  const name = [first, last].filter(Boolean).join(' ').trim();
  return name.length ? name : null;
}

/** Minor units (halalas) → "1,250 SAR" style label. Display only. */
function formatMinor(minor: bigint, currency: string): string {
  const major = Number(minor) / 100;
  return `${major.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${currency}`;
}
