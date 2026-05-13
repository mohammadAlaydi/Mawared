# Go-live checklist — Mawared backend → real customers

Order is opinionated: items earlier in the list block items later. Strike
through when done. Track in a GitHub Issues milestone called `Go-live`.

---

## 1. Domain + DNS

- [ ] Register `mawared.example` (or final brand domain). Verify ownership.
- [ ] DNS records:
  - `A`/`ALIAS`  `api.mawared.example`      → Railway production service
  - `CNAME`      `admin.mawared.example`    → Vercel deployment
  - `CNAME`      `www.mawared.example`      → Vercel marketing site
  - `CNAME`      `cdn.mawared.example`      → Cloudflare R2 public hostname
- [ ] TLS: managed certs via the provider; HSTS preload submission.

## 2. Postgres (production)

- [ ] Provision Railway Postgres 16 in the **Frankfurt** region (closest to KSA).
- [ ] Connection pool: PgBouncer add-on, transaction mode.
- [ ] Set `DATABASE_URL` (PgBouncer) and `DIRECT_DATABASE_URL` (direct) in Railway env.
- [ ] Run `pnpm prisma migrate deploy` via Railway pre-deploy command. Verify in `_prisma_migrations`.
- [ ] Apply post-init constraints — `apps/backend/prisma/migrations/99_post_init_constraints/migration.sql`.
- [ ] Seed only the super-admin + service catalog (no fake workers). Rotate `ChangeMe!2026`.
- [ ] Schedule daily backup via `infra/scripts/pg-backup.sh` (Railway cron or GitHub Action).
- [ ] Run `infra/scripts/pg-restore-drill.sh` against a scratch DB. Confirm row counts.

## 3. Redis (production)

- [ ] Provision Railway Redis 7. Single instance is fine for v1.
- [ ] Set `REDIS_URL` env.
- [ ] Confirm `/readyz` returns 200 with the new endpoint.

## 4. Twilio (OTP SMS)

- [ ] Account upgrade (no trial) — required for non-US recipients.
- [ ] Get an alphanumeric **Sender ID** approved for KSA. Lead time: **2–4 weeks**.
- [ ] Until alphanumeric approval: use a **long-code** (works but caller-ID is a number).
- [ ] Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` in Railway.
- [ ] Smoke test: request an OTP for an internal phone, confirm receipt within 5 s.
- [ ] Sentry alert rule: OTP success rate < 90 % for 5 min → page on-call.

## 5. Stripe (payments)

- [ ] Stripe account in **live mode**. KYC + bank account.
- [ ] Set up tax automatic calculation for KSA (15 % VAT).
- [ ] Webhooks: register **<https://api.mawared.example/v1/payments/webhooks/stripe>** for the events we handle:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `charge.refunded`
- [ ] Set `STRIPE_SECRET_KEY` (sk_live_...) and `STRIPE_WEBHOOK_SECRET` (whsec_...) in Railway.
- [ ] Smoke test: complete an end-to-end booking with a real card (Visa test → live). Confirm:
  - `Order.status = PAID`
  - `Contract` row issued with PDF
  - Customer push + in-app notification fired
- [ ] Watch the `StripeEvent` table for processed/unprocessed events.
- [ ] Daily reconciliation cron: `SUM(Order.totalMinor WHERE status='PAID')` vs Stripe charges. Drift alert.

## 6. FCM (push)

- [ ] Firebase project + Cloud Messaging API enabled.
- [ ] Service account with role `Firebase Admin SDK Administrator Service Agent`.
- [ ] Download the service-account JSON, paste as a single line into `FCM_SERVICE_ACCOUNT_JSON` in Railway.
- [ ] Drop `google-services.json` into `android/app/`.
- [ ] Build a debug APK, register a test device, send a test order — confirm push arrives in < 30 s.

## 7. Cloudflare R2 (object storage)

- [ ] Create R2 buckets:
  - `mawared-prod-uploads` (worker photos, customer ID docs, contract PDFs)
  - `mawared-prod-backups` (Postgres dumps)
- [ ] Create R2 API token with `Object Read` + `Object Write` on those two buckets only.
- [ ] Custom domain on `mawared-prod-uploads` → `cdn.mawared.example`.
- [ ] Set `S3_ENDPOINT`, `S3_REGION=auto`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_BASE_URL` in Railway.
- [ ] Smoke test: presigned upload → upload a 1 MB file → finalize → verify file at `cdn.mawared.example/<key>`.

## 8. Auth / JWT

- [ ] Generate RS256 keypair (`openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out priv.pem; openssl rsa -in priv.pem -pubout -out pub.pem`).
- [ ] Set `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY` in Railway (escape newlines as `\n`).
- [ ] Set `JWT_ISSUER` to `https://api.mawared.example`.
- [ ] Verify `GET /.well-known/jwks.json` returns the public key.

## 9. Sentry + observability

- [ ] Sentry project, `SENTRY_DSN` set on api + worker.
- [ ] Alert rules from `infra/observability/sentry-alerts.md` configured.
- [ ] BetterStack status page with components: API, Worker, Postgres, Redis, Stripe webhook.
- [ ] UptimeRobot 3-region pings on `/healthz` + `/readyz`.

## 10. CORS / CSP

- [ ] Set `CORS_ORIGINS` to the **exact** admin + website production hostnames (no wildcards).
- [ ] Verify CORS in browser dev tools from the admin dashboard.

## 11. Clients

- [ ] Admin dashboard: set `NEXT_PUBLIC_API_BASE_URL=https://api.mawared.example`. Replace any remaining mock data with `@mawared/api-client` calls.
- [ ] Marketing website: same.
- [ ] Android: set `API_BASE_URL` BuildConfig for `release` to `https://api.mawared.example`. Rebuild signed APK.

## 12. Performance gates (k6)

- [ ] `infra/load-tests/workers-search.k6.js` against staging — green
- [ ] `infra/load-tests/order-create.k6.js` against staging — green
- [ ] Capture p50/p95/p99 from the run; baseline them in `docs/backend/04-ROADMAP.md`.

## 13. Security

- [ ] OWASP ZAP baseline against staging (`zap-baseline.py -t https://staging.api.mawared.example`).
- [ ] Dependency scan: `pnpm audit --prod` clean. Snyk / Dependabot on the repo.
- [ ] Container scan: Trivy in CI on every backend image. Fail on high+ CVEs.
- [ ] Verify Pino redaction: tail prod logs for one hour, grep for `password`, `token`, OTP, phone-without-mask. Zero hits.
- [ ] Confirm `STRIPE_*` / `TWILIO_*` / `FCM_*` env vars are NOT in any log line.

## 14. Final cutover

- [ ] Maintenance window scheduled (low traffic).
- [ ] DNS TTL lowered to 60 s 24h before cutover; raise back to 3600 s afterward.
- [ ] Cutover plan rehearsed against staging.
- [ ] Rollback plan written.
- [ ] On-call rotation set up.
- [ ] **Go.**

---

## Approximate timeline

| Phase | Duration |
|---|---|
| Twilio sender ID approval | 2–4 weeks (gates customer sign-up) |
| Stripe KYC + bank | 1–2 weeks |
| R2 + DNS + TLS | 1 day |
| Sentry / UptimeRobot wiring | 1 day |
| Client wiring (Android + admin) | 3–5 days |
| Load testing | 2 days |
| Security review + ZAP baseline | 2 days |
| Cutover | 1 day |
| **Total wall clock** | **~4–6 weeks**, gated by Twilio. |
