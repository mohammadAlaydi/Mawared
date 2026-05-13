import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ERROR_CODES } from '@mawared/shared-types';
import { Prisma, type PaymentStatus } from '@prisma/client';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { OrdersService } from '@/modules/orders/orders.service';
import {
  PAYMENT_PROVIDER,
  type PaymentProvider,
  type ProviderIntentStatus,
} from './payment-provider';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
  ) {}

  async createIntentForOrder(customerId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, customerId, deletedAt: null },
      select: {
        id: true,
        status: true,
        totalMinor: true,
        currency: true,
      },
    });
    if (!order) {
      throw new HttpException(
        { code: ERROR_CODES.ORDER_NOT_FOUND, message: 'Order not found.' },
        HttpStatus.NOT_FOUND,
      );
    }
    if (order.status !== 'RESERVED' && order.status !== 'PAYMENT_FAILED') {
      throw new HttpException(
        {
          code: ERROR_CODES.ORDER_INVALID_TRANSITION,
          message: `Order is not awaiting payment (status=${order.status}).`,
        },
        HttpStatus.CONFLICT,
      );
    }

    const idempotencyKey = `pi:${order.id}:${Date.now()}`;
    const intent = await this.provider.createIntent({
      orderId: order.id,
      amountMinor: order.totalMinor,
      currency: order.currency,
      idempotencyKey,
      metadata: { orderId: order.id },
    });

    await this.prisma.paymentIntent.create({
      data: {
        orderId: order.id,
        stripeIntentId: intent.providerIntentId,
        stripeClientSecret: intent.clientSecret,
        status: this.mapProviderStatus(intent.status),
        amountMinor: order.totalMinor,
        currency: order.currency,
      },
    });

    // Apply state machine: RESERVED → PAYMENT_PENDING or
    // PAYMENT_FAILED → PAYMENT_PENDING (retry).
    const event =
      order.status === 'PAYMENT_FAILED'
        ? { type: 'retryPayment' as const }
        : { type: 'paymentIntentCreated' as const, paymentIntentId: intent.providerIntentId };
    await this.orders.transition(order.id, event, { type: 'SYSTEM' });

    return {
      providerIntentId: intent.providerIntentId,
      clientSecret: intent.clientSecret,
      amountMinor: order.totalMinor.toString(),
      currency: order.currency,
    };
  }

  /**
   * Ingest a verified webhook event. Persists for idempotency BEFORE
   * applying side effects. Re-deliveries return early.
   */
  async ingestWebhook(providerEventId: string, type: string, payload: unknown): Promise<void> {
    try {
      await this.prisma.stripeEvent.create({
        data: {
          stripeEventId: providerEventId,
          type,
          payload: payload as Prisma.InputJsonValue,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        // duplicate webhook delivery — already processed (or in flight).
        this.logger.log({ providerEventId, type }, 'duplicate webhook — skipping');
        return;
      }
      throw err;
    }

    try {
      await this.processEventInline(providerEventId, type, payload);
      await this.prisma.stripeEvent.update({
        where: { stripeEventId: providerEventId },
        data: { processedAt: new Date() },
      });
    } catch (err) {
      this.logger.error({ err, providerEventId, type }, 'webhook processing failed');
      await this.prisma.stripeEvent.update({
        where: { stripeEventId: providerEventId },
        data: {
          processingErrors: { increment: 1 },
          lastError: (err as Error).message,
        },
      });
      // Don't re-throw — we already ACK'd. A retry job (M2 follow-up) will pick this up.
    }
  }

  /**
   * Inline event processor. In production (M2 follow-up) this moves to a
   * BullMQ worker so the HTTP webhook can ACK in <200ms.
   */
  private async processEventInline(
    _eventId: string,
    type: string,
    payload: unknown,
  ): Promise<void> {
    const data = (payload as { data?: { object?: { id?: string; metadata?: Record<string, string> } } })
      ?.data?.object;
    const providerIntentId = data?.id;
    if (!providerIntentId) return;

    const pi = await this.prisma.paymentIntent.findUnique({
      where: { stripeIntentId: providerIntentId },
      select: { id: true, orderId: true, status: true },
    });
    if (!pi) {
      this.logger.warn({ providerIntentId, type }, 'webhook for unknown PI — ignoring');
      return;
    }

    switch (type) {
      case 'payment_intent.succeeded': {
        await this.prisma.paymentIntent.update({
          where: { id: pi.id },
          data: { status: 'SUCCEEDED', succeededAt: new Date() },
        });
        await this.orders.transition(
          pi.orderId,
          { type: 'paymentSucceeded' },
          { type: 'SYSTEM' },
        );
        break;
      }
      case 'payment_intent.payment_failed': {
        await this.prisma.paymentIntent.update({
          where: { id: pi.id },
          data: { status: 'FAILED' },
        });
        await this.orders.transition(
          pi.orderId,
          { type: 'paymentFailed', errorCode: 'card_declined' },
          { type: 'SYSTEM' },
        );
        break;
      }
      case 'charge.refunded': {
        // Refund flow handled separately when staff initiates it; the
        // webhook just records the side effect.
        await this.orders.transition(
          pi.orderId,
          { type: 'cancel', actor: 'staff' },
          { type: 'SYSTEM', note: 'Stripe refund webhook' },
        );
        break;
      }
      default:
        this.logger.log({ type }, 'webhook type not handled');
    }
  }

  private mapProviderStatus(s: ProviderIntentStatus): PaymentStatus {
    return s;
  }
}
