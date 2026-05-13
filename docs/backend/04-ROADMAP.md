# Mawared Backend — Phased Roadmap (v1)

> Implementation plan for shipping the backend from zero to production, then migrating to AWS.

**Status**: Draft for engineering kickoff
**Owner**: Backend tech lead
**Last updated**: 2026-05-13

---

## How to read this

Each milestone has:
- **Outcome** — the user-visible or operational change after this milestone ships.
- **Definition of done (DoD)** — explicit, testable acceptance criteria. Don't move on until every checkbox is true.
- **Tasks** — concrete deliverables. Roughly ordered by dependency, parallelizable where indicated.
- **Estimate** — calendar weeks assuming 2 backend developers full-time. Multiply by ~1.6× for solo, divide by ~1.5× for 3 devs.
- **Risks / unblockers** — what could derail this and what to do about it.

The order is not negotiable: each milestone unblocks the next. Within a milestone, tasks are parallelizable unless explicitly chained.

---

## M0 — Foundations (1 week)

**Outcome**: A boring, empty NestJS app is deployed to Railway staging, accessible at a URL, with a green `/readyz`. CI runs on every PR.

### DoD
- [ ] Monorepo bootstrapped (pnpm + Turborepo).
- [ ] `apps/backend` scaffolds with NestJS, TypeScript strict mode, Pino, Zod pipe, Swagger, Sentry, Helmet.
- [ ] `prisma/schema.prisma` matches `docs/backend/03-SCHEMA.prisma` and the initial migration applies cleanly.
- [ ] `docker-compose.yml` boots Postgres 16 + Redis 7 + mailhog locally; `pnpm dev` works on a fresh clone in <5 minutes.
- [ ] Railway services (`api`, `worker`, `postgres`, `pgbouncer`, `redis`) deployed in staging. `prisma migrate deploy` runs as pre-deploy. Healthcheck green.
- [ ] GitHub Actions runs lint + typecheck + unit + integration on every PR. Branch protection enabled.
- [ ] `openapi.json` is generated and committed; CI fails on drift.
- [ ] Sentry receiving errors from staging.
- [ ] `/healthz` and `/readyz` endpoints implemented.

### Tasks
1. Initialize repo: pnpm workspaces, Turborepo, shared `tsconfig` and `eslint-config` packages.
2. Scaffold NestJS app with feature-sliced folder structure (see ARCHITECTURE §2/§4).
3. Wire global building blocks: ConfigService (env loader), Pino logger with request-id interceptor, Zod validation pipe, AllExceptionsFilter (RFC 7807), Throttler.
4. Add Prisma, generate first migration from `03-SCHEMA.prisma`, run locally and on staging.
5. Add the post-migration raw SQL (CHECK constraints, partial unique index, pg_trgm indexes) as a follow-up migration.
6. Add Dockerfile (multi-stage, non-root) and `railway.toml`.
7. Set up GitHub Actions: `ci.yml`, `openapi-drift.yml`, `deploy.yml`.
8. Configure Sentry + Pino redaction paths.
9. Seed script: idempotent dev seed creating super-admin, branch, two staff, a few workers/services/packages.
10. `infra/runbooks/local-development.md` and `infra/runbooks/deploy.md`.

### Risks
- **PgBouncer + Prisma migrations**: easy to misconfigure. Fix by using `DIRECT_DATABASE_URL` for migrations only.
- **Railway region**: pick closest to target users (Frankfurt or Singapore for MENA). Set this on day 1 — moving regions later is annoying.

---

## M1 — Auth & catalog reads (2 weeks)

**Outcome**: A customer can install the Android app, sign in with OTP, and browse workers, services, branches, and offers.

### DoD
- [ ] OTP request + verify works end-to-end with Twilio test creds.
- [ ] Refresh-token rotation with family invalidation works (tested with replay).
- [ ] Sessions can be listed and revoked.
- [ ] JWKS endpoint serves the public key.
- [ ] All read endpoints in scope return paginated, filterable results.
- [ ] Generated TS client and Kotlin client are published as packages in the monorepo.
- [ ] OpenAPI doc available at `/v1/docs` (basic auth in non-dev).
- [ ] Integration tests on every endpoint added in this milestone.

### Tasks
- **Auth module**
  - `OtpService` (Redis storage, argon2 hashing, layered rate limits).
  - `TokenService` (RS256 access JWT, rotated refresh token with family table).
  - `JwtAuthGuard`, `RolesGuard`, `@Roles()`, `@CurrentUser()`.
  - Endpoints: `/auth/otp/request`, `/auth/otp/verify`, `/auth/token/refresh`, `/auth/logout`, `/auth/sessions`, `/.well-known/jwks.json`.
  - Twilio provider behind `SmsProvider` interface.
