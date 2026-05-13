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
import { QUEUE_FACTORY, type QueueFactory } from '@/shared/queue/queue.module';
import { QUEUES } from '@/shared/queue/queue-names';
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
    @Inject(QUEUE_FACTORY) private readonly queues: QueueFactory,
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
   * Webhook ingest path. Persists for idempotency, ACKs fast (<200ms),
   * and enqueues a BullMQ job. The StripeEventConsumer running in the
   * worker process picks the job up and calls processStripeEvent().
   *
   * If the row already exists (duplicate delivery), we no-op. If a row
   * exists but has no processedAt (a previous run failed mid-flight),
   * we re-enqueue so it gets retried.
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
        const existing = await this.prisma.stripeEvent.findUnique({
          where: { stripeEventId: providerEventId },
          select: { processedAt: true },
        });
        if (existing?.processedAt) {
          this.logger.log({ providerEventId, type }, 'duplicate webhook — skipping');
          return;
        }
        // Row exists but processing didn't complete — fall through to re-enqueue.
      } else {
        throw err;
      }
    }

    await this.queues.get(QUEUES.STRIPE_EVENT).add(
      'process',
      { providerEventId },
      { jobId: `stripe:${providerEventId}` },
    );
  }

  /**
   * Consumer entry point. Loads the event from the DB (the only source
   * of truth), applies side effects, then marks `processedAt`.
   */
  async processStripeEvent(providerEventId: string): Promise<void> {
    const row = await this.prisma.stripeEvent.findUnique({
      where: { stripeEventId: providerEventId },
    });
    if (!row) {
      this.logger.warn({ providerEventId }, 'stripe event row missing — skipping');
      return;
    }
    if (row.processedAt) return;

    try {
      await this.processEventInline(providerEventId, row.type, row.payload);
      await this.prisma.stripeEvent.update({
        where: { stripeEventId: providerEventId },
        data: { processedAt: new Date() },
      });
    } catch (err) {
      this.logger.error({ err, providerEventId, type: row.type }, 'webhook processing failed');
      await this.prisma.stripeEvent.update({
        where: { stripeEventId: providerEventId },
        data: {
          processingErrors: { increment: 1 },
          lastError: (err as Error).message,
        },
      });
      throw err; // BullMQ retries with backoff
    }
  }

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
