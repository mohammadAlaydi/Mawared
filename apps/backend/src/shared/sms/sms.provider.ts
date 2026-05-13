export interface SmsProvider {
  /**
   * Send a transactional SMS. Implementations MUST be idempotent on retries
   * keyed by `idempotencyKey` — the caller (BullMQ worker) may retry on
   * network errors.
   */
  send(input: {
    toE164: string;
    body: string;
    locale: 'ar' | 'en';
    idempotencyKey: string;
  }): Promise<{ providerMessageId: string }>;
}

export const SMS_PROVIDER = Symbol('SMS_PROVIDER');