- **Users module**
  - Customer profile CRUD: `GET /me`, `PATCH /me`, `DELETE /me` (initiate deletion).
  - Addresses CRUD: `GET/POST/PATCH/DELETE /me/addresses`.
- **Workers module (read-only for customers)**
  - Search endpoint with filters (profession, nationality, language, salary, age, experience) and sort.
  - Worker detail endpoint.
  - Favorites: `GET/POST/DELETE /me/favorites[/:workerId]`.
- **Catalog module**: `/services`, `/services/:id/packages`.
- **Branches module**: `/branches`.
- **Offers module**: `/offers` (active only).
- **Generated clients**: wire `openapi-typescript` for TS and `openapi-generator-cli` Kotlin Retrofit for Android.

### Risks
- **Twilio sender ID / regulatory**: getting an alphanumeric sender in Saudi takes weeks. Mitigate by using a long-code for v1, planning the upgrade.
- **Search performance**: validate with EXPLAIN ANALYZE on at least 5k seeded workers before claiming done.

---

## M2 — Bookings, payments, contracts, push (3 weeks)

**Outcome**: A customer can complete the full booking flow end-to-end: reserve a worker → pay with Stripe → receive contract PDF + push notifications.

### DoD
- [ ] `POST /bookings` reserves a worker for 15min via Postgres advisory lock; concurrent reservations on the same worker provably fail.
- [ ] Stripe PaymentIntent creation works from the Android app via Payment Sheet (tested with Stripe test mode).
- [ ] Stripe webhook handler: verifies signature, persists event, dedupes on `event.id`, ACKs in <200ms, processes async via BullMQ.
- [ ] On `payment_intent.succeeded`, booking transitions PAID → CONFIRMED (after admin review for now is auto-skipped if "auto-confirm" flag is on for v1), contract PDF generated, push sent.
- [ ] Order state machine: every disallowed transition rejected by the entity (unit-tested).
- [ ] Refund flow works from admin: creates refund, voids contract, notifies customer.
- [ ] FCM push delivered for every status change.
- [ ] Idempotency-Key supported on `POST /bookings` and `POST /payments/intents`.
- [ ] Nightly reconciliation job: sum(bookings.totalMinor where PAID) ≈ sum(stripe charges). Drift > 0 alerts Sentry.

### Tasks
- **Bookings module** — the big one.
  - `Booking` entity class with `transition(event)` pure function. 100% unit test coverage on transitions.
  - `BookingRepository` with advisory-lock reservation: `SELECT pg_try_advisory_xact_lock(hashtext('worker:'||$1))`.
  - `BookingsService.create` orchestration: validate package, validate promo, reserve worker, persist booking + reservation, snapshot money.
  - `BookingsService.transition` enforcing legal transitions; writes BookingStatusHistory.
  - Endpoints: `POST /bookings`, `GET /bookings`, `GET /bookings/:id`, `POST /bookings/:id/cancel`.
- **Payments module**
  - `StripeProvider` implementing `PaymentProvider` interface.
  - `PaymentsService.createIntentForBooking`.
  - `StripeWebhookController` with raw-body parser; persists StripeEvent, enqueues `process-stripe-event`.
  - `StripeEventProcessor` worker handler.
  - Refund flow: `PaymentsService.refund`.
- **Contracts module**
  - PDF generation via Puppeteer-HTML-to-PDF (Arabic font support is the hard part — bundle Noto Sans Arabic).
  - `ContractsService.issueFor(bookingId)`, `ContractsService.regeneratePdf`, `ContractsService.void`.
  - `GET /bookings/:id/contract` returns presigned R2 URL.
- **Notifications module**
  - FCM provider behind `PushChannel` interface.
  - Notification templates (Arabic + English): `booking.confirmed`, `booking.paid`, `booking.in_progress`, `booking.completed`, `booking.cancelled`, `contract.issued`, `payment.refunded`.
  - `DeviceTokensService.register/unregister`. Endpoint `POST /devices`, `DELETE /devices/:token`.
  - `NotificationsService.send` fanning out to channels.
  - Polling endpoints: `GET /notifications`, `PATCH /notifications/:id/read`.
- **Promos module**
  - `PromosService.validate(code, context)`.
  - `POST /offers/validate`.
- **Idempotency middleware**.
- **Files module** (just enough for contract PDFs):
  - Presigned upload URL endpoint (not yet exposed to clients; used internally by admin upload in M3).
  - `FilesService` write + finalize.
