import { Global, Logger, Module, type Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LogSmsProvider } from './log-sms.provider';
import { TwilioSmsProvider } from './twilio-sms.provider';
import { SMS_PROVIDER, type SmsProvider } from './sms.provider';
import type { Env } from '../config/env.schema';

/**
 * Selects the SMS provider based on env. If all Twilio creds are present,
 * uses Twilio; otherwise falls back to LogSmsProvider (dev / test).
 */
const smsProviderFactory: Provider = {
  provide: SMS_PROVIDER,
  inject: [ConfigService, LogSmsProvider, TwilioSmsProvider],
  useFactory: (
    config: ConfigService<Env, true>,
    log: LogSmsProvider,
    twilio: TwilioSmsProvider,
  ): SmsProvider => {
    const logger = new Logger('SmsModule');
    const hasTwilio = !!(
      config.get('TWILIO_ACCOUNT_SID', { infer: true }) &&
      config.get('TWILIO_AUTH_TOKEN', { infer: true }) &&
      config.get('TWILIO_FROM_NUMBER', { infer: true })
    );
    if (hasTwilio) {
      logger.log('SMS provider: Twilio');
      return twilio;
    }
    logger.warn('SMS provider: log-only (set TWILIO_* env vars to enable Twilio)');
    return log;
  },
};

@Global()
@Module({
  providers: [LogSmsProvider, TwilioSmsProvider, smsProviderFactory],
  exports: [SMS_PROVIDER],
})
export class SmsModule {}
