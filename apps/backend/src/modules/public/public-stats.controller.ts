import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { PublicStatsService, type PublicStatsResponse } from './public-stats.service';

/**
 * Aggregate public stats for the marketing site. Cached aggressively (5-min TTL)
 * — every render of the homepage shouldn't hit Postgres.
 */
@ApiTags('public')
@Controller({ path: 'public', version: '1' })
export class PublicStatsController {
  constructor(private readonly stats: PublicStatsService) {}

  @Public()
  @Get('stats')
  getStats(): Promise<PublicStatsResponse> {
    return this.stats.getStats();
  }
}