- **BullMQ wiring**: queues from ARCHITECTURE §12; in-process queue for tests.
- **Reservation expiry sweeper**: BullMQ delayed job at +15min.

### Risks
- **Arabic PDF rendering**: easy to ship something that looks broken in production. Build a visual-regression test (render to PNG and diff) on at least 3 sample contracts.
- **Webhook idempotency**: a Stripe replay storm can DoS the queue. Bound `process-stripe-event` concurrency and dedupe at the DB level first.
- **Reservation race**: two customers click "Reserve" within 50ms. Add a chaos test that hammers the endpoint with parallel requests and verifies exactly one wins.

---

## M3 — Admin dashboard backend (2 weeks)

**Outcome**: Staff can do their full job from the dashboard. Branch managers see their branch only. Super admins manage staff. Audit log captures every state-changing action.

### DoD
- [ ] Staff login with email + password + TOTP 2FA (required for branch manager and super admin).
- [ ] Branch managers' queries auto-scope to their branch.
- [ ] Every state-changing admin endpoint writes an AuditLog row.
- [ ] Admin can upload worker photos and documents via presigned R2 URL flow.
- [ ] Admin can transition any booking (with note); illegal transitions rejected.
- [ ] Admin can issue refund; webhook reconciliation completes the loop.
- [ ] Promo code CRUD; deactivating an active code immediately fails in-flight redemptions.
- [ ] Reports: revenue, orders by status, refund rate — all filterable by branch + date range.
- [ ] Super admin can create/deactivate staff, assign role and branch.
- [ ] AuditLog query endpoint with filters.

### Tasks
- **Admin auth**
  - Email+password login, argon2id hashing, HIBP breach check on signup.
  - TOTP 2FA setup + verify flow.
  - Brute-force lockout per email and per IP.
  - Separate JWT audience claim (`aud: "admin"`) so customer tokens can't be used on admin endpoints.
- **Admin module (workers)**
  - `POST /admin/workers` + `PATCH /admin/workers/:id` + soft-delete.
  - `POST /admin/workers/:id/photo` → presigned R2 upload.
  - `POST /admin/workers/:id/documents` with kind + expiry.
- **Admin module (customers)**
  - List + search + view + suspend + delete (cascade to soft-delete).
- **Admin module (bookings)**
  - List with rich filters.
  - `POST /admin/bookings/:id/transition` with allowed transitions per role.
  - `POST /admin/bookings/:id/refund`.
- **Admin module (promos)**
  - CRUD + usage report.
- **Admin module (branches)**: CRUD.
- **Admin module (catalog)**: CRUD on services + packages.
- **Admin module (staff)**: super-admin only.
- **Reports module**
  - `GET /admin/reports/revenue?from=&to=&branchId=`.
  - `GET /admin/reports/orders?from=&to=&status=`.
  - All reports paginated, materialized via plain SQL or Prisma `$queryRaw` for performance.
- **Audit module**
  - `AuditInterceptor` triggered by `@Audit('action.name')`.
  - `GET /admin/audit` with filters.
- **`@nestjs/throttler` admin-specific limits** (slower than customer rate limits).

### Risks
- **Branch-manager scoping bypass**: an off-by-one in the service layer leaks cross-branch data. Mitigate by writing integration tests with a fixture of two branches and asserting cross-branch reads return empty.
- **Audit log noise**: every CRUD writing audit creates a torrent. Be selective — only state-changing actions and reads of sensitive data (payment details, ID documents).

---

## M4 — Polish, hardening, observability (2 weeks)

**Outcome**: Production-ready. Dashboards exist. Load tested. Backups verified. Runbooks written. Confidence is high enough to onboard real customers.

### DoD
- [ ] Load test: 50 RPS sustained on `/workers` search, p95 < 400ms. 5 RPS sustained on `POST /bookings` happy path, p95 < 800ms.
- [ ] Chaos: Redis killed for 30s — API degrades gracefully (no 500s on read paths).
- [ ] Backup: nightly `pg_dump` to R2. Restore drill performed and documented.
- [ ] Observability dashboards (Grafana Cloud free tier) on RED metrics + key business metrics.
- [ ] UptimeRobot configured with 3-region pings.
- [ ] BetterStack status page set up.
- [ ] Runbooks committed: webhook backlog, DB at capacity, JWT key rotation, Stripe outage, Twilio outage, FCM outage.
- [ ] PII redaction reviewed against logs (sample 1k log lines, no leakage).
- [ ] Security checklist: HSTS preload, Helmet headers, CORS allowlist, dependency scan clean, container scan clean.
- [ ] Penetration test smoke (run OWASP ZAP baseline against staging).

