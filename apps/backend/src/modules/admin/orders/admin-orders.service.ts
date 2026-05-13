import { HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { ERROR_CODES } from '@mawared/shared-types';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { OrdersService } from '@/modules/orders/orders.service';
import { buildPage, type Paged } from '@/common/pagination';
import {
  PAYMENT_PROVIDER,
  type PaymentProvider,
} from '@/modules/payments/payment-provider';
import type { OrderEvent } from '@/modules/orders/order.entity';
import type { AuthUser } from '@/common/decorators/current-user.decorator';
import type { ListAdminOrdersDto } from './dto/list-admin-orders.dto';
import type { AdminTransitionOrderDto } from './dto/transition-order.dto';
import type { RefundOrderDto } from './dto/refund-order.dto';

@Injectable()
export class AdminOrdersService {
  private readonly logger = new Logger(AdminOrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
    @Inject(PAYMENT_PROVIDER) private readonly payments: PaymentProvider,
  ) {}

  async list(q: ListAdminOrdersDto, actor: AuthUser): Promise<Paged<unknown>> {
    const where: Prisma.OrderWhereInput = {
      deletedAt: null,
      ...(q.status && { status: q.status }),
      ...(this.branchScope(actor, q.branchId) && {
        branchId: this.branchScope(actor, q.branchId)!,
      }),
      ...(q.customerPhone && {
        customer: { user: { phoneE164: q.customerPhone } },
      }),
      ...((q.from || q.to) && {
        createdAt: {
          ...(q.from && { gte: q.from }),
          ...(q.to && { lte: q.to }),
        },
      }),
    };

    const rows = await this.prisma.order.findMany({
      where,
      take: q.limit + 1,
      ...(q.cursor && { cursor: { id: q.cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { include: { user: { select: { phoneE164: true } } } },
        worker: { select: { id: true, fullNameAr: true, fullNameEn: true } },
        package: { select: { id: true, nameAr: true, nameEn: true, type: true } },
        branch: { select: { id: true, code: true } },
      },
    });
    return buildPage(rows, q.limit);
  }

  async findOne(id: string, actor: AuthUser) {
    const order = await this.prisma.order.findFirst({
      where: { id, deletedAt: null, ...this.branchFilter(actor) },
      include: {
        customer: { include: { user: { select: { id: true, phoneE164: true } } } },
        worker: true,
        package: true,
        address: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        paymentIntents: { orderBy: { createdAt: 'desc' } },
        refunds: { orderBy: { createdAt: 'desc' } },
        contract: true,
      },
    });
    if (!order) {
      throw new HttpException(
        { code: ERROR_CODES.ORDER_NOT_FOUND, message: 'Order not found.' },
        HttpStatus.NOT_FOUND,
      );
    }
    return order;
  }

  async transition(id: string, body: AdminTransitionOrderDto, actor: AuthUser) {
    await this.findOne(id, actor); // scope check
    const event = this.buildEvent(body.event, actor.id);
    return this.orders.transition(id, event, {
      type: 'STAFF',
      id: actor.id,
      note: body.note,
    });
  }

  async refund(id: string, body: RefundOrderDto, actor: AuthUser) {
    const order = await this.findOne(id, actor);
    if (order.status !== 'PAID' && order.status !== 'CONFIRMED' &&
        order.status !== 'IN_PROGRESS' && order.status !== 'UNDER_REVIEW') {
      throw new HttpException(
        {
          code: ERROR_CODES.ORDER_INVALID_TRANSITION,
          message: `Order in ${order.status} cannot be refunded.`,
        },
        HttpStatus.CONFLICT,
      );
    }

    // Use the most recent SUCCEEDED PaymentIntent.
    const pi = order.paymentIntents.find((p) => p.status === 'SUCCEEDED');
    if (!pi) {
      throw new HttpException(
        { code: ERROR_CODES.PAYMENT_INTENT_NOT_FOUND, message: 'No captured payment to refund.' },
        HttpStatus.CONFLICT,
      );
    }
    const refundAmount = body.amountMinor ?? pi.amountMinor;
    const idempotencyKey = `refund:${id}:${Date.now()}`;
    const result = await this.payments.refund({
      providerIntentId: pi.stripeIntentId,
      amountMinor: refundAmount,
      reason: body.reason,
      idempotencyKey,
    });
    await this.prisma.refund.create({
      data: {
        orderId: id,
        paymentIntentId: pi.id,
        stripeRefundId: result.providerRefundId,
        amountMinor: refundAmount,
        currency: pi.currency,
        reason: body.reason ?? null,
        initiatedById: actor.id,
        status: result.status,
        succeededAt: result.status === 'SUCCEEDED' ? new Date() : null,
      },
    });
    // Drive the order to REFUNDED via the state machine.
    await this.orders.transition(
      id,
      { type: 'cancel', actor: 'staff' },
      { type: 'STAFF', id: actor.id, note: body.reason ?? 'staff refund' },
    );
    return { refundId: result.providerRefundId, status: result.status };
  }

  // ---------- helpers ----------

  private buildEvent(eventType: AdminTransitionOrderDto['event'], staffId: string): OrderEvent {
    switch (eventType) {
      case 'submitForReview': return { type: 'submitForReview' };
      case 'confirm':         return { type: 'confirm', staffId };
      case 'startService':    return { type: 'startService', staffId };
      case 'complete':        return { type: 'complete', staffId };
      case 'cancel':          return { type: 'cancel', actor: 'staff' };
    }
  }

  /** Branch managers see their branch only; super-admins see everything. */
  private branchScope(actor: AuthUser, requested?: string): string | undefined {
    if (actor.role === 'BRANCH_MANAGER') return actor.branchId;
    return requested;
  }

  private branchFilter(actor: AuthUser): Prisma.OrderWhereInput {
    if (actor.role === 'BRANCH_MANAGER' && actor.branchId) {
      return { branchId: actor.branchId };
    }
    return {};
  }
}
