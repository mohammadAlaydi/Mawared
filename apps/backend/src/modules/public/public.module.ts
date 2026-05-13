import { Module } from '@nestjs/common';
import { PublicStatsController } from './public-stats.controller';
import { PublicStatsService } from './public-stats.service';

/**
 * Public, anonymous endpoints for the marketing website and other unauthenticated
 * consumers. Strictly read-only and cached aggressively (Redis 5-minute TTL) to
 * shield the database from public traffic spikes.
 */
@Module({
  controllers: [PublicStatsController],
  providers: [PublicStatsService],
})
export class PublicModule {}
