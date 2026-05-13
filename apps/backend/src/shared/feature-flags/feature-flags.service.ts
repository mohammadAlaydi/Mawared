import { Global, Injectable, Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/shared/prisma/prisma.service';
import type { Env } from '@/shared/config/env.schema';

interface FlagRules {
  /** Roll out to a specific percentage of users (deterministic by userId hash). */
  rolloutPercent?: number;
  /** Allow-list of specific userIds. */
  userIds?: string[];
  /** Allow-list of roles. */
  roles?: Array<'CUSTOMER' | 'STAFF' | 'BRANCH_MANAGER' | 'SUPER_ADMIN'>;
}

interface Flag {
  enabled: boolean;
  rules?: FlagRules;
}

/**
 * Tiny in-process feature-flag service. Hits the FeatureFlag table on
 * every check, with a 30-second cache. Good enough for the v1 traffic
 * profile (a few hundred lookups/sec); revisit if it shows up in flame
 * graphs.
 *
 * Usage:
 *   if (await flags.isEnabled('auto_review', { userId, role })) { ... }
 */
@Injectable()
export class FeatureFlagsService implements OnModuleInit {
  private static readonly CACHE_TTL_MS = 30_000;

  private cache = new Map<string, { flag: Flag | null; loadedAtMs: number }>();
  private defaultEnabled = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  onModuleInit(): void {
    this.defaultEnabled = this.config.get('FEATURE_FLAGS_DEFAULT_ENABLED', { infer: true });
  }

  async isEnabled(
    key: string,
    ctx: { userId?: string; role?: 'CUSTOMER' | 'STAFF' | 'BRANCH_MANAGER' | 'SUPER_ADMIN' } = {},
  ): Promise<boolean> {
    const flag = await this.load(key);
    if (!flag) return this.defaultEnabled;
    if (!flag.enabled) return false;
    return this.evaluateRules(flag.rules, ctx);
  }

  async setFlag(
    key: string,
    enabled: boolean,
    rules?: FlagRules,
    updatedById?: string,
  ): Promise<void> {
    await this.prisma.featureFlag.upsert({
      where: { key },
      update: { enabled, rules: (rules ?? undefined) as object | undefined, updatedById: updatedById ?? null },
      create: {
        key,
        enabled,
        rules: (rules ?? undefined) as object | undefined,
        updatedById: updatedById ?? null,
      },
    });
    this.cache.delete(key);
  }

  async listAll() {
    return this.prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });
  }

  invalidate(key?: string): void {
    if (key) this.cache.delete(key);
    else this.cache.clear();
  }

  private async load(key: string): Promise<Flag | null> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.loadedAtMs < FeatureFlagsService.CACHE_TTL_MS) {
      return cached.flag;
    }
    const row = await this.prisma.featureFlag.findUnique({ where: { key } });
    const flag: Flag | null = row
      ? { enabled: row.enabled, rules: (row.rules as FlagRules | null) ?? undefined }
      : null;
    this.cache.set(key, { flag, loadedAtMs: Date.now() });
    return flag;
  }

  private evaluateRules(
    rules: FlagRules | undefined,
    ctx: { userId?: string; role?: string },
  ): boolean {
    if (!rules) return true;
    if (rules.userIds && ctx.userId && rules.userIds.includes(ctx.userId)) return true;
    if (rules.roles && ctx.role && rules.roles.includes(ctx.role as never)) return true;
    if (rules.rolloutPercent !== undefined && ctx.userId) {
      return this.userBucket(ctx.userId) < rules.rolloutPercent;
    }
    // If rules exist but none matched, default to NOT enabled — the rules
    // are a positive allow-list. Empty rules object means "enabled for all".
    return !rules.userIds && !rules.roles && rules.rolloutPercent === undefined;
  }

  /** Deterministic 0..99 bucket per userId. Cheap FNV-1a hash. */
  private userBucket(userId: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < userId.length; i++) {
      h ^= userId.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return Math.abs(h) % 100;
  }
}

@Global()
@Module({
  providers: [FeatureFlagsService],
  exports: [FeatureFlagsService],
})
export class FeatureFlagsModule {}
