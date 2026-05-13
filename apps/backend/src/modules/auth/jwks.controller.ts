import { Controller, Get, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { createPublicKey } from 'node:crypto';
import { Public } from '@/common/decorators/public.decorator';
import type { Env } from '@/shared/config/env.schema';

/**
 * RFC 7517 JWKS endpoint at /.well-known/jwks.json. Exposes the RS256
 * public key so the admin dashboard / Android app can verify access
 * tokens locally without round-tripping the API.
 *
 * In dev (HS256) we serve an empty key set — clients fall back to bearer
 * tokens being verified server-side.
 */
@ApiTags('jwks')
@Controller()
export class JwksController {
  private readonly logger = new Logger(JwksController.name);

  constructor(private readonly config: ConfigService<Env, true>) {}

  @Public()
  @Get('.well-known/jwks.json')
  jwks() {
    const pub = this.config.get('JWT_PUBLIC_KEY', { infer: true });
    if (!pub) return { keys: [] };
    try {
      const key = createPublicKey(pub);
      const jwk = key.export({ format: 'jwk' });
      return {
        keys: [
          {
            ...jwk,
            use: 'sig',
            alg: 'RS256',
            kid: 'mawared-v1',
          },
        ],
      };
    } catch (err) {
      this.logger.error({ err }, 'failed to export JWT public key as JWK');
      return { keys: [] };
    }
  }
}
