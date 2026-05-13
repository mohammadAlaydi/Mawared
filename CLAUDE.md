# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

Mawared is a full-stack platform for domestic worker recruitment in Saudi Arabia. It consists of a NestJS API, a Next.js admin dashboard, a Next.js marketing website, and a Kotlin/Compose Android app — all in one pnpm monorepo orchestrated by Turborepo.

## Monorepo layout

```
apps/backend/          NestJS API (port 3000) + BullMQ worker
admin-dashboard/       Next.js 16 admin UI (port 3001)
website-next/          Next.js 16 marketing site
android/               Kotlin/Compose Android app
packages/
  api-client-ts/       @mawared/api-client — generated from OpenAPI spec
  api-client-kotlin/   Retrofit client — generated from OpenAPI spec
  shared-types/        @mawared/shared-types — error codes, enums, hand-written TS
  tsconfig/            @mawared/tsconfig — shared base TS configs
infra/                 docker-compose (Postgres 16, Redis 7, Mailhog), Railway config, k6 load tests
docs/backend/          PRD, architecture, schema, roadmap, ADRs, state machine, implementation guide
```

## Development commands

**Start infrastructure first (Postgres, Redis, Mailhog):**
```bash
pnpm infra:up
```

**Run everything from the root:**
```bash
pnpm install              # install all workspaces
pnpm backend:dev          # API on :3000
pnpm backend:worker       # BullMQ consumer (separate process)
pnpm backend:migrate      # prisma migrate dev
pnpm backend:seed         # idempotent dev seed
pnpm infra:down           # stop Docker Compose
```

**Turbo-orchestrated tasks (run from root or within a package):**
```bash
pnpm build                # build all packages
pnpm lint                 # lint all
pnpm typecheck            # tsc --noEmit all
pnpm test:unit            # vitest unit
pnpm test:integration     # vitest + Testcontainers (real Postgres)
pnpm test:e2e             # vitest E2E
```

**Backend-specific (from `apps/backend/`):**
```bash
pnpm test:unit:watch      # vitest watch
pnpm openapi:generate     # regenerate openapi.json
pnpm prisma:studio        # open Prisma Studio
pnpm prisma:generate      # regenerate Prisma client after schema changes
```

