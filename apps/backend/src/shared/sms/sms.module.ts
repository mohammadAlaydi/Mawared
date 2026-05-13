import { Global, Module } from '@nestjs/common';
import { LogSmsProvider } from './log-sms.provider';
import { SMS_PROVIDER } from './sms.provider';

/**
 * SMS module. For M1 we ship the LogSmsProvider only; the Twilio
 * implementation lands when TWILIO_* env vars are provisioned. The
 * `SmsProvider` interface is the public contract — callers don't need
 * to know which provider is active.
 */
@Global()
@Module({
  providers: [LogSmsProvider, { provide: SMS_PROVIDER, useExisting: LogSmsProvider }],
  exports: [SMS_PROVIDER],
})
export class SmsModule {}
