import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '@/shared/prisma/prisma.service';
import type { Env } from '@/shared/config/env.schema';
import type { AuthUser } from '@/common/decorators/current-user.decorator';
import { getJwtVerifyOptions } from '../jwt-config';

interface JwtRawPayload {
  sub: string;
  role: AuthUser['role'];
  sessionId: string;
  jti: string;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    const opts = getJwtVerifyOptions(config);
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: opts.secret,
      algorithms: [opts.algorithm],
      issuer: config.get('JWT_ISSUER', { infer: true }),
      // We accept both audiences and disambiguate downstream.
      audience: [
        config.get('JWT_AUDIENCE_CUSTOMER', { infer: true }),
        config.get('JWT_AUDIENCE_ADMIN', { infer: true }),
      ],
    });
  }

  async validate(payload: JwtRawPayload): Promise<AuthUser> {
    const session = await this.prisma.session.findUnique({
      where: { id: payload.sessionId },
      select: { id: true, revokedAt: true },
    });
    if (!session || session.revokedAt) {
      throw new UnauthorizedException();
    }
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, isActive: true, deletedAt: null },
      select: { id: true, role: true, branchId: true },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    const customerAud =
      payload.aud === 'mawared-customer' ||
      payload.aud === undefined ||
      payload.aud === '' ||
      false;
    return {
      id: user.id,
      role: user.role,
      branchId: user.branchId ?? undefined,
      audience: customerAud ? 'mawared-customer' : 'mawared-admin',
    };
  }
}
