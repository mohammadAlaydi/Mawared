import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ERROR_CODES } from '@mawared/shared-types';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { PrismaService } from '@/shared/prisma/prisma.service';
import type { Env } from '@/shared/config/env.schema';
import type { UserRole } from '@prisma/client';

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresInSec: number;
  refreshTokenExpiresInSec: number;
}

interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  sessionId: string;
  jti: string;
  iss: string;
  aud: string;
}

/**
 * Issues access JWTs + opaque refresh tokens, with rotation + family-tree
 * theft detection. See docs/backend/02-ARCHITECTURE.md §7.
 *
 * NOTE: For M1 we sign access JWTs symmetrically (HS256) using a derived
 * secret if JWT_PRIVATE_KEY is not set. ADR-005 calls for RS256 in prod —
 * once the key material is provisioned, swap to `RS256` and load the keys.
 */
@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async issueForCustomer(
    userId: string,
    sessionId: string,
    role: UserRole,
    parentRefreshTokenId?: string,
    family?: string,
    requestMeta?: { ip?: string; userAgent?: string },
  ): Promise<IssuedTokens> {
    const accessTtl = this.config.get('ACCESS_TOKEN_TTL_SECONDS', { infer: true });
    const refreshTtl = this.config.get('REFRESH_TOKEN_TTL_SECONDS', { infer: true });

    const jti = randomUUID();
    const payload: AccessTokenPayload = {
      sub: userId,
      role,
      sessionId,
      jti,
      iss: this.config.get('JWT_ISSUER', { infer: true }),
      aud:
        role === 'CUSTOMER'
          ? this.config.get('JWT_AUDIENCE_CUSTOMER', { infer: true })
          : this.config.get('JWT_AUDIENCE_ADMIN', { infer: true }),
    };
    const accessToken = await this.jwt.signAsync(payload, { expiresIn: accessTtl });

    const refreshRaw = this.generateRefreshTokenRaw();
    const refreshHash = this.hashRefreshToken(refreshRaw);
    const familyId = family ?? randomUUID();

    await this.prisma.refreshToken.create({
      data: {
        userId,
        sessionId,
        tokenHash: refreshHash,
        family: familyId,
        parentId: parentRefreshTokenId ?? null,
        expiresAt: new Date(Date.now() + refreshTtl * 1000),
        ipAddress: requestMeta?.ip ?? null,
        userAgent: requestMeta?.userAgent ?? null,
      },
    });

    return {
      accessToken,
      refreshToken: refreshRaw,
      accessTokenExpiresInSec: accessTtl,
      refreshTokenExpiresInSec: refreshTtl,
    };
  }

  /**
   * Rotates a refresh token. If the presented token has already been
   * rotated or revoked, every token in the family is revoked (theft
   * detection) and 401 is returned.
   */
  async refresh(
    refreshToken: string,
    requestMeta?: { ip?: string; userAgent?: string },
  ): Promise<IssuedTokens> {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true, session: true },
    });

    if (!existing) {
      throw this.unauthorized();
    }

    const now = new Date();
    if (existing.revokedAt || existing.expiresAt < now) {
      throw this.unauthorized();
    }

    if (existing.rotatedAt) {
      // Token was already used to mint a new one — likely theft. Revoke
      // the entire family and force a fresh login on all devices in it.
      this.logger.warn(
        { userId: existing.userId, family: existing.family },
        'refresh token replay detected — revoking family',
      );
      await this.prisma.refreshToken.updateMany({
        where: { family: existing.family, revokedAt: null },
        data: { revokedAt: now },
      });
      throw new HttpException(
        {
          code: ERROR_CODES.AUTH_REFRESH_TOKEN_REUSE_DETECTED,
          message: 'Session compromised; please sign in again.',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (existing.session.revokedAt) {
      throw this.unauthorized();
    }

    // Mark this token as rotated and issue a new one in the same family.
    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: { rotatedAt: now },
    });
    await this.prisma.session.update({
      where: { id: existing.sessionId },
      data: { lastSeenAt: now },
    });

    return this.issueForCustomer(
      existing.userId,
      existing.sessionId,
      existing.user.role,
      existing.id,
      existing.family,
      requestMeta,
    );
  }

  async revoke(refreshToken: string): Promise<void> {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const existing = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!existing || existing.revokedAt) return;

    const now = new Date();
    await this.prisma.refreshToken.updateMany({
      where: { family: existing.family, revokedAt: null },
      data: { revokedAt: now },
    });
    await this.prisma.session.update({
      where: { id: existing.sessionId },
      data: { revokedAt: now },
    });
  }

  private generateRefreshTokenRaw(): string {
    return randomBytes(32).toString('base64url');
  }

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private unauthorized(): HttpException {
    return new HttpException(
      {
        code: ERROR_CODES.AUTH_INVALID_REFRESH_TOKEN,
        message: 'Invalid or expired refresh token.',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}