### Tasks
- Load tests with k6 against staging.
- Chaos exercises documented in `infra/runbooks/`.
- Backup script + scheduled job + first restore drill.
- Grafana Cloud setup; metric exporter on `/metrics` (basic auth).
- Bull dashboard mounted at `/admin/_bull` (super-admin only).
- Status page wiring.
- Runbooks: each scenario described as "symptoms / diagnosis steps / mitigation / postmortem template".
- Sentry alert rules: 5xx spike, webhook lag > 30s, reconciliation drift > 0, OTP success rate < 90%.
- Feature flag service + `feature_flags` table.
- Onboarding doc for new engineers (`docs/backend/ONBOARDING.md`) — target: ship a one-line PR on day 1.

### Risks
- **Premature optimization based on load tests**: don't tune until you observe production traffic. Set baselines, don't chase.

---

## M5 — AWS migration (1 week post-launch)

**Outcome**: Identical system, running on ECS Fargate + RDS + ElastiCache + CloudFront. Customer experience unchanged.

### DoD
- [ ] Terraform IaC committed in `infra/terraform/` with `dev`, `staging`, `prod` workspaces.
- [ ] RDS Postgres 16 Multi-AZ provisioned. Data migrated from Railway via logical replication + cutover.
- [ ] ElastiCache Redis provisioned. Empty start is fine (OTPs and queues fresh).
- [ ] R2 → S3 migration: copy all objects, point endpoint env var to S3.
- [ ] CloudFront distribution in front of S3 (public assets) + ALB (API).
- [ ] Secrets in AWS Secrets Manager; rotation tested for JWT key.
- [ ] SES verified domain for transactional email (swap from Resend, or keep Resend — decide).
- [ ] CloudWatch Logs ingesting Pino JSON.
- [ ] Smoke test on prod-AWS: every customer-facing endpoint returns 200, push notifications deliver.
- [ ] DNS cutover plan written and rehearsed.
- [ ] Rollback plan: keep Railway warm for 7 days post-cutover.

### Tasks
- Terraform modules: `network`, `ecs-api`, `ecs-worker`, `rds`, `redis`, `s3-cloudfront`, `secrets`, `alb`, `cloudfront-api`.
- CI/CD update: build images → ECR; deploy via ECS rolling update.
- Data migration playbook: pre-cutover snapshot, logical replication, dry run, cutover, post-cutover validation.
- File migration: `aws s3 sync` from R2 (S3 API compatible) → S3.
- Update env vars; tear down R2 after 30-day grace.
- Tear down Railway after 7-day grace.

### Risks
- **Cutover window**: schedule for lowest-traffic period. Pre-announce.
- **Cost surprise**: ECS Fargate + RDS Multi-AZ + ElastiCache + ALB + CloudFront baseline is meaningfully higher than Railway. Run cost estimator before signing off; consider Aurora Serverless v2 if traffic is bursty.

---

## Cross-cutting threads (don't forget)

These aren't milestones; they're disciplines that run *through* every milestone. The tech lead is on the hook for each.

| Thread | Owner | Cadence |
|---|---|---|
| Architecture Decision Records | Tech lead | One ADR per material decision (use `05-DECISIONS.md`) |
| Code review | All engineers | Every PR, 1 approval, no self-merge |
| Test pyramid discipline | All engineers | Coverage gates in CI |
| OpenAPI drift checks | CI | Every PR |
| Backup restore drills | Tech lead | Quarterly |
| Runbook updates after incidents | Whoever was on-call | Within 1 week of incident |
| Dependency updates | CI (Dependabot) + tech lead | Weekly review |
| Security review | Tech lead | Before each milestone goes to prod |
| PII redaction audit | Tech lead | Quarterly |
| Cost review | Tech lead | Monthly post-AWS |

---

## Anti-roadmap — what we explicitly defer

These will tempt the team. Resist until they're actually justified by data.

- Caching layer on read endpoints (we have <5k workers; Postgres + an index is faster than serializing to/from Redis).
- Read replicas (only meaningful past ~500 RPS sustained on reads).
- Event bus (Kafka/SNS) — we have no cross-service event needs in a monolith.
- Search engine (Meilisearch/Typesense) — only when Arabic fuzzy search hits its limits with pg_trgm.
- Vector embeddings for matching — v2 feature once we have rating + transaction data to train on.
- Mobile-app A/B testing infrastructure — Firebase Remote Config is enough for v1.
- B2B/corporate accounts — separate product line.

---

**Next**: read [05-DECISIONS.md](./05-DECISIONS.md) for the locked-in architecture decisions and why.
