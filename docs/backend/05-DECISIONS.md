# Mawared Backend — Architecture Decision Records

> Every load-bearing technical decision the team has agreed on, with rationale, alternatives considered, and consequences.

**Convention**: Append-only. Once recorded, an ADR is never edited — only **superseded** by a new ADR that references it. This is what gives the doc its value: a new engineer reading the codebase can ask "why is it this way?" and find a real answer instead of folklore.

**Status legend**: `Accepted` · `Superseded by ADR-NNN` · `Deprecated`

---

## ADR-001: NestJS as the backend framework

**Status**: Accepted · **Date**: 2026-05-13

### Context
We need a backend framework for a marketplace with multiple clients (Android, admin dashboard, marketing site). The team is small (2–4 devs) and the goal is "senior-grade, clean architecture, future-proof".

### Decision
We use **NestJS 10 on Node 20 LTS, with TypeScript strict mode**.

### Rationale
- Same language as the frontend (Next.js) → shared types via OpenAPI-generated clients, single hiring profile.
- NestJS provides opinionated structure (modules, DI, guards, interceptors, pipes) that enforces clean boundaries without us writing the scaffolding.
- Largest TS backend ecosystem; well-documented Stripe, Twilio, FCM, BullMQ, Prisma integrations.
- Easy to layer DDD-lite onto where it pays off (Booking aggregate) without forcing it everywhere.

### Alternatives considered
- **FastAPI (Python)**: cleanest DX of any framework but weaker concurrency under load, and we'd lose TypeScript end-to-end.
- **Go (Fiber/Echo)**: best raw performance, lowest memory cost, but slower dev velocity and smaller marketplace-domain ecosystem.
- **Plain Node + Fastify**: lighter weight, but lacks the structural conventions we want to enforce on a multi-dev team.

### Consequences
- We commit to NestJS conventions (decorators, DI containers, modules-as-public-API).
- Cold start is slower than Fastify alone; acceptable for our deployment model (long-running containers).

---

## ADR-002: PostgreSQL + Prisma

**Status**: Accepted · **Date**: 2026-05-13

### Decision
**PostgreSQL 16** as the primary datastore, with **Prisma 5** as the ORM.

### Rationale
- The domain is strongly relational (Customer → Booking → Worker → Contract → Payment). Document stores would force us to denormalize and lose referential integrity.
- Postgres specifically: best-in-class transaction model, JSONB for localized strings, pg_trgm for fuzzy search, advisory locks for our reservation use case, partial indexes for things like "one active reservation per worker".
- Prisma: schema-first, excellent migration DX, type-safe client, healthy ecosystem, works seamlessly with NestJS.

### Alternatives considered
- **Drizzle**: thinner abstraction, but less mature tooling and smaller community. Worth revisiting in 2027.
- **TypeORM**: traditional NestJS pairing but has known migration footguns and feels dated relative to Prisma.
- **MySQL**: fine, but Postgres's feature set (JSONB, advisory locks, partial indexes) is too valuable to forgo.
- **MongoDB**: domain is wrong shape for it.

### Consequences
- We accept Prisma's runtime overhead (small but non-zero).
- We commit to expand/contract migrations and never do hot-renaming of columns.
- For the few queries Prisma can't express well, we drop to `$queryRaw` — fine when documented.

---

## ADR-003: REST + OpenAPI 3.1, code-first

**Status**: Accepted · **Date**: 2026-05-13

### Decision
REST over HTTP/JSON, with the **OpenAPI 3.1 spec generated from the code** by `@nestjs/swagger` (paired with `zod-to-openapi`). Spec is committed; CI fails on drift.

### Rationale
- One of our clients is native Android (Kotlin) — REST + OpenAPI is the path of least resistance for typed Retrofit clients.
- Code-first prevents the team from skipping spec updates: the spec *is* the code, not a parallel document.
- Generated clients (TS + Kotlin) keep both frontends in sync with backend changes without manual labor.

