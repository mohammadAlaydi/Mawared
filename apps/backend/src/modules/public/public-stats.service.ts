import { Inject, Injectable, Logger } from '@nestjs/common';
import type Redis from 'ioredis';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { REDIS_CLIENT } from '@/shared/redis/redis.module';

const CACHE_KEY = 'public:stats:v1';
const CACHE_TTL_SECONDS = 5 * 60;

export interface PublicStatsResponse {
  /** Count of customers who have completed identity verification. Used as a "happy clients" proxy. */
  verifiedCustomerCount: number;
  /** Count of currently-available workers across all branches. */
  availableWorkerCount: number;
  /** Distinct nationality count among available workers. */
  nationalityCount: number;
  /** Average worker rating (0.0–5.0). Used as the "satisfaction" headline. */
  averageWorkerRating: number;
  /** ISO-8601 timestamp when this snapshot was computed. */
  computedAt: string;
}

@Injectable()
export class PublicStatsService {
  private readonly logger = new Logger(PublicStatsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async getStats(): Promise<PublicStatsResponse> {
    const cached = await this.redis.get(CACHE_KEY).catch((err) => {
      this.logger.warn({ err }, 'Failed reading public stats cache; falling back to DB');
      return null;
    });
    if (cached) {
      try {
        return JSON.parse(cached) as PublicStatsResponse;
      } catch {
        // Fall through and recompute.
      }
    }

    const [verifiedCustomerCount, availableWorkers, nationalityCount, avgRating] =
      await Promise.all([
        this.prisma.customer.count({ where: { verificationStatus: 'VERIFIED' } }),
        this.prisma.worker.count({ where: { availability: 'AVAILABLE', deletedAt: null } }),
        this.prisma.worker.groupBy({
          by: ['nationalityId'],
          where: { availability: 'AVAILABLE', deletedAt: null },
        }).then((rows) => rows.length),
        this.prisma.worker.aggregate({
          where: { deletedAt: null },
          _avg: { rating: true },
        }),
      ]);

    const response: PublicStatsResponse = {
      verifiedCustomerCount,
      availableWorkerCount: availableWorkers,
      nationalityCount,
      averageWorkerRating: Number(avgRating._avg.rating ?? 0),
      computedAt: new Date().toISOString(),
    };

    await this.redis
      .setex(CACHE_KEY, CACHE_TTL_SECONDS, JSON.stringify(response))
      .catch((err) => this.logger.warn({ err }, 'Failed writing public stats cache'));

    return response;
  }
}
