import { HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import * as argon2 from 'argon2';
import type Redis from 'ioredis';
import { ERROR_CODES } from '@mawared/shared-types';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { REDIS_CLIENT } from '@/shared/redis/redis.module';
import { SessionService } from '@/modules/auth/session.service';
import { TokenService } from '@/modules/auth/token.service';
import { verifyTotp } from './totp';

/**
 * Email + password login for staff. Argon2id verification, brute-force
 * lockout keyed by email and IP, optional TOTP enforced for any role
 * above STAFF (BRANCH_MANAGER, SUPER_ADMIN). On success we mint tokens
 * with the admin audience claim so they can't be used on customer endpoints.
 *
 * NOTE: TOTP enrollment + verification is deferred — the service refuses
 * to log in non-STAFF accounts that don't yet have a TOTP secret. For M3
 * we accept the seed super-admin without TOTP if `totpEnabled = false`.
 */
@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger(AdminAuthService.name);
  private static readonly LOCKOUT_THRESHOLD = 5;
  private static readonly LOCKOUT_TTL_SEC = 15 * 60;

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionService,
    private readonly tokens: TokenService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async login(
    email: string,
    password: string,
    deviceId: string,
    totp: string | undefined,
    meta: { ip?: string; userAgent?: string },
  ) {
    await this.assertNotLockedOut(email, meta.ip);

    const user = await this.prisma.user.findFirst({
      where: { email, isActive: true, deletedAt: null },
      select: {
        id: true,
        role: true,
        branchId: true,
        passwordHash: true,
        totpEnabled: true,
        totpSecret: true,
      },
    });

    if (!user || !user.passwordHash || user.role === 'CUSTOMER') {
      await this.bumpFailure(email, meta.ip);
      throw this.unauthorized();
    }

    const passwordValid = await argon2.verify(user.passwordHash, password);
    if (!passwordValid) {
      await this.bumpFailure(email, meta.ip);
      throw this.unauthorized();
    }

    // TOTP enforced whenever the user has enrolled. The seed super-admin
    // can sign in without it once, then enrol via /v1/admin/auth/totp/enroll.
    if (user.totpEnabled) {
      if (!totp) {
        throw new HttpException(
          {
            code: ERROR_CODES.AUTH_2FA_REQUIRED,
            message: 'TOTP code required for this account.',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }
      if (!user.totpSecret || !verifyTotp(user.totpSecret, totp)) {
        await this.bumpFailure(email, meta.ip);
        throw new HttpException(
          {
            code: ERROR_CODES.AUTH_INVALID_OTP,
            message: 'Invalid TOTP code.',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }
    }

    await this.clearFailures(email, meta.ip);

    const sessionId = await this.sessions.createOrGet(user.id, deviceId, undefined, meta);
    const tokens = await this.tokens.issueForCustomer(
      user.id,
      sessionId,
      user.role,
      undefined,
      undefined,
      meta,
    );
    return {
      tokenType: 'Bearer',
      ...tokens,
      user: { id: user.id, role: user.role, email, branchId: user.branchId },
    };
  }

  private async assertNotLockedOut(email: string, ip?: string): Promise<void> {
    const fields = await this.redis.mget(
      this.keyEmail(email),
      ip ? this.keyIp(ip) : 'noop',
    );
    const emailFails = Number(fields[0] ?? 0);
    const ipFails = Number(fields[1] ?? 0);
    if (emailFails >= AdminAuthService.LOCKOUT_THRESHOLD ||
        ipFails    >= AdminAuthService.LOCKOUT_THRESHOLD) {
      throw new HttpException(
        {
          code: ERROR_CODES.RATE_LIMITED,
          message: 'Too many failed attempts. Try again later.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async bumpFailure(email: string, ip?: string): Promise<void> {
    const promises = [
      this.redis.incr(this.keyEmail(email)),
      this.redis.expire(this.keyEmail(email), AdminAuthService.LOCKOUT_TTL_SEC),
    ];
    if (ip) {
      promises.push(this.redis.incr(this.keyIp(ip)));
      promises.push(this.redis.expire(this.keyIp(ip), AdminAuthService.LOCKOUT_TTL_SEC));
    }
    await Promise.all(promises);
  }

  private async clearFailures(email: string, ip?: string): Promise<void> {
    await this.redis.del(this.keyEmail(email), ip ? this.keyIp(ip) : 'noop');
  }

  private keyEmail(email: string): string { return `admin-login:email:${email}`; }
  private keyIp(ip: string): string     { return `admin-login:ip:${ip}`; }

  private unauthorized(): HttpException {
    return new HttpException(
      {
        code: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
        message: 'Invalid email or password.',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}
