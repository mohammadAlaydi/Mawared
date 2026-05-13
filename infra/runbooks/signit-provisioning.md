# Signit.sa identity verification — provisioning + activation

This runbook is the only thing left between the code we shipped in Phase 9
and a real verified customer signing their first contract.

## What's already done in code

| Piece | Where | Status |
|---|---|---|
| Provider interface | `apps/backend/src/modules/verifications/verification-provider.ts` | ✅ |
| Real Signit adapter | `signit-verification.provider.ts` (Bearer auth, HMAC-SHA-256 webhook) | ✅ |
| Dev stub (fallback) | `stub-verification.provider.ts` | ✅ |
| Env-gated factory | `verifications.module.ts` — picks Signit when `SIGNIT_API_KEY` + `SIGNIT_WEBHOOK_SECRET` are both set | ✅ |
| Schema | `Customer.verificationStatus` + `IdentityVerification` table + `VerificationStatus` enum | ✅ |
| Migration | `prisma/migrations/20260514000000_signit_roles_whatsapp/migration.sql` | ✅ |
| Customer API | `GET /v1/me/verification`, `POST /v1/me/verification/start` | ✅ |
| Webhook ingest | `POST /v1/verifications/webhooks/signit` (public, raw-body, signature-verified) | ✅ |
| Order gate | `OrdersService.create` → `VerificationsService.assertCanOrder` → 403 `VERIFICATION_REQUIRED` | ✅ |
| Admin view | `GET /v1/admin/customers/:id/verification` (history) | ✅ |
| Admin override | `POST /v1/admin/customers/:id/verification/override` (audit-logged) | ✅ |
| Env vars | `SIGNIT_BASE_URL`, `SIGNIT_API_KEY`, `SIGNIT_WEBHOOK_SECRET`, `SIGNIT_CALLBACK_URL`, `VERIFICATION_TTL_DAYS` | ✅ |
| Error codes shared with clients | `VERIFICATION_REQUIRED / PENDING / FAILED / EXPIRED` in `@mawared/shared-types` | ✅ |

**As of right now:** if you set `SIGNIT_API_KEY` to literally any non-empty
string, the backend stops using the stub and starts calling
`https://api.signit.sa`. So the integration is one env var away from
firing.

## What's blocked on Signit.sa themselves

These are the inputs only their team can provide:

1. **Sandbox merchant account** (test environment).
2. **Production merchant account** (live environment, separate keys).
3. **API key / Bearer token** per environment.
4. **Webhook signing secret** per environment.
5. **Confirmed REST contract** — request/response field names. Our adapter assumes:

   | Operation | Method | Path | Request body | Response body |
   |---|---|---|---|---|
   | Initiate | `POST` | `/v1/sessions` | `{ externalCustomerId, phone, locale, callbackUrl }` | `{ sessionId, redirectUrl }` |
   | Fetch status | `GET` | `/v1/sessions/{id}` | — | `{ status, failureReason?, verifiedAt?, nationalIdLast4? }` |
   | Webhook | inbound | `/v1/verifications/webhooks/signit` (our URL) | `{ sessionId, status, failureReason? }` | — |
   | Signature | header `X-Signit-Signature` = hex HMAC-SHA-256 of raw body using `SIGNIT_WEBHOOK_SECRET` | — | — | — |

   These are the typical shapes for verification APIs. **If Signit's
   actual contract differs**, only the JSON field names / header name in
   `signit-verification.provider.ts` need adjusting — about a 5-minute
   change. Look for the `await fetch(...)` blocks and the `verifyWebhook`
   header lookup.

6. **Whitelist of allowed callback URLs** (`SIGNIT_CALLBACK_URL`) in
   their dashboard. Provide both staging and production:
   - Staging: `https://staging.api.mawared.example/v1/verifications/webhooks/signit`
   - Production: `https://api.mawared.example/v1/verifications/webhooks/signit`

## Step-by-step activation

### Sandbox

1. Sign up at <https://signit.sa> (or whatever the merchant portal URL is).
2. From their dashboard, generate a **sandbox API key** + **webhook
   signing secret**.
