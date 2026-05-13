import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker, type Job } from 'bullmq';
import { OrdersService } from './orders.service';
import { QUEUES } from '@/shared/queue/queue-names';
import type { Env } from '@/shared/config/env.schema';

export interface ReservationExpiryJob {
  orderId: string;
}

/**
 * BullMQ consumer for the reservation-expiry queue. Each RESERVED order
 * enqueues a delayed job at `expiresAt`; this consumer wakes up and asks
 * OrdersService to apply the `expire` state transition (no-op if the
 * order has already advanced past RESERVED).
 *
 * Lives in the worker process. Will NOT pull jobs when only the API
 * process is running.
 */
@Injectable()
export class ReservationExpiryConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReservationExpiryConsumer.name);
  private worker?: Worker<ReservationExpiryJob>;

  constructor(
    private readonly orders: OrdersService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  onModuleInit(): void {
    if (process.env.MAWARED_PROCESS !== 'worker') {
      // Don't spin up consumers inside the HTTP API process.
      return;
    }
    this.worker = new Worker<ReservationExpiryJob>(
      QUEUES.RESERVATION_EXPIRY,
      async (job: Job<ReservationExpiryJob>) => {
        await this.orders.expireReservation(job.data.orderId);
      },
      {
        connection: {
          url: this.config.get('REDIS_URL', { infer: true }),
          maxRetriesPerRequest: null,
        },
        concurrency: 4,
      },
    );
    this.worker.on('failed', (job, err) =>
      this.logger.error({ err, jobId: job?.id, data: job?.data }, 'reservation expiry failed'),
    );
    this.worker.on('completed', (job) =>
      this.logger.debug({ jobId: job.id, data: job.data }, 'reservation expiry processed'),
    );
    this.logger.log('reservation-expiry consumer ready');
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}
