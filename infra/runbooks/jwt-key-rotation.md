# JWT key rotation runbook

## When

- Quarterly per policy.
- Immediately on suspected compromise.
- Whenever the JWT_PRIVATE_KEY env var has been exposed in logs / chat / a PR.

## Pre-flight

- Active sessions: `SELECT COUNT(*) FROM "Session" WHERE "revokedAt" IS NULL;`
- Tokens currently in flight: access tokens TTL 15 min, refresh tokens TTL 30 d.
- Goal: rotate without forcing every user to re-OTP. Approach: dual-validate during the grace window.

## Procedure (zero-downtime, supports current code path)

The current `JwtStrategy` accepts ONE public key. Rotation is therefore a
short, planned full-rotation. For true zero-downtime we'd need to switch
the strategy to JWKS-based key lookup (a TODO logged below).

### Plan A — full rotation (current implementation)

1. **Generate new keypair** locally:
   ```bash
   openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out new-private.pem
   openssl rsa -in new-private.pem -pubout -out new-public.pem
   ```
2. **Update env vars** in Railway:
   - `JWT_PRIVATE_KEY` = contents of `new-private.pem` (escape newlines!)
   - `JWT_PUBLIC_KEY`  = contents of `new-public.pem`
3. **Deploy**. New tokens are signed with the new key.
4. **Revoke all sessions** to force a clean fan-out:
   ```sql
   UPDATE "Session" SET "revokedAt" = now() WHERE "revokedAt" IS NULL;
   UPDATE "RefreshToken" SET "revokedAt" = now() WHERE "revokedAt" IS NULL;
   ```
   Customers re-OTP next time the app opens. (~5 s of friction once.)
5. **Verify JWKS** updated: `curl https://api.mawared.local/.well-known/jwks.json`.

### Plan B — graceful (future)

When `JwtStrategy` switches to `secretOrKeyProvider` reading the JWKS
endpoint with a `kid` lookup, rotation is:

1. Add new key (kid `mawared-v2`) alongside the old (kid `mawared-v1`).
2. Sign new tokens with `v2`; verifier accepts both.
3. After 30 d (refresh TTL), remove `v1` from JWKS.

Tracked as ADR-022 in `docs/backend/05-DECISIONS.md` (to be added).

## Verification

- A new sign-in produces a token whose `iss` matches `JWT_ISSUER` and signature verifies against `JWT_PUBLIC_KEY`.
- `/.well-known/jwks.json` returns the new key.
- Old tokens fail with 401 after revocation.

## Postmortem (if rotation was triggered by leak)

- Where did the leak surface? Pino redaction paths covering it?
- Was JWT_PRIVATE_KEY ever in a log file? `grep -r 'BEGIN PRIVATE KEY' /var/log/`
- Add the new exposure path to `shared/logger/logger.module.ts` redact list.
