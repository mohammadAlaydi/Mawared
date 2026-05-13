import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { ApiTags } from '@nestjs/swagger';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { Public } from '@/common/decorators/public.decorator';
import { PrismaService } from '@/shared/prisma/prisma.service';
import type { Env } from '@/shared/config/env.schema';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaIndicator: PrismaHealthIndicator,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /** Liveness: returns 200 as long as the process is running. */
  @Public()
  @Get('healthz')
  liveness(): { ok: true; uptimeSec: number } {
    return { ok: true, uptimeSec: Math.floor(process.uptime()) };
  }

  /** Readiness: 200 only when downstream deps are reachable. */
  @Public()
  @Get('readyz')
  @HealthCheck()
  async readiness() {
    return this.health.check([
      () => this.prismaIndicator.pingCheck('postgres', this.prisma),
      () => this.checkRedis(),
    ]);
  }

  private async checkRedis(): Promise<HealthIndicatorResult> {
    const url = this.config.get('REDIS_URL', { infer: true });
    const client = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1 });
    try {
      await client.connect();
      const reply = await client.ping();
      return { redis: { status: reply === 'PONG' ? 'up' : 'down' } };
    } catch (err) {
      return { redis: { status: 'down', message: (err as Error).message } };
    } finally {
      client.disconnect();
    }
  }
}
