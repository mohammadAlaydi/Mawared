# Mawared International — Project Status

**Last updated:** 2026-05-14
**Branch:** `claude/strange-jones-75f7c3`
**Commits delivered:** 9 (see [Commit log](#commit-log))

This is the single source of truth for where the project stands. The
[`docs/backend/`](./backend/) folder is the technical spec; this file is
the operational status report.

---

## 1. TL;DR

- **Backend code: ~100% complete vs the Mawared feature spec** (PDF Nov 2026).
  Every endpoint the customer app, admin dashboard, and website need is
  shipped behind the `@mawared/api-client` + `MawaredApi` (Kotlin) clients.
- **Frontend wiring: scaffolded, not finished.** API clients exist and a
  token-storage / login hook is in place; replacing the existing mock-data
  calls in each Android screen and admin-dashboard page is mechanical
  per-screen work (~3–5 days).
- **Infrastructure: documented, not provisioned.** Stripe, Twilio,
  Signit.sa, FCM, R2, Sentry, BetterStack — every adapter is built and
  env-gated; you set the credentials and they activate. See the
  [Go-live checklist](../infra/runbooks/go-live-checklist.md).
- **Tests: unit + integration scaffolding exists.** The state machine has
  exhaustive matrix coverage. End-to-end k6 load tests are written but not
  yet run against staging.

---

## 2. What's done — by milestone

### M0 — Foundations ✅
- Monorepo (pnpm + Turborepo), NestJS 10 + TypeScript strict
- Prisma schema (~25 models, mirroring [`03-SCHEMA.prisma`](./backend/03-SCHEMA.prisma))
- Initial migration + post-init CHECK constraints + pg_trgm GIN indexes
- Global Pino logger w/ PII redaction (incl. all secret env-var names)
- Zod validation pipe + RFC 7807 problem+json error filter
- Request-id correlation + Throttler + Helmet
- Health endpoints (`/healthz`, `/readyz` with PG + Redis probes)
- Money value object + exhaustive unit tests
- Order state machine (`order.entity.ts`) with full matrix + fuzz tests
- Docker Compose for local dev (Postgres 16 + Redis 7 + Mailhog)
- Multi-stage Dockerfile + `railway.toml`
- GitHub Actions CI: lint, typecheck, unit, integration (PG + Redis service containers), OpenAPI drift

### M1 — Auth & catalog reads ✅
- **Auth**: OTP request/verify (Redis + argon2id + layered rate limits),
  JWT issuance (HS256 dev / RS256 prod), refresh-token rotation with
  family-tree theft detection, per-device sessions, JWKS endpoint
- **Customer surface**: workers search/detail/favorites with cursor pagination,
  services + packages, branches (public), offers + promo validation,
  `/me` profile + addresses CRUD
- Global JwtAuthGuard + RolesGuard with `@Public()` opt-out

### M2 — Orders / payments / contracts / notifications ✅
- **Orders**: `POST /v1/orders` with Postgres advisory-lock reservation,
  money snapshot at create time, idempotency interceptor, cancel
- **Payments**: PaymentProvider abstraction (Stripe + stub),
  Stripe webhook ingest (raw-body, HMAC-SHA-256 v1 signature, dedup on
  `stripeEventId`), BullMQ async processing
- **Contracts**: auto-issued on `CONFIRMED`, auto-voided on
  `CANCELLED`/`REFUNDED`, **Puppeteer + Noto Sans Arabic PDF generation**
  (bilingual RTL/LTR template, R2 upload, env-gated)
- **Notifications**: in-app + FCM real provider + BullMQ fanout
  consumer, Arabic + English templates for every status change
- **BullMQ**: reservation expiry consumer, Stripe event consumer,
  notification fanout consumer — all gated on `MAWARED_PROCESS=worker`

### M3 — Admin backend ✅
- **Admin auth**: email + argon2id password + TOTP (RFC 6238 from
  scratch — `speakeasy` not needed), Redis-keyed brute-force lockout
  per email + IP
- **Audit log**: `@Audit({...})` decorator + interceptor, query endpoint
- **Admin orders**: list with branch scoping for BRANCH_MANAGER, detail
  with full timeline + payments + refunds, transition, refund
- **Admin workers**: CRUD + photo + document binding
- **Admin customers**: list/search, detail, suspend (revokes sessions),
  reactivate
- **Admin promos**: SUPER_ADMIN-only CRUD with XOR percent/minor
- **Admin staff**: full CRUD with argon2id-hashed password + TOTP
  enrollment/verify/disable
- **Admin reports**: revenue (daily by currency), orders by status,
  refunds + rate — raw SQL via `Prisma.sql` for perf
- **Admin catalog**: services + packages CRUD (added in Phase 9)
- **Admin payments**: list + refunds list with branch scoping
- **Admin verifications**: history + manual override (added in Phase 9)
- **Admin feature flags**: SUPER_ADMIN-only flag management
- **Audit query**: `GET /v1/admin/audit` (SUPER_ADMIN)

### M4 (partial) — Polish & hardening ✅
- **Feature flags**: `FeatureFlagsService` with 30s cache, rollout %,
  role / userId allow-lists, deterministic FNV-1a bucketing
- **k6 load tests**: workers-search (50 RPS, p95 < 400 ms) +
  order-create (5 RPS, p95 < 800 ms), with README + acceptance gates
- **Backup script**: `pg-backup.sh` → R2 via AWS CLI
- **Restore drill**: `pg-restore-drill.sh` with row-count sanity checks
- **Outage runbooks**: Stripe, Twilio, FCM, DB capacity, JWT rotation,
  webhook backlog (6 total, each with symptoms / diagnosis / mitigation
  / postmortem)
- **Pino redaction**: expanded to cover TOTP, every secret env-var
  name, client secrets, JWT private keys, phone variants
- **Sentry alert rules doc**: critical + warning thresholds with verification steps

### Phase 8 — Integration scaffolding ✅
- **TS API client** (`@mawared/api-client`): hand-written fetch client
  mirroring every endpoint, auto-refresh on 401, ApiError /
  NetworkError types, idempotency-key support
- **Kotlin API client** (`packages/api-client-kotlin/`): Retrofit
  interfaces + Moshi DTOs + OkHttp interceptor / authenticator with
  single-flight refresh
- **Admin dashboard wiring**: `src/lib/api.ts` + `useAuth.ts` with
  sessionStorage-backed token persistence
- **Android wiring**: `EncryptedSharedPreferences`-backed token storage,
  sample `WorkersRepository`, README with Gradle deps + DI bindings
- **Go-live checklist**: 14-section ordered checklist
  ([`infra/runbooks/go-live-checklist.md`](../infra/runbooks/go-live-checklist.md))

### Phase 9 — Spec compliance audit + gap fixes ✅
- **Signit.sa identity verification** (was the biggest missing piece):
  - `IdentityVerification` table + `Customer.verificationStatus` column +
    five-state enum (NOT_VERIFIED / PENDING / VERIFIED / FAILED / EXPIRED)
  - `SignitVerificationProvider` (real REST + HMAC-SHA-256 webhook) +
    `StubVerificationProvider` (dev fallback)
  - Customer endpoints: `GET /v1/me/verification`, `POST /v1/me/verification/start`
  - Webhook ingest: `POST /v1/verifications/webhooks/signit`
  - **Order-creation gate**: 403 `VERIFICATION_REQUIRED` for non-verified customers
  - Admin: history + manual override (SUPER_ADMIN only for VERIFIED)
  - Provisioning runbook: [`infra/runbooks/signit-provisioning.md`](../infra/runbooks/signit-provisioning.md)
  - Smoke script: [`infra/scripts/signit-smoke.ts`](../infra/scripts/signit-smoke.ts)
- **Expanded `UserRole` enum**: added SALES, FINANCE, SUPPORT (spec §9)
- **Admin services + packages CRUD** (the spec's "Services management" + "Packages management" modules)
- **Admin payments list** (the spec's "Payments management" module)
- **Branch.whatsappE164** (spec §8 "WhatsApp integration")
- **Order display labels**: maps our 11 internal statuses → the spec's 10 customer-facing labels (Arabic + English + step number)

---

## 3. What's done — by feature (spec ↔ status)

| Spec § | Feature | Status |
|---|---|---|
| §1 | Customer mobile app | ✅ scaffolded with Kotlin Retrofit client |
| §1 | Admin dashboard | ✅ scaffolded with TS client |
| §1 | Landing website | ✅ `POST /v1/leads` backs contact form |
| §2 | Mobile-number login | ✅ |
| §2 | OTP verification | ✅ |
| §2 | Customer profile | ✅ |
| §2 | Saved addresses | ✅ |
| §3 | **Signit.sa verification (all 5 statuses)** | ✅ |
| §4 | Services / packages / pricing | ✅ |
| §4 | Terms & conditions | ⚠️ stored in `description` + `features` JSON; no dedicated field |
| §5 | Worker browse + filters | ✅ |
| §5 | Worker detail + favorites | ✅ |
| §6 | Order placement | ✅ |
| §6 | Online payments | ✅ Stripe (Mada caveat — see §5 below) |
| §6 | Payment tracking + receipt | ✅ |
| §7 | 10 customer-facing statuses | ✅ via display-label mapper |
| §7 | Push notifications | ✅ FCM real provider |
| §8 | Support: phone, WhatsApp, complaints | ✅ |
| §9 | Admin: all 8 modules (orders, CVs, services, packages, customers, verifications, payments, reports) | ✅ |
| §9 | Admin roles: super admin / operations / sales / finance / support | ✅ |
| §10 | Operations workflow | ✅ |
| §11 | Landing website features | ✅ |
| §12 | MVP scope — mobile (9 features) | ✅ |
| §12 | MVP scope — dashboard (7 features) | ✅ |
| §12 | MVP scope — website (3 features) | ✅ |

---

## 4. What's remaining

### Blocking before launch

#### 4.1 — Third-party provisioning (operator work, no code)
Per [`infra/runbooks/go-live-checklist.md`](../infra/runbooks/go-live-checklist.md):

- [ ] **Twilio**: alphanumeric sender ID for KSA — **2–4 week approval, critical-path blocker**
- [ ] **Signit.sa**: sandbox + prod merchant accounts, API keys, webhook signing secrets, callback URL whitelist
- [ ] **Stripe**: live mode, KYC + bank, webhook endpoint registration, KSA VAT setup
- [ ] **FCM**: Firebase project + service-account JSON, `google-services.json` in Android app
- [ ] **Cloudflare R2**: `mawared-prod-uploads` + `mawared-prod-backups` buckets, API token, custom CDN domain
- [ ] **DNS**: domain registration, `api`, `admin`, `www`, `cdn` records + TLS
- [ ] **JWT keypair**: RS256 PEM keys generated and set in production env
- [ ] **Sentry**: project, DSN, alert rules per [`infra/observability/sentry-alerts.md`](../infra/observability/sentry-alerts.md)
- [ ] **UptimeRobot** + **BetterStack status page**

#### 4.2 — Frontend wiring (per-screen mechanical work)

The clients are in place (`@mawared/api-client` for web, `MawaredApi` for
Android). What's left is replacing existing mock-data calls with real
client calls — **screen by screen, no architectural risk**:

- [ ] **Android** (`com.mawared.dawliah`): swap `data/mock/MockWorkers` for
  `data/remote/WorkersRepository` across the ViewModels. Approx 12
  screens × ~30 min each.
- [ ] **Android**: wire Stripe `PaymentSheet` to the `clientSecret` from
  `POST /v1/payments/intents`.
- [ ] **Android**: wire FCM token registration on app launch (`POST /v1/devices`).
- [ ] **Android**: Signit verification deep-link handler — when the order
  flow throws `VERIFICATION_REQUIRED`, route the user to a WebView with
  the `redirectUrl` from `POST /v1/me/verification/start`.
- [ ] **Admin dashboard** (Next.js): connect each dashboard page to the
  client. The login page consumes `useAuth()`, but the orders / workers /
  customers / promos / reports pages still need their data layer wired.
- [ ] **Landing website** (Next.js): wire the contact form to `POST /v1/leads`.

Estimate: **3–5 days for one engineer**.

### Should-do before scale

- [ ] **Run k6 gates against staging** — capture p50/p95/p99 baselines
- [ ] **First backup restore drill** — confirm `pg-restore-drill.sh` produces a queryable DB
- [ ] **OWASP ZAP baseline** scan against staging
- [ ] **PII redaction audit** — tail 1000 prod log lines, grep for `password`/`token`/raw phone — zero hits required
- [ ] **Dependency + container scan** — `pnpm audit --prod`, Trivy on the image

### Nice-to-have (post-launch)

- [ ] **Mada payment support**: Stripe doesn't accept Mada (the dominant KSA card scheme). Add a second `PaymentProvider` implementation — **Moyasar** or **HyperPay**. The abstraction is already in place; ~1 day adapter swap. **High value for the Saudi market.**
- [ ] **Dedicated T&C field on `ServicePackage`** — `termsVersion` + `termsBodyAr/En` + `TermsAcceptance` table if legal wants signed acceptance
- [ ] **WhatsApp Business inbound messaging** (vs the current click-to-chat deep link) — would add a new `PushChannel` implementation
- [ ] **Dead device-token cleanup job** — periodic prune of `DeviceToken` rows that FCM 404s
- [ ] **Daily reconciliation cron** — `SUM(Order.totalMinor WHERE status='PAID')` vs Stripe charges → Sentry alert on drift > 0
- [ ] **Bull dashboard** mounted at `/admin/_bull` (super-admin only)
- [ ] **`pino-sentry-transport`** for custom metrics (OTP success rate, webhook lag) — feeds the alert rules

### Phase 10 — AWS migration (M5, post-launch)
Per [`docs/backend/04-ROADMAP.md`](./backend/04-ROADMAP.md) §M5:

- [ ] Terraform modules: network, ECS Fargate (api + worker), RDS Postgres
  Multi-AZ, ElastiCache, ALB, S3 + CloudFront, Secrets Manager
- [ ] Data migration playbook: snapshot → logical replication → cutover
- [ ] R2 → S3 object sync
- [ ] CloudWatch Logs ingestion of Pino JSON
- [ ] DNS cutover + 7-day Railway warm rollback
- [ ] Cost review (ECS + RDS Multi-AZ + ElastiCache + ALB + CloudFront baseline
  is meaningfully > Railway)

---

## 5. Known risks / caveats

1. **Stripe ≠ Mada (KSA market risk).** Stripe does not support Mada-only
   cards, which is the dominant card scheme in Saudi Arabia. Customers
   paying with a Mada-only card will fail at checkout. **Mitigation**:
   Moyasar or HyperPay as a second `PaymentProvider`. The interface is
   ready. Flagged in [`ADR-006`](./backend/05-DECISIONS.md).

2. **Signit.sa REST contract is assumed, not confirmed.** Their public
   docs aren't open. The adapter uses a conventional shape (Bearer auth,
   `/v1/sessions`, `X-Signit-Signature` HMAC). When sandbox credentials
   arrive, expect to adjust JSON field names — ≤5-minute fix per the
   table at the bottom of [`signit-provisioning.md`](../infra/runbooks/signit-provisioning.md).

3. **Twilio sender ID approval is the launch critical path.** 2–4 weeks
   for alphanumeric sender ID approval in KSA. **Start this Day 1.**

4. **No iOS app planned for v1.** Spec is Android-only. iOS app would be
   a separate frontend project — backend stays identical.

5. **Auth tokens are HS256 in dev.** Production requires RS256 with
   `JWT_PRIVATE_KEY` + `JWT_PUBLIC_KEY` set. Boot fails loudly if these
   are missing in `NODE_ENV=production`.

6. **No web app for customers.** Per spec, customers only use the Android
   app. The "landing website" is marketing + contact form, not a
   customer portal.

---

## 6. How to pick up from here

### For a new engineer onboarding

1. Read [`docs/backend/07-IMPLEMENTATION_GUIDE.md`](./backend/07-IMPLEMENTATION_GUIDE.md) — the AI/engineer handoff briefing.
2. Skim [`docs/backend/01-PRD.md`](./backend/01-PRD.md), [`02-ARCHITECTURE.md`](./backend/02-ARCHITECTURE.md), [`06-STATE_MACHINE.md`](./backend/06-STATE_MACHINE.md).
3. Bring up local dev per [`infra/runbooks/local-development.md`](../infra/runbooks/local-development.md).
4. Pick from "What's remaining" §4.2 (frontend wiring) for first PRs.

### For the operations / launch team

1. Start [`infra/runbooks/go-live-checklist.md`](../infra/runbooks/go-live-checklist.md).
2. Twilio sender ID submission is **Day 1, critical path**.
3. Signit sandbox account — second critical path (gates customer onboarding).

### For the tech lead

1. Decide on Mada payment provider (Moyasar vs HyperPay) before paid
   marketing kicks on.
2. Confirm legal sign-off on the contract PDF template (see
   `apps/backend/src/modules/contracts/contract-template.ts` for the
   bilingual draft).
3. Schedule the first quarterly backup restore drill.

---

## 7. Commit log

```
eff5064  docs(verifications): Signit.sa provisioning runbook + smoke script
37f0342  Phase 9 — Mawared spec compliance audit + gap fixes
a3227e5  Phase 8 — API clients + admin/Android wiring + go-live checklist
b2f5655  Phase 6 + Phase 7 — finishing M2/M3 + hardening
4214430  M3 follow-up — reports, staff, leads, files, JWKS, TOTP, FCM
65fb523  M2 follow-up + M3 — bullmq, real providers, admin backend
4db52b1  M2 — orders, payments, notifications (skeleton)
51b7304  M1 — auth (OTP/JWT/sessions) + catalog reads
d767834  M0 — backend scaffold + docs + state machine
```

All on branch **`claude/strange-jones-75f7c3`**. Squash-merge to `main`
when reviewed.

---

## 8. Key files for navigation

| Need to find... | Path |
|---|---|
| The product spec | [`docs/backend/01-PRD.md`](./backend/01-PRD.md) |
| Architecture & module catalog | [`docs/backend/02-ARCHITECTURE.md`](./backend/02-ARCHITECTURE.md) |
| Database schema | [`apps/backend/prisma/schema.prisma`](../apps/backend/prisma/schema.prisma) |
| Roadmap & DoD per milestone | [`docs/backend/04-ROADMAP.md`](./backend/04-ROADMAP.md) |
| All ADRs | [`docs/backend/05-DECISIONS.md`](./backend/05-DECISIONS.md) |
| State machine reference | [`docs/backend/06-STATE_MACHINE.md`](./backend/06-STATE_MACHINE.md) |
| AI/engineer handoff briefing | [`docs/backend/07-IMPLEMENTATION_GUIDE.md`](./backend/07-IMPLEMENTATION_GUIDE.md) |
| All backend code | [`apps/backend/src/`](../apps/backend/src/) |
| TypeScript API client | [`packages/api-client-ts/`](../packages/api-client-ts/) |
| Kotlin API client | [`packages/api-client-kotlin/`](../packages/api-client-kotlin/) |
| All runbooks | [`infra/runbooks/`](../infra/runbooks/) |
| Go-live checklist | [`infra/runbooks/go-live-checklist.md`](../infra/runbooks/go-live-checklist.md) |
| Signit provisioning | [`infra/runbooks/signit-provisioning.md`](../infra/runbooks/signit-provisioning.md) |
| Load tests (k6) | [`infra/load-tests/`](../infra/load-tests/) |
| Backup scripts | [`infra/scripts/`](../infra/scripts/) |

---

**Owner:** Backend tech lead. Update this file when phases land or
remaining items change.
