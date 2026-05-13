import { Logger, Module, type Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VerificationsController } from './verifications.controller';
import { VerificationsService } from './verifications.service';
import { StubVerificationProvider } from './stub-verification.provider';
import { SignitVerificationProvider } from './signit-verification.provider';
import {
  VERIFICATION_PROVIDER,
  type VerificationProvider,
} from './verification-provider';
import type { Env } from '@/shared/config/env.schema';

/**
 * Selects Signit or the stub based on env. SIGNIT_API_KEY + WEBHOOK_SECRET
 * together activate the real provider.
 */
const factory: Provider = {
  provide: VERIFICATION_PROVIDER,
  inject: [ConfigService, StubVerificationProvider, SignitVerificationProvider],
  useFactory: (
    config: ConfigService<Env, true>,
    stub: StubVerificationProvider,
    signit: SignitVerificationProvider,
  ): VerificationProvider => {
    const logger = new Logger('VerificationsModule');
    const hasSignit = !!(
      config.get('SIGNIT_API_KEY', { infer: true }) &&
      config.get('SIGNIT_WEBHOOK_SECRET', { infer: true })
    );
    if (hasSignit) {
      logger.log('Verification provider: Signit.sa');
      return signit;
    }
    logger.warn(
      'Verification provider: stub (set SIGNIT_API_KEY + SIGNIT_WEBHOOK_SECRET to enable)',
    );
    return stub;
  },
};

@Module({
  controllers: [VerificationsController],
  providers: [VerificationsService, StubVerificationProvider, SignitVerificationProvider, factory],
  exports: [VerificationsService],
})
export class VerificationsModule {}