### Alternatives considered
- **GraphQL**: overkill for our mostly-CRUD domain, adds N+1 risk and authorization complexity.
- **tRPC**: end-to-end TS type safety but Kotlin clients can't use it — defeats the point.
- **REST without OpenAPI**: faster start, but API drift will bite us within 6 months.

### Consequences
- We accept the cost of decorating every DTO and controller for Swagger.
- CI gate prevents merging code that changes the API without regenerating the spec.

---

## ADR-004: Custom phone-OTP auth via Twilio + JWT (RS256 access, opaque rotated refresh)

**Status**: Accepted · **Date**: 2026-05-13

### Decision
- Phone-OTP via **Twilio** for customers (global coverage, simple API).
- Email + password + TOTP for admin staff.
- **Access tokens**: RS256-signed JWT, 15-min TTL, public key served at `/v1/.well-known/jwks.json`.
- **Refresh tokens**: opaque 256-bit random strings, stored in DB as SHA-256 hashes, **rotated on every refresh** with family-tree theft detection.
- OTPs stored as argon2id hashes in Redis with 5-min TTL.

### Rationale
- We own the user table; no vendor lock-in.
- Twilio coverage is global and we agreed to keep this region-agnostic for now (skipping Unifonic / regional providers).
- RS256 + JWKS lets the admin frontend verify tokens locally without round-tripping the backend.
- Refresh-token rotation with family invalidation is the OAuth 2.0 BCP-recommended pattern against token theft.
- Argon2id-hashing OTPs in Redis means a Redis snapshot leak doesn't reveal in-flight OTPs.

### Alternatives considered
- **Firebase Auth**: fastest to ship but vendor lock-in and weak Arabic UX.
- **Clerk / Auth0**: overkill and expensive for a single-market consumer app.
- **Supabase Auth**: only makes sense if we adopt Supabase as our DB, which we don't.

### Consequences
- We are responsible for rate-limiting, fraud detection, and OTP delivery reliability.
- Migrating to Mada/STC Pay-integrated auth providers later is a bigger lift than swapping payments.

---

## ADR-005: Stripe as the v1 payment provider, abstracted

**Status**: Accepted (with caveat — see "Open risks") · **Date**: 2026-05-13

### Decision
Stripe is the only payment provider for v1, but it sits behind a `PaymentProvider` interface so we can add Moyasar (Mada/STC Pay) or others later without touching the booking/refund services.

### Rationale (stakeholder-driven)
- Speed to launch is the v1 priority.
- Stripe has world-class docs, SDKs (including Android Payment Sheet), and webhook tooling.

### Open risks
- **Stripe does NOT support Mada or STC Pay.** Mada is on the majority of Saudi debit cards. If/when we paid-market in Saudi Arabia, this will be a conversion-killer.
- We document this as a Day-1 follow-up decision: **revisit before any Saudi paid marketing turns on.** Adding Moyasar later costs ~1 week behind the abstraction; that's acceptable.

### Alternatives considered (deferred, not rejected)
- **Moyasar**: Saudi-licensed, supports Mada/STC Pay/Apple Pay, would be primary for a Saudi-first launch.
- **Tamara / Tabby (BNPL)**: huge conversion lift for ticket sizes > 2000 SAR. Worth adding in M5/M6.

### Consequences
- All payment code uses the abstract `PaymentProvider`, not Stripe directly.
- Money is stored as integer minor-units + currency code, matching Stripe and ready for any other provider.

---

## ADR-006: Cloudflare R2 for file storage, AWS SDK v3 S3 client

**Status**: Accepted · **Date**: 2026-05-13

### Decision
Use **Cloudflare R2** as the object store, accessed via the **AWS SDK v3 S3 client** with a custom endpoint.

### Rationale
- **$0 egress** on R2 is a major cost win for a photo-heavy app.
- Using the S3 client means **switching to AWS S3 later is one env-var change**, not a refactor.
- Cloudflare CDN sits naturally in front of R2 for public assets.

