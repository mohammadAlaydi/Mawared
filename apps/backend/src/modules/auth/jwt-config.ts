import { createHash } from 'node:crypto';
import type { ConfigService } from '@nestjs/config';
import type { Env } from '@/shared/config/env.schema';

/**
 * Single source of truth for JWT signing/verification options.
 *
 * Production: RS256 with JWT_PRIVATE_KEY / JWT_PUBLIC_KEY (PEM).
 * Local dev fallback: HS256 with a deterministic secret derived from
 * DATABASE_URL — works without provisioning RSA keys. Refuses to run in
 * production without RSA keys configured.
 */
export function getJwtSignOptions(config: ConfigService<Env, true>): {
  secret: string;
  algorithm: 'RS256' | 'HS256';
} {
  const priv = config.get('JWT_PRIVATE_KEY', { infer: true });
  if (priv && priv.length > 0) {
    return { secret: priv, algorithm: 'RS256' };
  }
  if (config.get('NODE_ENV', { infer: true }) === 'production') {
    throw new Error('JWT_PRIVATE_KEY must be set in production.');
  }
  return { secret: devSecret(config), algorithm: 'HS256' };
}

export function getJwtVerifyOptions(config: ConfigService<Env, true>): {
  secret: string;
  algorithm: 'RS256' | 'HS256';
} {
  const pub = config.get('JWT_PUBLIC_KEY', { infer: true });
  if (pub && pub.length > 0) {
    return { secret: pub, algorithm: 'RS256' };
  }
  if (config.get('NODE_ENV', { infer: true }) === 'production') {
    throw new Error('JWT_PUBLIC_KEY must be set in production.');
  }
  return { secret: devSecret(config), algorithm: 'HS256' };
}

function devSecret(config: ConfigService<Env, true>): string {
  return createHash('sha256')
    .update(`mawared-dev-jwt::${config.get('DATABASE_URL', { infer: true })}`)
    .digest('hex');
}
