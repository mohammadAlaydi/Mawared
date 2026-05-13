import { HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ERROR_CODES, type OrderStatus } from '@mawared/shared-types';
import { Prisma, type AuditActorType } from '@prisma/client';
import { createHash } from 'node:crypto';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { OffersService } from '@/modules/offers/offers.service';
import { templateForStatus } from '@/modules/notifications/order-notification-templates';
import { ContractsService } from '@/modules/contracts/contracts.service';
import { VerificationsService } from '@/modules/verifications/verifications.service';
import { QUEUE_FACTORY, type QueueFactory } from '@/shared/queue/queue.module';
import { QUEUES } from '@/shared/queue/queue-names';
import {
  InvalidTransitionError,
  nextStatus,
  type OrderEvent,
} from './order.entity';
import { generateOrderNumber } from './order-number';
import { displayForOrder } from './order-display-labels';
import type { CreateOrderDto } from './dto/create-order.dto';

const RESERVATION_TTL_MINUTES = 15;

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly offers: OffersService,
    private readonly contracts: ContractsService,
    private readonly verifications: VerificationsService,
    @Inject(QUEUE_FACTORY) private readonly queues: QueueFactory,
  ) {}

  /**
   * Create a DRAFT → RESERVED order with a worker hold for 15 minutes.
   *
   * Concurrency control: a Postgres advisory transaction lock on a hash of
   * `worker:<id>`. Two parallel reservations on the same worker block each
   * other; the second one re-checks availability and fails fast if the
   * first won. See ADR-013.
   */
  async create(customerId: string, body: CreateOrderDto) {
    // 0. Customer must have a valid Signit.sa verification before placing
    //    an order. Spec §3 — Mawared feature list.
    await this.verifications.assertCanOrder(customerId);

    return this.prisma.$transaction(async (tx) => {
      // 1. Lock on the worker so no other reservation can race us.
      const lockKey = this.bigintHash(`worker:${body.workerId}`);
      const [{ acquired }] = await tx.$queryRaw<Array<{ acquired: boolean }>>`
        SELECT pg_try_advisory_xact_lock(${lockKey}::bigint) AS acquired
      `;
      if (!acquired) {
        throw this.reservationFailed('Worker is currently being reserved.');
      }

      const worker = await tx.worker.findFirst({
        where: { id: body.workerId, deletedAt: null },
        select: { id: true, branchId: true, availability: true },
      });
      if (!worker) {
        throw new HttpException(
          { code: ERROR_CODES.WORKER_NOT_FOUND, message: 'Worker not found.' },
          HttpStatus.NOT_FOUND,
        );
      }
      if (worker.availability !== 'AVAILABLE') {
        throw this.reservationFailed('Worker is not available.');
      }

      const pkg = await tx.servicePackage.findFirst({
        where: { id: body.packageId, isActive: true, deletedAt: null },
      });
      if (!pkg) {
        throw new HttpException(
          { code: ERROR_CODES.PACKAGE_NOT_FOUND, message: 'Package not found.' },
          HttpStatus.NOT_FOUND,
        );
      }

      const address = await tx.address.findFirst({
        where: { id: body.addressId, customerId, deletedAt: null },
        select: { id: true },
      });
      if (!address) {
        throw new HttpException(
          { code: ERROR_CODES.NOT_FOUND, message: 'Address not found for this customer.' },
          HttpStatus.NOT_FOUND,
        );
      }

      const subtotalMinor = pkg.priceMinor;
      let discountMinor = 0n;
      let promoId: string | null = null;
      if (body.promoCode) {
        const v = await this.offers.validate(body.promoCode, {
          customerId,
          subtotalMinor,
          currency: pkg.currency,
        });
        discountMinor = v.discountMinor;
        promoId = v.promoId;
      }
      const taxBase = subtotalMinor - discountMinor;
      const vatMinor = (taxBase * BigInt(pkg.vatRatePpm)) / 1_000_000n;
      const totalMinor = taxBase + vatMinor;

      const orderNumber = generateOrderNumber();
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          workerId: worker.id,
          packageId: pkg.id,
          addressId: address.id,
          branchId: worker.branchId,
          promoId,
          status: 'DRAFT',
          subtotalMinor,
          discountMinor,
          vatMinor,
          totalMinor,
          currency: pkg.currency,
          notes: body.notes ?? null,
          createdById: customerId,
        },
      });

      // 2. Apply state machine: DRAFT -> RESERVED
      const event: OrderEvent = { type: 'submit' };
      const newStatus = nextStatus('DRAFT', event);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + RESERVATION_TTL_MINUTES * 60_000);

      const updated = await tx.order.update({
        where: { id: order.id },
        data: { status: newStatus, placedAt: now },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: 'DRAFT',
          toStatus: newStatus,
          actorType: 'CUSTOMER' as AuditActorType,
          actorId: customerId,
        },
      });

      // 2b. Record the promo redemption now that the order exists.
      if (promoId && discountMinor > 0n) {
        await this.offers.recordRedemption(tx, {
          promoId,
          customerId,
          orderId: order.id,
          discountAppliedMinor: discountMinor,
          currency: pkg.currency,
        });
      }

      // 3. Worker availability + Reservation row (partial unique index enforces
      //    one active reservation per worker).
      await tx.worker.update({
        where: { id: worker.id },
        data: { availability: 'RESERVED' },
      });
      try {
        await tx.reservation.create({
          data: {
            workerId: worker.id,
            customerId,
            orderId: order.id,
            expiresAt,
          },
        });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          // Someone else holds an active reservation — race we didn't catch.
          throw this.reservationFailed('Worker was reserved by another customer.');
        }
        throw err;
      }

      // Enqueue a delayed job to release the reservation at +15min if the
      // order hasn't advanced. Worker-process consumer applies the
      // `expire` transition.
      const delayMs = expiresAt.getTime() - Date.now();
      await this.queues.get(QUEUES.RESERVATION_EXPIRY).add(
        'expire',
        { orderId: order.id },
        { delay: Math.max(0, delayMs), jobId: `expire:${order.id}` },
      );

      this.logger.log(
        { orderId: order.id, workerId: worker.id, expiresAt },
        'order reserved',
      );

      return updated;
    });
  }

  async listForCustomer(customerId: string) {
    const items = await this.prisma.order.findMany({
      where: { customerId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        package: { select: { id: true, nameAr: true, nameEn: true, type: true } },
        worker: {
          select: { id: true, fullNameAr: true, fullNameEn: true, profession: true },
        },
        address: { select: { id: true, label: true, city: true, district: true } },
      },
    });
    return { items };
  }

  async findOneForCustomer(customerId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, customerId, deletedAt: null },
      include: {
        package: true,
        worker: {
          select: { id: true, fullNameAr: true, fullNameEn: true, profession: true },
        },
        address: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        contract: { select: { id: true, contractNumber: true, status: true } },
      },
    });
    if (!order) {
      throw new HttpException(
        { code: ERROR_CODES.ORDER_NOT_FOUND, message: 'Order not found.' },
        HttpStatus.NOT_FOUND,
      );
    }
    return {
      ...order,
      display: displayForOrder({
        status: order.status,
        hasContract: !!order.contract,
        contractStatus: order.contract?.status ?? null,
      }),
    };
  }

  /**
   * Apply an event to an order, persisting the transition and writing a
   * status-history row. Side effects (releasing reservations, refunds,
   * notifications) are handled here in code — the state machine itself is
   * pure (see order.entity.ts).
   */
  async transition(
    orderId: string,
    event: OrderEvent,
    actor: { type: AuditActorType; id?: string; note?: string },
  ): Promise<{ from: OrderStatus; to: OrderStatus }> {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: orderId, deletedAt: null },
        select: {
          id: true,
          status: true,
          workerId: true,
          customerId: true,
        },
      });
      if (!order) {
        throw new HttpException(
          { code: ERROR_CODES.ORDER_NOT_FOUND, message: 'Order not found.' },
          HttpStatus.NOT_FOUND,
        );
      }

      let to: OrderStatus;
      try {
        to = nextStatus(order.status as OrderStatus, event);
      } catch (err) {
        if (err instanceof InvalidTransitionError) {
          throw new HttpException(
            {
              code: ERROR_CODES.ORDER_INVALID_TRANSITION,
              message: `Cannot apply ${event.type} to an order in ${order.status}.`,
            },
            HttpStatus.CONFLICT,
          );
        }
        throw err;
      }

      const now = new Date();
      const updateData: Prisma.OrderUpdateInput = { status: to };
      if (to === 'CONFIRMED') updateData.confirmedAt = now;
      if (to === 'COMPLETED') updateData.completedAt = now;
      if (to === 'CANCELLED' || to === 'REFUNDED') {
        updateData.cancelledAt = now;
        if (event.type === 'cancel') {
          updateData.cancelReason =
            event.actor === 'system' ? 'SYSTEM_TIMEOUT' :
            event.actor === 'staff'  ? 'STAFF_DECISION'  : 'CUSTOMER_REQUEST';
        }
        if (event.type === 'expire') updateData.cancelReason = 'SYSTEM_TIMEOUT';
        if (actor.note) updateData.cancelNote = actor.note;
      }

      await tx.order.update({ where: { id: orderId }, data: updateData });

      // Side effects on the worker / reservation.
      if (order.workerId) {
        if (to === 'CONFIRMED') {
          await tx.worker.update({
            where: { id: order.workerId },
            data: { availability: 'BOOKED' },
          });
          await tx.reservation.updateMany({
            where: { orderId, releasedAt: null },
            data: { releasedAt: now },
          });
        }
        if (to === 'COMPLETED' || to === 'CANCELLED' || to === 'REFUNDED') {
          await tx.worker.update({
            where: { id: order.workerId },
            data: { availability: 'AVAILABLE' },
          });
          await tx.reservation.updateMany({
            where: { orderId, releasedAt: null },
            data: { releasedAt: now },
          });
        }
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: to,
          actorType: actor.type,
          actorId: actor.id ?? null,
          note: actor.note ?? null,
          metadata: { event: event.type } as Prisma.InputJsonValue,
        },
      });

      const customerId = order.customerId;
      const result = { from: order.status as OrderStatus, to };

      // Post-commit side effects: contract issuance + customer notification.
      // Fire-and-log; failures here do NOT roll back the transition.
      queueMicrotask(() => {
        this.applyPostTransitionSideEffects(orderId, customerId, to).catch((err) =>
          this.logger.warn({ err, orderId, to }, 'post-transition side effects failed'),
        );
      });

      return result;
    });
  }

  private async applyPostTransitionSideEffects(
    orderId: string,
    customerId: string,
    status: OrderStatus,
  ): Promise<void> {
    if (status === 'CONFIRMED') {
      await this.contracts.issueFor(orderId).catch((err) =>
        this.logger.error({ err, orderId }, 'contract issuance failed'),
      );
    }
    if (status === 'REFUNDED' || status === 'CANCELLED') {
      const contract = await this.prisma.contract.findUnique({
        where: { orderId },
        select: { id: true, status: true },
      });
      if (contract && contract.status === 'ACTIVE') {
        await this.contracts
          .voidContract(contract.id, `order ${status.toLowerCase()}`)
          .catch((err) =>
            this.logger.error({ err, orderId, contractId: contract.id }, 'contract void failed'),
          );
      }
    }
    await this.notifyCustomerOfStatus(orderId, customerId, status);
  }

  private async notifyCustomerOfStatus(
    orderId: string,
    customerId: string,
    status: OrderStatus,
  ): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { orderNumber: true },
    });
    if (!order) return;
    const tpl = templateForStatus(status, order.orderNumber);
    if (!tpl) return;
    // Enqueue rather than calling NotificationsService inline so push fanout
    // happens off the request thread and survives transient FCM failures
    // with BullMQ's backoff.
    await this.queues.get(QUEUES.NOTIFICATIONS).add('send', {
      userId: customerId,
      template: tpl,
      options: { relatedOrderId: orderId, data: { orderId, status } },
    });
  }

  /**
   * BullMQ handler entry point (wired in M2 follow-up). Marks any
   * reservation whose expiresAt has passed as CANCELLED via the
   * state machine.
   */
  async expireReservation(orderId: string): Promise<void> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, deletedAt: null },
      select: { status: true },
    });
    if (!order) return;
    if (order.status === 'RESERVED' || order.status === 'PAYMENT_FAILED') {
      await this.transition(orderId, { type: 'expire' }, { type: 'SYSTEM' });
    }
  }

  // ---------- helpers ----------

  private reservationFailed(detail: string): HttpException {
    return new HttpException(
      { code: ERROR_CODES.ORDER_RESERVATION_FAILED, message: detail },
      HttpStatus.CONFLICT,
    );
  }

  /**
   * Convert a string into a signed 64-bit int suitable for
   * pg_try_advisory_xact_lock. We take the first 8 bytes of SHA-256
   * and interpret as a signed bigint.
   */
  private bigintHash(input: string): bigint {
    const buf = createHash('sha256').update(input).digest().subarray(0, 8);
    return buf.readBigInt64BE(0);
  }
}
