import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { SmsProvider } from './sms.provider';

/**
 * Dev / test SMS provider. Prints the message to logs instead of calling
 * Twilio. Used whenever TWILIO_* env vars are not set (M0/M1 local dev).
 */
@Injectable()
export class LogSmsProvider implements SmsProvider {
  private readonly logger = new Logger(LogSmsProvider.name);

  async send(input: {
    toE164: string;
    body: string;
    locale: 'ar' | 'en';
    idempotencyKey: string;
  }): Promise<{ providerMessageId: string }> {
    this.logger.warn(
      {
        event: 'sms.send.log_only',
        to: input.toE164,
        body: input.body,
        locale: input.locale,
        idempotencyKey: input.idempotencyKey,
      },
      `[DEV SMS] to=${input.toE164} body="${input.body}"`,
    );
    return { providerMessageId: `log_${randomUUID()}` };
  }
}