### Alternatives considered
- **AWS S3 from day 1**: more mature, but egress costs scale meaningfully for image-heavy apps.
- **Railway volumes**: don't scale across replicas and have no CDN.
- **Supabase Storage**: couples us to Supabase, expensive past free tier.

### Consequences
- We don't use any R2-specific SDK features.
- At M5 AWS migration, R2 objects are sync'd to S3 via `aws s3 sync`; client points to S3 endpoint.

---

## ADR-007: BullMQ + Redis from day 1

**Status**: Accepted · **Date**: 2026-05-13

### Decision
Adopt **BullMQ on Redis** for all background work from day 1.

### Rationale
- We already need Redis for OTP storage and rate limiting; queues are free incremental adoption.
- Many critical paths (Stripe webhooks → async processing, SMS send, push send, contract PDF generation, reservation expiry) demand retry semantics that BullMQ provides out of the box.
- Retrofitting queues later is significantly more painful than building with them from the start.

### Alternatives considered
- **`@nestjs/schedule` only**: fine for cron, no retry/dead-letter semantics for failure-prone work.
- **AWS SQS via abstraction**: extra abstraction layer with no near-term benefit; BullMQ is enough.

### Consequences
- We always have a Redis dependency in production.
- All job handlers are designed to be idempotent (jobs may retry).

---

## ADR-008: Modular monolith, sliced by feature

**Status**: Accepted · **Date**: 2026-05-13

### Decision
A **single deployable NestJS monolith** with feature-sliced modules. No microservices, no service mesh, no Kafka.

### Rationale
- 2–4 devs cannot afford the operational tax of microservices.
- Modules give us logical isolation; we can extract any module later if we keep cross-module calls going through each module's exported provider (its public API), not via shared internals.
- Postgres + advisory locks + a transactional outbox (if we ever need it) gets us 95% of what people reach for Kafka for.

### Alternatives considered
- **Microservices from day 1**: hard no. Cargo-culted complexity.
- **Modular monolith sliced by layer (controllers/, services/, dtos/ at top level)**: scales poorly past ~5 modules.

### Consequences
- ESLint rule prevents cross-module imports of internal services.
- If a module ever justifies extraction, the lift is bounded.

---

## ADR-009: Arabic-first content, JSON `{ar, en}` for non-searchable text, separate columns for searchable

**Status**: Accepted · **Date**: 2026-05-13

### Decision
- **Searchable text** (worker name, branch name, service name): separate `*_ar` and `*_en` columns so we can index them (pg_trgm, full-text).
- **Non-searchable rich text** (descriptions, package features list): stored as JSON `{ ar: string; en?: string }`, validated with Zod at the application layer.
- Default locale is Arabic; English is fallback.

### Rationale
- Indexing JSONB locale keys is awkward and slow compared to dedicated columns.
- Many text fields (long descriptions) don't need indexing; JSON keeps the schema flexible and matches the current Android client's `nameAr`/`labelAr` model.

### Alternatives considered
- **Full i18n translation tables**: maximum flexibility, far too much complexity for 2 locales.
- **Single-language only**: ruled out — English fallback is needed for staff and future expat customers.

### Consequences
- Adding a third locale (Urdu, Tagalog, etc.) involves a schema migration for searchable fields and a Zod schema update for JSON fields.

---

## ADR-010: Money as BigInt minor-units + ISO-4217 currency Char(3)

**Status**: Accepted · **Date**: 2026-05-13

### Decision
Every money column is stored as **`BigInt` minor-units** (e.g., halalas, fils) plus a **`Char(3)` currency code** following ISO 4217. We never use `Decimal` or floating-point. Postgres `CHECK (amount_minor >= 0)` invariants are enforced.

### Rationale
- Stripe and most PSPs work in minor units. No float arithmetic anywhere.
- BigInt avoids 2³¹ overflow for high-ticket totals.
- Storing the currency alongside the amount makes the data type self-describing — required for multi-currency.

