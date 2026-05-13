import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  InitiateInput,
  InitiateResult,
  ProviderVerificationStatus,
  ProviderWebhookEvent,
  VerificationProvider,
} from './verification-provider';

/**
 * Dev provider. Returns a deterministic redirect URL pointing at a stub
 * page that engineers can hit to fake a "VERIFIED" callback. Active when
 * SIGNIT_API_KEY is unset.
 */
@Injectable()
export class StubVerificationProvider implements VerificationProvider {
  private readonly logger = new Logger(StubVerificationProvider.name);

  async initiate(input: InitiateInput): Promise<InitiateResult> {
    const providerSessionId = `sig_stub_${randomUUID().replace(/-/g, '')}`;
    const redirectUrl = `${input.callbackUrl}?sessionId=${providerSessionId}&status=VERIFIED`;
    this.logger.warn(
      { event: 'verification.stub.initiate', input, providerSessionId },
      `[STUB] verification ${providerSessionId} for customer ${input.customerId}`,
    );
    return { providerSessionId, redirectUrl };
  }

  async fetchStatus(providerSessionId: string): Promise<ProviderVerificationStatus> {
    return { providerSessionId, status: 'VERIFIED', verifiedAt: new Date() };
  }

  verifyWebhook(rawBody: Buffer): ProviderWebhookEvent {
    const parsed = JSON.parse(rawBody.toString('utf8')) as {
      sessionId: string;
      status: 'VERIFIED' | 'FAILED';
      failureReason?: string;
    };
    return {
      providerSessionId: parsed.sessionId,
      status: parsed.status,
      failureReason: parsed.failureReason,
      raw: parsed,
    };
  }
}
