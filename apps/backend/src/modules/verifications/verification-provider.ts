/**
 * Identity-verification provider interface. Implementations:
 *   - SignitVerificationProvider — production (signit.sa, KSA national-ID)
 *   - StubVerificationProvider   — local dev / tests, deterministic IDs,
 *                                  never contacts an external service.
 *
 * Spec: docs/backend/Mawared_Al_Dawliah_Feature_List_Workflows §3.
 */

export interface InitiateInput {
  customerId: string;
  phone: string;
  preferredLocale: 'ar' | 'en';
  callbackUrl: string;
}

export interface InitiateResult {
  providerSessionId: string;
  redirectUrl: string;          // we send the customer here; provider does its UX
}

export interface ProviderVerificationStatus {
  providerSessionId: string;
  status: 'PENDING' | 'VERIFIED' | 'FAILED';
  failureReason?: string;
  verifiedAt?: Date;
  nationalIdLast4?: string;     // optional, surfaced in admin only
}

export interface ProviderWebhookEvent {
  providerSessionId: string;
  status: 'VERIFIED' | 'FAILED';
  failureReason?: string;
  raw: unknown;                  // full body, persisted for audit
}

export interface VerificationProvider {
  initiate(input: InitiateInput): Promise<InitiateResult>;
  fetchStatus(providerSessionId: string): Promise<ProviderVerificationStatus>;
  verifyWebhook(rawBody: Buffer, signatureHeader: string): ProviderWebhookEvent;
}

export const VERIFICATION_PROVIDER = Symbol('VERIFICATION_PROVIDER');
