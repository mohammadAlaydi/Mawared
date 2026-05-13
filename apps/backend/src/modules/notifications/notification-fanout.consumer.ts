import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker, type Job } from 'bullmq';
import { NotificationsService } from './notifications.service';
import { QUEUES } from '@/shared/queue/queue-names';
import type { Env } from '@/shared/config/env.schema';

export interface NotificationFanoutJob {
  userId: string;
  template: {
    type:
      | 'ORDER_UPDATE'
      | 'PAYMENT'
      | 'PROMOTION'
      | 'SYSTEM'
      | 'CONTRACT';
    titleAr: string;
    titleEn: string;
    bodyAr: string;
    bodyEn: string;
  };
  options?: {
    channels?: Array<'PUSH' | 'IN_APP' | 'EMAIL' | 'SMS'>;
    relatedOrderId?: string;
    relatedContractId?: string;
    data?: Record<string, string>;
  };
}

@Injectable()
export class NotificationFanoutConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationFanoutConsumer.name);
  private worker?: Worker<NotificationFanoutJob>;

  constructor(
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  onModuleInit(): void {
    if (process.env.MAWARED_PROCESS !== 'worker') return;
    this.worker = new Worker<NotificationFanoutJob>(
      QUEUES.NOTIFICATIONS,
      async (job: Job<NotificationFanoutJob>) => {
        await this.notifications.send(job.data.userId, job.data.template, job.data.options);
      },
      {
        connection: {
          url: this.config.get('REDIS_URL', { infer: true }),
          maxRetriesPerRequest: null,
        },
        concurrency: 8,
      },
    );
    this.worker.on('failed', (job, err) =>
      this.logger.error(
        { err, jobId: job?.id, userId: job?.data?.userId },
        'notification fanout failed',
      ),
    );
    this.logger.log('notifications consumer ready');
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}
