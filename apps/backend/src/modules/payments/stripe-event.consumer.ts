import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker, type Job } from 'bullmq';
import { PaymentsService } from './payments.service';
import { QUEUES } from '@/shared/queue/queue-names';
import type { Env } from '@/shared/config/env.schema';

export interface StripeEventJob {
  providerEventId: string;
}

@Injectable()
export class StripeEventConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StripeEventConsumer.name);
  private worker?: Worker<StripeEventJob>;

  constructor(
    private readonly payments: PaymentsService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  onModuleInit(): void {
    if (process.env.MAWARED_PROCESS !== 'worker') return;
    this.worker = new Worker<StripeEventJob>(
      QUEUES.STRIPE_EVENT,
      async (job: Job<StripeEventJob>) => {
        await this.payments.processStripeEvent(job.data.providerEventId);
      },
      {
        connection: {
          url: this.config.get('REDIS_URL', { infer: true }),
          maxRetriesPerRequest: null,
        },
        // Bound concurrency so a Stripe replay storm can't DoS the worker.
        concurrency: 4,
      },
    );
    this.worker.on('failed', (job, err) =>
      this.logger.error({ err, jobId: job?.id, data: job?.data }, 'stripe event processing failed'),
    );
    this.logger.log('stripe-event consumer ready');
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}
