import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SmsProvider } from './sms.provider';
import type { Env } from '../config/env.schema';

/**
 * Real Twilio adapter. Active when all three TWILIO_* env vars are set.
 *
 * NOTE: We POST to the REST API directly (no twilio SDK dep) to keep the
 * dependency surface small. The body is x-www-form-urlencoded, Basic-Auth
 * with accountSid:authToken.
 */
@Injectable()
export class TwilioSmsProvider implements SmsProvider {
  private readonly logger = new Logger(TwilioSmsProvider.name);

  constructor(private readonly config: ConfigService<Env, true>) {}

  async send(input: {
    toE164: string;
    body: string;
    locale: 'ar' | 'en';
    idempotencyKey: string;
  }): Promise<{ providerMessageId: string }> {
    const sid = this.config.get('TWILIO_ACCOUNT_SID', { infer: true });
    const token = this.config.get('TWILIO_AUTH_TOKEN', { infer: true });
    const from = this.config.get('TWILIO_FROM_NUMBER', { infer: true });
    if (!sid || !token || !from) {
      throw new Error('Twilio not fully configured — refusing to send.');
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const form = new URLSearchParams({ To: input.toE164, From: from, Body: input.body });
    const auth = Buffer.from(`${sid}:${token}`).toString('base64');

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'I-Twilio-Idempotency-Token': input.idempotencyKey,
      },
      body: form.toString(),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '<no body>');
      this.logger.error(
        { status: res.status, body: text, to: input.toE164 },
        'twilio send failed',
      );
      throw new Error(`Twilio send failed: ${res.status}`);
    }
    const body = (await res.json()) as { sid?: string };
    return { providerMessageId: body.sid ?? '' };
  }
}
