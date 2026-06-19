import { HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import type Redis from 'ioredis';
import { randomInt } from 'node:crypto';
import { ERROR_CODES } from '@mawared/shared-types';
import { REDIS_CLIENT } from '@/shared/redis/redis.module';
import { SMS_PROVIDER, type SmsProvider } from '@/shared/sms/sms.provider';
import { PrismaService } from '@/shared/prisma/prisma.service';
import type { Env } from '@/shared/config/env.schema';

/**
 * OTP request + verify with Redis-backed storage and layered rate limits.
 *
 * Redis keys:
 *   otp:<phone>            → { hash, attempts, sentAt }      TTL 5min
 *   otp:rl:phone:<phone>   → counter                          TTL window
 *   otp:rl:ip:<ip>         → counter                          TTL 1h
 *
 * Argon2id hash is used so a Redis dump never exposes raw OTPs.
 */
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly OTP_TTL_SECONDS = 300; // 5 minutes
  private readonly MAX_VERIFY_ATTEMPTS = 5;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(SMS_PROVIDER) private readonly sms: SmsProvider,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async request(phone: string, locale: 'ar' | 'en', ip?: string): Promise<void> {
    await this.enforceRateLimits(phone, ip);

    const code = this.generate6DigitCode();
    const hash = await argon2.hash(code, { type: argon2.argon2id });

    const key = this.otpKey(phone);
    await this.redis.hset(key, { hash, attempts: '0', sentAt: Date.now().toString() });
    await this.redis.expire(key, this.OTP_TTL_SECONDS);

    const body = this.renderSmsBody(code, locale);
    try {
      await this.sms.send({
        toE164: phone,
        body,
        locale,
        idempotencyKey: `otp:${phone}:${Date.now()}`,
      });
    } catch (err) {
      this.logger.error({ err, phone }, 'sms send failed');
      throw new HttpException(
        { code: ERROR_CODES.SERVICE_UNAVAILABLE, message: 'Unable to send OTP right now.' },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    await this.prisma.otpAttempt
      .create({ data: { phoneE164: phone, ipAddress: ip ?? null, outcome: 'SENT' } })
      .catch((err) => this.logger.warn({ err }, 'otp audit row insert failed (non-fatal)'));

    // Dev: in non-production also surface the code to logs so engineers can flow
    // through verify without a real SIM. NEVER reach production — guarded by env.
    if (this.config.get('NODE_ENV', { infer: true }) !== 'production') {
      this.logger.debug({ phone, code }, '[DEV ONLY] OTP issued');
    }
  }

  /** Returns true on success. Throws an HttpException on failure cases. */
  async verify(phone: string, code: string): Promise<boolean> {
    // Dev-only static OTP. Opt-in via the AUTH_DEV_STATIC_OTP env var so logins
    // succeed on deployments where SMS is log-only. The var is absent by
    // default (and must stay unset in real production). `AUTH_DEV_STATIC_OTP=
    // "any"` accepts any submitted code; otherwise it must match exactly.
    const staticOtp = this.config.get('AUTH_DEV_STATIC_OTP', { infer: true });
    if (staticOtp && (staticOtp === 'any' || staticOtp === code)) {
      this.logger.warn({ phone }, '[DEV] static OTP accepted — real SMS bypassed');
      await this.redis.del(this.otpKey(phone)).catch(() => undefined);
      await this.audit(phone, 'VERIFIED');
      return true;
    }

    const key = this.otpKey(phone);
    const stored = await this.redis.hgetall(key);
    if (!stored.hash) {
      await this.audit(phone, 'EXPIRED');
      throw new HttpException(
        { code: ERROR_CODES.AUTH_OTP_EXPIRED, message: 'OTP expired or never requested.' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const attempts = Number(stored.attempts ?? 0);
    if (attempts >= this.MAX_VERIFY_ATTEMPTS) {
      await this.redis.del(key);
      await this.audit(phone, 'RATE_LIMITED');
      throw new HttpException(
        {
          code: ERROR_CODES.AUTH_OTP_RATE_LIMITED,
          message: 'Too many invalid attempts. Request a new code.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const valid = await argon2.verify(stored.hash, code);
    if (!valid) {
      await this.redis.hincrby(key, 'attempts', 1);
      await this.audit(phone, 'INVALID');
      throw new HttpException(
        { code: ERROR_CODES.AUTH_INVALID_OTP, message: 'Invalid code.' },
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.redis.del(key);
    await this.audit(phone, 'VERIFIED');
    return true;
  }

  private async enforceRateLimits(phone: string, ip?: string): Promise<void> {
    const phoneCount = await this.bumpCounter(`otp:rl:phone:${phone}`, 60);
    if (phoneCount > 1) {
      throw this.rateLimitError('Wait at least 1 minute before requesting another code.');
    }

    const phoneHour = await this.bumpCounter(`otp:rl:phone:hour:${phone}`, 3600);
    if (phoneHour > 5) {
      throw this.rateLimitError('Hourly request limit reached for this number.');
    }

    if (ip) {
      const ipHour = await this.bumpCounter(`otp:rl:ip:${ip}`, 3600);
      if (ipHour > 30) {
        throw this.rateLimitError('Hourly request limit reached for this IP.');
      }
    }
  }

  private async bumpCounter(key: string, ttlSeconds: number): Promise<number> {
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, ttlSeconds);
    }
    return count;
  }

  private rateLimitError(detail: string): HttpException {
    return new HttpException(
      { code: ERROR_CODES.AUTH_OTP_RATE_LIMITED, message: detail },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  private async audit(phone: string, outcome: string): Promise<void> {
    await this.prisma.otpAttempt
      .create({ data: { phoneE164: phone, outcome } })
      .catch(() => undefined);
  }

  private generate6DigitCode(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  private otpKey(phone: string): string {
    return `otp:${phone}`;
  }

  private renderSmsBody(code: string, locale: 'ar' | 'en'): string {
    return locale === 'ar'
      ? `رمز التحقق الخاص بك في موارد: ${code}. صالح لمدة 5 دقائق.`
      : `Your Mawared verification code: ${code}. Valid for 5 minutes.`;
  }
}