3. Set in Railway **staging** environment:
   ```
   SIGNIT_BASE_URL=https://sandbox.signit.sa
   SIGNIT_API_KEY=<sandbox key>
   SIGNIT_WEBHOOK_SECRET=<sandbox webhook secret>
   SIGNIT_CALLBACK_URL=https://staging.api.mawared.example/v1/verifications/webhooks/signit
   VERIFICATION_TTL_DAYS=365
   ```
4. Redeploy `api` + `worker` services.
5. Confirm in logs: `Verification provider: Signit.sa` (not "stub").
6. Run the smoke test (see below). If field-name mismatches show up,
   adjust `signit-verification.provider.ts` and ship.

### Production

Same as sandbox but:

- `SIGNIT_BASE_URL=https://api.signit.sa`
- Production keys (rotate sandbox keys out — never share them).
- Production webhook URL whitelisted in their dashboard.
- Reset all `IdentityVerification` rows in the prod DB before go-live so
  no stale stub data slips through:
  ```sql
  -- DESTRUCTIVE: only run on a fresh prod DB.
  TRUNCATE TABLE "IdentityVerification";
  UPDATE "Customer" SET
    "verificationStatus" = 'NOT_VERIFIED',
    "verificationLastCheckedAt" = NULL,
    "verificationExpiresAt" = NULL;
  ```

## Smoke test

Run from your laptop against staging (or local dev):

```bash
# 1. Sign in as a customer, capture an access token.
ACCESS=$(curl -sX POST $API_URL/v1/auth/otp/verify \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+966500000001","code":"123456","deviceId":"00000000-0000-0000-0000-000000000001"}' \
  | jq -r .accessToken)

# 2. Read the current verification state — should be NOT_VERIFIED.
curl -s $API_URL/v1/me/verification -H "Authorization: Bearer $ACCESS" | jq .

# 3. Initiate a Signit session — should return a redirectUrl pointing at signit.sa.
curl -sX POST $API_URL/v1/me/verification/start \
  -H "Authorization: Bearer $ACCESS" \
  -H 'Content-Type: application/json' \
  -d '{"locale":"ar"}' | jq .

# 4. Open the redirectUrl in a browser, complete Signit's flow.
# 5. Signit calls our webhook → Customer.verificationStatus flips to VERIFIED.

# 6. Re-read — should now be VERIFIED with an expiresAt 365 days out.
curl -s $API_URL/v1/me/verification -H "Authorization: Bearer $ACCESS" | jq .

# 7. Try placing an order — should now succeed (instead of 403 VERIFICATION_REQUIRED).
curl -sX POST $API_URL/v1/orders \
  -H "Authorization: Bearer $ACCESS" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{"workerId":"...","packageId":"...","addressId":"..."}' | jq .
```

There's also a Node script at `infra/scripts/signit-smoke.ts` that
exercises steps 2–3 and 6 end-to-end against any environment.

## Common adjustments after the first sandbox call

| If Signit returns... | Fix |
|---|---|
| `400 invalid field "externalCustomerId"` | They use a different key — rename in `signit-verification.provider.ts:initiate()`. |
| `401 missing API key` | Their header is `X-API-Key` not `Authorization: Bearer`. Swap in `requireKey()`. |
| Signature header is `Signit-Signature` (no `X-`) | Update the controller's `req.headers['x-signit-signature']` lookup. |
| Signature is base64 not hex | Change `Buffer.from(...).digest('hex')` → `.digest('base64')` in `verifyWebhook`. |
| Their statuses are `COMPLETE`/`REJECT` | Add to the `mapStatus` switch. |

All five of these are <5 minute fixes — no architectural change needed.

## Manual fallback

If Signit is down or hasn't issued credentials yet but you need to onboard
customers, super-admin can flip individual customers to `VERIFIED` via:

```
POST /v1/admin/customers/{customerId}/verification/override
Authorization: Bearer <admin-token>
{ "status": "VERIFIED", "reason": "manual KYC during Signit outage" }
```

Every manual override is audit-logged (`customer.verification.override`
action) and persists in `IdentityVerification` rows with
`provider=MANUAL`. **Don't make this a habit** — it's a break-glass tool.