**Android (from `android/`):**
```bash
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## Backend architecture

The backend is a NestJS modular monolith with two process entrypoints:
- `src/main.ts` — HTTP API server
- `src/worker.ts` — BullMQ consumer (gated on `MAWARED_PROCESS=worker`)

### Module layout

`src/modules/` is sliced by feature. Each module follows:
```
modules/<feature>/
├── <feature>.module.ts
├── <feature>.controller.ts
├── <feature>.service.ts
├── <feature>.repository.ts    (only for aggregate roots)
├── <feature>.entity.ts        (domain invariants for aggregates)
├── dto/
│   ├── <input>.dto.ts
│   └── <response>.dto.ts
└── *.spec.ts
```

Feature modules: `auth`, `users`, `workers`, `catalog`, `orders`, `payments`, `contracts`, `notifications`, `branches`, `offers`, `verifications`, `leads`, `files`, `health`, and `admin` (which contains sub-scoped admin endpoints for audit, orders, workers, customers, staff, promos, payments, reports, catalog, verifications, flags).

`src/shared/` contains cross-cutting singletons: `prisma`, `config`, `logger` (Pino), `queue` (BullMQ), `money` (value object), `redis`, `sms`, `audit`, `feature-flags`.

`src/common/` contains decorators (`@CurrentUser`, `@Roles`, `@Public`, `@Idempotent`), guards (JWT RS256/HS256, Roles), interceptors (request context, audit, idempotency, transform), pipes (ZodValidationPipe), and the global `AllExceptionsFilter` (RFC 7807).

### Authentication

- OTP request/verify → JWT issuance. Access tokens: RS256, 15-min TTL. Refresh tokens: opaque, rotated, 30-day TTL.
- Per-device sessions with family-tree theft detection on refresh.
- Admin: email + argon2id password + TOTP (RFC 6238).
- JWKS endpoint available for key rotation.
- Roles: `CUSTOMER`, `STAFF`, `BRANCH_MANAGER`, `SUPER_ADMIN`.

### Order state machine

11 states, 18 transitions: `DRAFT → RESERVED → PAYMENT_PENDING → PAID → UNDER_REVIEW → CONFIRMED → IN_PROGRESS → COMPLETED` (and `CANCELLED → REFUNDED`).

State logic lives in a pure `nextStatus(current, event)` function inside `orders.entity.ts`. Side effects (notifications, contract issuance, etc.) are applied by `OrdersService`. See `docs/backend/06-STATE_MACHINE.md` for the full transition matrix.

### Money

Always BigInt minor units + `Char(3)` currency code. Never `Decimal`, never `float`. Use the `Money` value object in `src/shared/money/`. CHECK constraints enforce this at the database level.

### Pagination

Cursor-based only (`src/common/pagination.ts`). Never offset-based.

### Validation and errors

All request validation uses Zod schemas with `nestjs-zod`'s `ZodValidationPipe`. Never `class-validator`. All error responses are RFC 7807 `application/problem+json` with a structured `code` field sourced from `@mawared/shared-types`.

### Idempotency

Every mutating POST must accept an `Idempotency-Key` header. The `@Idempotent()` decorator + `IdempotencyInterceptor` handle deduplication (24h TTL in Redis).

### Soft deletes

No Prisma middleware for soft-delete. Services must explicitly filter `deletedAt: null` in every query.

### Logging

Pino JSON logger with request-id correlation on every line. PII redaction is configured — extend `redact` paths when adding sensitive fields, never log them raw.

## Database

Postgres 16 via Prisma 5. Extensions: `pgcrypto`, `citext`, `pg_trgm`. Key models: `User`, `Customer`, `StaffProfile`, `Session`, `RefreshToken`, `Worker`, `Order`, `Reservation`, `Payment`, `Contract`, `Notification`, `AuditLog`, `IdentityVerification`, `FeatureFlag`.

After changing `prisma/schema.prisma`, run `pnpm prisma:generate` and create a migration with `pnpm backend:migrate`.

## External integrations

All integrations are behind interface abstractions and env-gated:

| Service | Purpose |
|---|---|
| Stripe | Payments + async webhook processing via BullMQ |
| Twilio | OTP SMS |
| FCM | Push notifications |
| Signit.sa | Saudi national-ID verification |
| Cloudflare R2 | S3-compatible storage (contracts, photos) |
| Resend | Transactional email (optional) |
| Sentry | Error tracking |

## Testing

Three Vitest configs in `apps/backend/`:
- `vitest.config.ts` — unit tests (`**/*.spec.ts`), no DB
- `vitest.integration.config.ts` — integration tests with Testcontainers (real Postgres spun up per suite)
- `vitest.e2e.config.ts` — E2E tests against a running server

CI runs lint + typecheck + unit on every PR, plus integration tests with Postgres and Redis service containers.

## CI/CD

GitHub Actions workflows in `.github/workflows/`:
- `backend-ci.yml` — lint, typecheck, unit, integration (triggers on changes to `apps/backend/**` or `packages/**`)
- `openapi-drift.yml` — fails if `openapi.json` is out of sync with the generated output

Deployments target Railway. Pre-deploy hook: `cd apps/backend && pnpm prisma migrate deploy`. Healthcheck: `GET /healthz`.

## Next.js apps (admin-dashboard, website-next)

Both use **Next.js 16** with React 19, Tailwind CSS 4, and the App Router. Next.js 16 has breaking changes from earlier versions — read `node_modules/next/dist/docs/` before coding rather than assuming prior Next.js conventions apply. The admin dashboard runs on port 3001; the marketing site on port 3000 (conflicts with the backend in local dev — run them separately).

Admin dashboard depends on `@mawared/api-client`. The marketing site is read-only (no API client). Both support RTL Arabic.

## Key documentation to read before significant backend work

1. `docs/backend/02-ARCHITECTURE.md` — system design, module catalog, API principles
2. `docs/backend/05-DECISIONS.md` — ADRs explaining why things are the way they are
3. `docs/backend/06-STATE_MACHINE.md` — order lifecycle transition matrix
4. `apps/backend/AGENTS.md` — hard rules specific to this codebase
