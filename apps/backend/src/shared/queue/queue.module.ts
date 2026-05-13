import { Global, Logger, Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { QUEUES, type QueueName } from './queue-names';
import type { Env } from '../config/env.schema';

export const QUEUE_FACTORY = Symbol('QUEUE_FACTORY');

export interface QueueFactory {
  get(name: QueueName): Queue;
}

class BullMqQueueFactory implements QueueFactory, OnModuleDestroy {
  private readonly logger = new Logger(BullMqQueueFactory.name);
  private readonly cache = new Map<QueueName, Queue>();

  constructor(private readonly redisUrl: string) {}

  get(name: QueueName): Queue {
    let q = this.cache.get(name);
    if (!q) {
      q = new Queue(name, {
        connection: { url: this.redisUrl, maxRetriesPerRequest: null },
        defaultJobOptions: {
          attempts: 5,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: { age: 24 * 3600, count: 5_000 },
          removeOnFail: { age: 7 * 24 * 3600 },
        },
      });
      q.on('error', (err) => this.logger.error({ err, queue: name }, 'queue error'));
      this.cache.set(name, q);
    }
    return q;
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([...this.cache.values()].map((q) => q.close()));
    this.cache.clear();
  }
}

@Global()
@Module({
  providers: [
    {
      provide: QUEUE_FACTORY,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): QueueFactory =>
        new BullMqQueueFactory(config.get('REDIS_URL', { infer: true })),
    },
  ],
  exports: [QUEUE_FACTORY],
})
export class QueueModule {}

export { QUEUES };
