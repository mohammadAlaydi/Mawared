import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type {
  InitiateInput,
  InitiateResult,
  ProviderVerificationStatus,
  ProviderWebhookEvent,
  VerificationProvider,
} from './verification-provider';
import type { Env } from '@/shared/config/env.schema';

/**
 * Signit.sa adapter. Active when SIGNIT_API_KEY is set.
 *
 * The Signit REST surface is owned by their team and may evolve; this
 * adapter uses the convention documented in their integration guide
 * (Bearer auth, `/v1/sessions` for initiation, `/v1/sessions/{id}` for
 * status, HMAC-SHA-256 webhook signature in the `X-Signit-Signature`
 * header). Adjust to match the contract you receive after sandbox sign-up.
 */
@Injectable()
export class SignitVerificationProvider implements VerificationProvider {
  private readonly logger = new Logger(SignitVerificationProvider.name);

  constructor(private readonly config: ConfigService<Env, true>) {}

  async initiate(input: InitiateInput): Promise<InitiateResult> {
    const baseUrl = this.config.get('SIGNIT_BASE_URL', { infer: true });
    const apiKey = this.requireKey();

    const res = await fetch(`${baseUrl}/v1/sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        externalCustomerId: input.customerId,
        phone: input.phone,
        locale: input.preferredLocale,
        callbackUrl: input.callbackUrl,
      }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      this.logger.error({ status: res.status, body: txt }, 'signit initiate failed');
      throw new Error(`signit initiate failed: ${res.status}`);
    }
    const body = (await res.json()) as { sessionId: string; redirectUrl: string };
    return { providerSessionId: body.sessionId, redirectUrl: body.redirectUrl };
  }

  async fetchStatus(providerSessionId: string): Promise<ProviderVerificationStatus> {
    const baseUrl = this.config.get('SIGNIT_BASE_URL', { infer: true });
    const apiKey = this.requireKey();
    const res = await fetch(`${baseUrl}/v1/sessions/${providerSessionId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) throw new Error(`signit fetchStatus failed: ${res.status}`);
    const body = (await res.json()) as {
      status: string;
      failureReason?: string;
      verifiedAt?: string;
      nationalIdLast4?: string;
    };
    return {
      providerSessionId,
      status: this.mapStatus(body.status),
      failureReason: body.failureReason,
      verifiedAt: body.verifiedAt ? new Date(body.verifiedAt) : undefined,
      nationalIdLast4: body.nationalIdLast4,
    };
  }

  verifyWebhook(rawBody: Buffer, signatureHeader: string): ProviderWebhookEvent {
    const secret = this.config.get('SIGNIT_WEBHOOK_SECRET', { infer: true });
    if (!secret) throw new Error('SIGNIT_WEBHOOK_SECRET not set');

    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(signatureHeader, 'hex');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new Error('signit webhook signature mismatch');
    }

    const parsed = JSON.parse(rawBody.toString('utf8')) as {
      sessionId: string;
      status: string;
      failureReason?: string;
    };
    return {
      providerSessionId: parsed.sessionId,
      status: this.mapStatus(parsed.status) === 'VERIFIED' ? 'VERIFIED' : 'FAILED',
      failureReason: parsed.failureReason,
      raw: parsed,
    };
  }

  private mapStatus(s: string): 'PENDING' | 'VERIFIED' | 'FAILED' {
    switch (s.toUpperCase()) {
      case 'COMPLETED':
      case 'VERIFIED':
      case 'SUCCEEDED':
        return 'VERIFIED';
      case 'FAILED':
      case 'REJECTED':
      case 'EXPIRED':
        return 'FAILED';
      default:
        return 'PENDING';
    }
  }

  private requireKey(): string {
    const k = this.config.get('SIGNIT_API_KEY', { infer: true });
    if (!k) throw new Error('SIGNIT_API_KEY not set');
    return k;
  }
}
