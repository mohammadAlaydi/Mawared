/**
 * Stripe-flavored payment provider interface. Implementations:
 *   - StripeProvider     — production (M2 follow-up)
 *   - StubPaymentProvider — local dev / tests, returns deterministic IDs
 *   - MoyasarProvider    — added when Mada support lands (post-MVP)
 *
 * The booking + payments services depend only on this interface — swapping
 * providers is a single binding change in PaymentsModule.
 */

export interface CreateIntentInput {
  orderId: string;
  amountMinor: bigint;
  currency: string;
  customerEmailOrPhone?: string;
  metadata?: Record<string, string>;
  idempotencyKey: string;
}

export interface IntentResult {
  providerIntentId: string;
  clientSecret: string;
  status: ProviderIntentStatus;
}

export interface RefundInput {
  providerIntentId: string;
  amountMinor: bigint;
  reason?: string;
  idempotencyKey: string;
}

export interface RefundResult {
  providerRefundId: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED';
}

export type ProviderIntentStatus =
  | 'REQUIRES_PAYMENT_METHOD'
  | 'REQUIRES_CONFIRMATION'
  | 'REQUIRES_ACTION'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'CANCELED'
  | 'FAILED';

export interface ProviderWebhookEvent {
  providerEventId: string;
  type: string;
  payload: unknown;
}

export interface PaymentProvider {
  createIntent(input: CreateIntentInput): Promise<IntentResult>;
  refund(input: RefundInput): Promise<RefundResult>;
  verifyWebhook(rawBody: Buffer, signature: string): ProviderWebhookEvent;
}

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');