### Caveats
- **KWD, BHD, OMR are 3-decimal currencies.** Code that assumes "minor = major × 100" is wrong. We encode currency-aware logic in a `Money` value object: `Money.of(100, 'SAR')`, `Money.of(100, 'KWD')`.

### Consequences
- All API responses include `{ amountMinor, currency }`. Clients format for display using `Intl.NumberFormat`.

---

## ADR-011: Soft delete via explicit `deletedAt` filtering, not Prisma middleware

**Status**: Accepted · **Date**: 2026-05-13

### Decision
Soft-deletable entities have a `deletedAt timestamptz NULL` column. Services have explicit `findActive()` (filters `deletedAt: null`) and `findIncludingDeleted()` methods. **No Prisma `$use` middleware** for auto-filtering.

### Rationale
- Auto-filtering breaks admin tooling, reports, and bug investigation.
- Prisma deprecated `$use` in favor of `$extends`; soft-delete extensions add invisible behavior that surprises engineers.
- Being explicit costs three extra characters; clarity is worth far more.

### Consequences
- Code reviewers check that listing endpoints use the right finder method.
- ESLint rule (eventually) flags raw `prisma.<model>.find*` calls outside repository files.

---

## ADR-012: Idempotency keys on write endpoints (Stripe-style)

**Status**: Accepted · **Date**: 2026-05-13

### Decision
`POST` endpoints that create resources accept an `Idempotency-Key` header (client-generated UUID). The server stores `(key, userId, requestHash, responseBody, statusCode)` for 24h. Replays return the cached response; mismatched body with same key returns 422.

### Rationale
- Mobile networks are flaky. Retries that succeed-twice are a classic source of duplicate orders, duplicate payments, duplicate bookings. This pattern is industry-standard (Stripe, Square, Shopify).

### Consequences
- Mobile clients **must** generate and persist a key per logical operation.
- Backend has a small but real storage cost (24h TTL).

---

## ADR-013: Postgres advisory locks for worker reservations, not Redis distributed locks

**Status**: Accepted · **Date**: 2026-05-13

### Decision
Reserving a worker uses `SELECT pg_try_advisory_xact_lock(hashtext('worker:'||$workerId))` inside the booking-creation transaction. The lock auto-releases at commit. Expired reservations are swept by a BullMQ delayed job (created at reservation time with `delay: 15min`).

### Rationale
- We already have Postgres; Redis advisory locks (Redlock) introduce a second consistency boundary and known correctness debates.
- Advisory locks are transactional and rock-solid for our scale.

### Consequences
- Lock keys must be globally unique; we namespace with the entity prefix (`worker:`, `booking:`, etc.).
- Cannot use this lock across multiple Postgres instances; fine since we have one primary.

---

## ADR-014: Zod for validation (not class-validator)

**Status**: Accepted · **Date**: 2026-05-13

### Decision
Use **Zod** schemas for request validation, with `nestjs-zod` for NestJS pipe integration and `zod-to-openapi` for Swagger generation. We do not use `class-validator`.

### Rationale
- Zod schemas are data, not classes — they compose cleanly, infer types automatically, and don't fight TypeScript generics.
- Schemas can be shared between backend and TS clients (via a generated `shared-types` package).
- Class-validator's decorator-on-class model gets messy at scale.

### Consequences
- DTOs are declared as `createZodDto(MySchema)`; same DX as class-validator but with better type inference.

---

## ADR-015: Cursor-based pagination, never offset

**Status**: Accepted · **Date**: 2026-05-13

### Decision
All list endpoints use cursor-based pagination keyed on the ULID primary key (sortable). Response shape: `{ items, nextCursor }`. Default page size 20, max 100.

### Rationale
- Offset pagination becomes inaccurate when the underlying dataset changes between requests — items skip or duplicate.
- Cursor pagination is O(log n) regardless of position; offset is O(n) at the tail.

