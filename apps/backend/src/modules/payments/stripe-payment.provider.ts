import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type {
  CreateIntentInput,
  IntentResult,
  PaymentProvider,
  ProviderIntentStatus,
  ProviderWebhookEvent,
  RefundInput,
  RefundResult,
} from './payment-provider';
import type { Env } from '@/shared/config/env.schema';

/**
 * Real Stripe adapter. Talks to the REST API over fetch (no `stripe` SDK
 * dep). Webhook signatures are verified with the documented v1 scheme:
 * `t=<unix>,v1=<hex hmac>` over `${t}.${rawBody}` with `STRIPE_WEBHOOK_SECRET`.
 */
@Injectable()
export class StripePaymentProvider implements PaymentProvider {
  private readonly logger = new Logger(StripePaymentProvider.name);
  private static readonly TOLERANCE_SECONDS = 300; // 5 min

  constructor(private readonly config: ConfigService<Env, true>) {}

  async createIntent(input: CreateIntentInput): Promise<IntentResult> {
    const secret = this.requireSecret();
    const form = new URLSearchParams();
    form.set('amount', input.amountMinor.toString());
    form.set('currency', input.currency.toLowerCase());
    form.set('metadata[orderId]', input.orderId);
    if (input.metadata) {
      for (const [k, v] of Object.entries(input.metadata)) {
        form.set(`metadata[${k}]`, v);
      }
    }
    form.set('automatic_payment_methods[enabled]', 'true');

    const res = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': input.idempotencyKey,
      },
      body: form.toString(),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '<no body>');
      this.logger.error({ status: res.status, body: text }, 'stripe create intent failed');
      throw new Error(`Stripe create intent failed: ${res.status}`);
    }
    const pi = (await res.json()) as {
      id: string;
      client_secret: string;
      status: string;
    };
    return {
      providerIntentId: pi.id,
      clientSecret: pi.client_secret,
      status: this.mapStatus(pi.status),
    };
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    const secret = this.requireSecret();
    const form = new URLSearchParams();
    form.set('payment_intent', input.providerIntentId);
    form.set('amount', input.amountMinor.toString());
    if (input.reason) form.set('reason', input.reason);

    const res = await fetch('https://api.stripe.com/v1/refunds', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': input.idempotencyKey,
      },
      body: form.toString(),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '<no body>');
      this.logger.error({ status: res.status, body: text }, 'stripe refund failed');
      throw new Error(`Stripe refund failed: ${res.status}`);
    }
    const body = (await res.json()) as { id: string; status: string };
    return {
      providerRefundId: body.id,
      status: this.mapRefundStatus(body.status),
    };
  }

  verifyWebhook(rawBody: Buffer, signature: string): ProviderWebhookEvent {
    const whSecret = this.config.get('STRIPE_WEBHOOK_SECRET', { infer: true });
    if (!whSecret) throw new Error('STRIPE_WEBHOOK_SECRET not set');

    const parts = Object.fromEntries(
      signature.split(',').map((kv) => {
        const idx = kv.indexOf('=');
        return [kv.slice(0, idx), kv.slice(idx + 1)];
      }),
    ) as { t?: string; v1?: string };
    if (!parts.t || !parts.v1) throw new Error('malformed stripe signature header');

    const tsSec = Number(parts.t);
    const ageSec = Math.abs(Date.now() / 1000 - tsSec);
    if (!Number.isFinite(tsSec) || ageSec > StripePaymentProvider.TOLERANCE_SECONDS) {
      throw new Error('stripe webhook timestamp outside tolerance');
    }

    const signedPayload = `${parts.t}.${rawBody.toString('utf8')}`;
    const expected = createHmac('sha256', whSecret).update(signedPayload).digest('hex');
    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(parts.v1, 'hex');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new Error('stripe webhook signature mismatch');
    }

    const parsed = JSON.parse(rawBody.toString('utf8')) as {
      id: string;
      type: string;
      data?: unknown;
    };
    return { providerEventId: parsed.id, type: parsed.type, payload: parsed };
  }

  private requireSecret(): string {
    const s = this.config.get('STRIPE_SECRET_KEY', { infer: true });
    if (!s) throw new Error('STRIPE_SECRET_KEY not set');
    return s;
  }

  private mapStatus(s: string): ProviderIntentStatus {
    switch (s) {
      case 'requires_payment_method': return 'REQUIRES_PAYMENT_METHOD';
      case 'requires_confirmation':   return 'REQUIRES_CONFIRMATION';
      case 'requires_action':         return 'REQUIRES_ACTION';
      case 'processing':              return 'PROCESSING';
      case 'succeeded':               return 'SUCCEEDED';
      case 'canceled':                return 'CANCELED';
      default:                        return 'FAILED';
    }
  }

  private mapRefundStatus(s: string): RefundResult['status'] {
    switch (s) {
      case 'succeeded': return 'SUCCEEDED';
      case 'pending':   return 'PENDING';
      case 'canceled':  return 'CANCELED';
      default:          return 'FAILED';
    }
  }
}
