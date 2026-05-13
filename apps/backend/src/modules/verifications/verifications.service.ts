import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, type VerificationStatus } from '@prisma/client';
import { ERROR_CODES } from '@mawared/shared-types';
import { PrismaService } from '@/shared/prisma/prisma.service';
import {
  VERIFICATION_PROVIDER,
  type VerificationProvider,
} from './verification-provider';
import type { Env } from '@/shared/config/env.schema';

/**
 * Identity verification (Signit.sa) coordinator.
 *
 * Public flow:
 *   POST /v1/me/verification/start  → provider.initiate → returns redirectUrl
 *   customer completes provider UX → provider webhook → /v1/verifications/webhooks/signit
 *   we mark Customer.verificationStatus = VERIFIED (or FAILED)
 *
 * Order gate:
 *   OrdersService.create reads Customer.verificationStatus +
 *   verificationExpiresAt before reserving a worker. NOT_VERIFIED /
 *   PENDING / FAILED / EXPIRED → 403 with code VERIFICATION_REQUIRED.
 */
@Injectable()
export class VerificationsService {
  private readonly logger = new Logger(VerificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(VERIFICATION_PROVIDER) private readonly provider: VerificationProvider,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async getStatus(customerId: string) {
    const c = await this.prisma.customer.findUnique({
      where: { userId: customerId },
      select: {
        verificationStatus: true,
        verificationLastCheckedAt: true,
        verificationExpiresAt: true,
        user: { select: { phoneE164: true } },
      },
    });
    if (!c) {
      throw new HttpException(
        { code: ERROR_CODES.NOT_FOUND, message: 'Customer not found.' },
        HttpStatus.NOT_FOUND,
      );
    }
    return {
      status: c.verificationStatus,
      lastCheckedAt: c.verificationLastCheckedAt,
      expiresAt: c.verificationExpiresAt,
      canOrder: this.canOrder(c.verificationStatus, c.verificationExpiresAt),
    };
  }

  async start(customerId: string, preferredLocale: 'ar' | 'en') {
    const customer = await this.prisma.customer.findUnique({
      where: { userId: customerId },
      include: { user: { select: { phoneE164: true } } },
    });
    if (!customer) {
      throw new HttpException(
        { code: ERROR_CODES.NOT_FOUND, message: 'Customer not found.' },
        HttpStatus.NOT_FOUND,
      );
    }
    if (
      customer.verificationStatus === 'VERIFIED' &&
      this.stillValid(customer.verificationExpiresAt)
    ) {
      throw new HttpException(
        { code: ERROR_CODES.CONFLICT, message: 'Already verified.' },
        HttpStatus.CONFLICT,
      );
    }

    const callbackUrl =
      this.config.get('SIGNIT_CALLBACK_URL', { infer: true }) ??
      'http://localhost:3000/v1/verifications/webhooks/signit';
    const result = await this.provider.initiate({
      customerId,
      phone: customer.user.phoneE164 ?? '',
      preferredLocale,
      callbackUrl,
    });

    await this.prisma.$transaction([
      this.prisma.identityVerification.create({
        data: {
          customerId,
          providerSessionId: result.providerSessionId,
          status: 'PENDING',
          redirectUrl: result.redirectUrl,
        },
      }),
      this.prisma.customer.update({
        where: { userId: customerId },
        data: {
          verificationStatus: 'PENDING',
          verificationLastCheckedAt: new Date(),
        },
      }),
    ]);

    return {
      redirectUrl: result.redirectUrl,
      providerSessionId: result.providerSessionId,
      status: 'PENDING' as VerificationStatus,
    };
  }

  /**
   * Webhook ingest. Verifies signature, finds the IdentityVerification row,
   * updates Customer.verificationStatus accordingly.
   */
  async ingestWebhook(rawBody: Buffer, signatureHeader: string): Promise<void> {
    const event = this.provider.verifyWebhook(rawBody, signatureHeader);

    const verification = await this.prisma.identityVerification.findUnique({
      where: { providerSessionId: event.providerSessionId },
      select: { id: true, customerId: true },
    });
    if (!verification) {
      this.logger.warn(
        { providerSessionId: event.providerSessionId },
        'signit webhook for unknown session — ignoring',
      );
      return;
    }

    const now = new Date();
    const ttlDays = this.config.get('VERIFICATION_TTL_DAYS', { infer: true });
    const expiresAt =
      event.status === 'VERIFIED'
        ? new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000)
        : null;

    await this.prisma.$transaction([
      this.prisma.identityVerification.update({
        where: { id: verification.id },
        data: {
          status: event.status,
          completedAt: now,
          expiresAt,
          failureReason: event.failureReason ?? null,
          callbackPayload: event.raw as Prisma.InputJsonValue,
        },
      }),
      this.prisma.customer.update({
        where: { userId: verification.customerId },
        data: {
          verificationStatus: event.status,
          verificationLastCheckedAt: now,
          verificationExpiresAt: expiresAt,
        },
      }),
    ]);
  }

  /**
   * Called from OrdersService.create. Throws 403 with a structured code
   * the mobile app uses to deep-link the customer to the verification UX.
   */
  async assertCanOrder(customerId: string): Promise<void> {
    const c = await this.prisma.customer.findUnique({
      where: { userId: customerId },
      select: { verificationStatus: true, verificationExpiresAt: true },
    });
    if (!c || !this.canOrder(c.verificationStatus, c.verificationExpiresAt)) {
      throw new HttpException(
        {
          code: 'VERIFICATION_REQUIRED',
          message: 'Identity verification is required before placing an order.',
        },
        HttpStatus.FORBIDDEN,
      );
    }
  }

  /**
   * Staff manual override (admin dashboard). Treated as
   * VerificationProvider = MANUAL so audit shows the actor + reason.
   */
  async manualOverride(
    customerId: string,
    status: 'VERIFIED' | 'FAILED' | 'NOT_VERIFIED',
    staffId: string,
    reason?: string,
  ) {
    const now = new Date();
    const ttlDays = this.config.get('VERIFICATION_TTL_DAYS', { infer: true });
    const expiresAt =
      status === 'VERIFIED'
        ? new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000)
        : null;

    await this.prisma.$transaction([
      this.prisma.identityVerification.create({
        data: {
          customerId,
          provider: 'MANUAL',
          status,
          failureReason: reason ?? null,
          completedAt: now,
          expiresAt,
          callbackPayload: { staffId, reason } as Prisma.InputJsonValue,
        },
      }),
      this.prisma.customer.update({
        where: { userId: customerId },
        data: {
          verificationStatus: status,
          verificationLastCheckedAt: now,
          verificationExpiresAt: expiresAt,
        },
      }),
    ]);
  }

  private canOrder(status: VerificationStatus, expiresAt: Date | null): boolean {
    if (status !== 'VERIFIED') return false;
    return this.stillValid(expiresAt);
  }

  private stillValid(expiresAt: Date | null | undefined): boolean {
    if (!expiresAt) return false;
    return expiresAt.getTime() > Date.now();
  }
}