### Consequences
- Clients can't jump to "page N" — only forward. This is fine for our UX (infinite scroll).

---

## ADR-016: Errors as RFC 7807 problem+json with structured error codes

**Status**: Accepted · **Date**: 2026-05-13

### Decision
All error responses follow RFC 7807 (`application/problem+json`) with an additional `code` field referencing a closed enum in `packages/shared-types/error-codes.ts`. The `requestId` is included for log correlation.

### Rationale
- Clients can `switch (error.code)` to render localized error UIs.
- Structured errors prevent the "parse the message string" antipattern.
- RFC 7807 is the established standard.

### Consequences
- Adding new error codes is a contract change; goes through code review.

---

## ADR-017: Three environments — dev (Docker Compose), staging (Railway), prod (Railway → AWS)

**Status**: Accepted · **Date**: 2026-05-13

### Decision
- **dev**: local Docker Compose (Postgres + Redis + Mailhog + Stripe mock).
- **staging**: Railway. Auto-deployed on push to `main`.
- **prod**: Railway initially; migrated to AWS at M5.
- All three use the same code path and migrations.

### Rationale
- Staging catches integration bugs before they hit users.
- Auto-deploy to staging forces the team to keep `main` shippable.

### Consequences
- Railway costs ~2× because we run staging full-time. Acceptable.

---

## ADR-018: Pino + Sentry + UptimeRobot for observability (no full APM at v1)

**Status**: Accepted · **Date**: 2026-05-13

### Decision
- **Logs**: Pino, JSON to stdout. Captured by Railway/CloudWatch.
- **Errors**: Sentry, with release = git SHA, 10% transaction sampling.
- **Uptime**: UptimeRobot multi-region pings on `/healthz`.
- No Datadog / New Relic / Honeycomb at v1.

### Rationale
- This stack costs ~$0 at MVP scale and covers 95% of incidents.
- Premature full-APM adoption locks us into a vendor before we know our observability needs.

### Consequences
- We add OpenTelemetry + a richer APM at M5 when AWS migration justifies it.

---

## ADR-019: Monorepo with pnpm + Turborepo

**Status**: Accepted · **Date**: 2026-05-13

### Decision
`apps/` (backend, admin-dashboard, website-next) + `packages/` (api-client-ts, api-client-kotlin, shared-types, eslint-config, tsconfig). Android stays in `android/` (separate Gradle project). Turborepo handles build orchestration and caching.

### Rationale
- Single repo, single CI, single PR for end-to-end changes that touch backend + admin.
- Generated clients are auto-synced via the same CI run.
- Turborepo's cache makes the build matrix fast even as the repo grows.

### Alternatives considered
- **Separate backend repo**: cleaner isolation but worse coordination — PRs touching the API contract span two repos.
- **No workspace tooling**: works but doesn't scale past 3 packages.

### Consequences
- We commit to pnpm (not npm/yarn) for the workspace.

---

## ADR-020: Audit log on every state-changing admin action, not on reads

**Status**: Accepted · **Date**: 2026-05-13

### Decision
A single `AuditLog` table captures every state-changing admin action via an `@Audit('action.name')` decorator + interceptor. Reads are **not** audited unless they touch sensitive data (payment details, ID documents).

### Rationale
- Auditing every read creates noise and slows things down.
- Auditing state changes catches all dispute-relevant events.

### Consequences
- We trust application-layer audit, not DB triggers. If forensic depth is ever required (regulatory), `pgaudit` is added.

---

## How to add a new ADR

1. Create a new section at the bottom with `ADR-NNN: <decision title>`, `Status: Proposed`, `Date: YYYY-MM-DD`.
2. Fill in: Context, Decision, Rationale, Alternatives considered, Consequences.
3. Open a PR. Tech lead + at least one other engineer review.
4. On merge, change status to `Accepted`.
5. If a future ADR supersedes this one, set this one's status to `Superseded by ADR-NNN` (with a link).
