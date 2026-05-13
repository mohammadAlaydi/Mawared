import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  CreateIntentInput,
  IntentResult,
  PaymentProvider,
  ProviderWebhookEvent,
  RefundInput,
  RefundResult,
} from './payment-provider';

/**
 * Local-dev / test provider. Generates deterministic-ish IDs and never
 * contacts an external service. Webhook verification is a no-op — tests
 * craft events directly. Active whenever STRIPE_SECRET_KEY is unset.
 */
@Injectable()
export class StubPaymentProvider implements PaymentProvider {
  private readonly logger = new Logger(StubPaymentProvider.name);

  async createIntent(input: CreateIntentInput): Promise<IntentResult> {
    const providerIntentId = `pi_stub_${randomUUID().replace(/-/g, '')}`;
    this.logger.warn(
      { event: 'payments.stub.create_intent', input },
      `[STUB] created PI ${providerIntentId} for order ${input.orderId}`,
    );
    return {
      providerIntentId,
      clientSecret: `${providerIntentId}_secret_${randomUUID().slice(0, 8)}`,
      status: 'REQUIRES_PAYMENT_METHOD',
    };
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    const providerRefundId = `re_stub_${randomUUID().replace(/-/g, '')}`;
    this.logger.warn(
      { event: 'payments.stub.refund', input },
      `[STUB] refund ${providerRefundId} for PI ${input.providerIntentId}`,
    );
    return { providerRefundId, status: 'SUCCEEDED' };
  }

  verifyWebhook(rawBody: Buffer, _signature: string): ProviderWebhookEvent {
    const parsed = JSON.parse(rawBody.toString('utf8')) as {
      id: string;
      type: string;
      data?: unknown;
    };
    return {
      providerEventId: parsed.id,
      type: parsed.type,
      payload: parsed,
    };
  }
}
