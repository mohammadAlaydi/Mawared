# Implementation Guide — for the engineer (or AI) building this backend

> Read this **first**. It tells you exactly what to do, in what order, and how to know when you're done. Everything else in `docs/backend/` is reference material.

**Audience**: the next engineer or AI agent picking up this codebase from zero.
**Status**: Live — update if you change a convention.

---

## 1. Project context in 60 seconds

You're building the **backend API** for Mawared International, a domestic-worker recruitment marketplace operating in the MENA region. The Android app (Kotlin) and admin dashboard (Next.js) already exist — your job is the API they will both consume. You are **not** writing any frontend code.

The full stack, decisions, schema, and roadmap are already documented. Don't re-debate the locked-in choices — they are decisions made by the tech lead with explicit ADRs.

## 2. Read these in this exact order, then come back here

1. **`README.md`** — 2 minutes. Index and locked-in stack.
2. **`01-PRD.md`** — 10 minutes. Business context, users, scope. Skim non-functional requirements; you'll come back.
3. **`02-ARCHITECTURE.md`** — 30 minutes. Most important doc. Read every section. Pay extra attention to: §3 (architectural principles), §4 (module catalog), §6 (API design), §7 (auth), §8 (payments), §12 (background jobs), §17 (cross-cutting practices).
4. **`03-SCHEMA.prisma`** — 15 minutes. Scan all models; read carefully the comments on `Order`, `Reservation`, `RefreshToken`, `StripeEvent`, `IdempotencyKey`, `AuditLog`. Note the raw-SQL invariants at the bottom — these go in a follow-up migration.
5. **`04-ROADMAP.md`** — 15 minutes. You will be executing this milestone by milestone.
6. **`05-DECISIONS.md`** — 15 minutes. Read every ADR. If you ever feel tempted to deviate, read the relevant ADR first.
7. **`06-STATE_MACHINE.md`** — 5 minutes. The Order lifecycle. This is the heart of the domain.
8. **This file** — you're here.

Total reading time: ~90 minutes. Don't skip. Building the first commit before reading is the #1 way to waste a week.

## 3. Terminology you'll encounter

| Term | Means | Notes |
|---|---|---|
| `Order` | The customer's request for a worker. | Canonical name in schema, code, and API. |
| `Booking` | Same as `Order`. | Some older narrative passages use this. Treat as synonym. |
| `Worker` | A CV in the catalog (a domestic worker available for hire). | Not the same as a NestJS "worker process" (background-job consumer). |
| `Reservation` | The 15-minute hold on a worker during checkout. | Backed by a Postgres advisory lock. |
| `Contract` | The legal document generated after a paid order is confirmed. | One per Order. |
| `Staff` / `Admin` | A non-customer User (STAFF, BRANCH_MANAGER, or SUPER_ADMIN role). | Logs in with email + password + TOTP. |
| `Branch` | A Mawared physical office. | Workers and Staff are scoped to branches. |
| `Mawared` | The company. | Single org, multiple branches. Not multi-tenant. |

## 4. Locked-in conventions (do NOT deviate without an ADR)

- **Language**: TypeScript strict mode. Node 20 LTS.
- **Framework**: NestJS 10 modular monolith. Modules sliced by feature (see `02-ARCHITECTURE.md` §3).
- **DB**: Postgres 16 via Prisma 5. Migrations via `prisma migrate dev` locally, `prisma migrate deploy` in CI/CD.
- **Validation**: Zod schemas + `nestjs-zod`. **No `class-validator`.**
- **Auth**: RS256 access JWT (15min) + opaque rotated refresh token (30d) with family-tree theft detection.
- **Money**: `BigInt` minor-units + `Char(3)` currency. **Never** `Decimal`, **never** float. Wrapped in a `Money` value object.
- **IDs**: UUID v4 in schema (`@default(uuid())`). Exposed publicly as strings.
- **Timestamps**: `timestamptz` UTC everywhere. Format for display only.
- **Soft delete**: explicit `deletedAt` filtering. **No Prisma middleware.** Services have `findActive()` and `findIncludingDeleted()` methods.
- **API**: REST + OpenAPI 3.1, code-first via `@nestjs/swagger`. URI versioning (`/v1/...`).
- **Errors**: RFC 7807 problem+json with structured `code` enum in `packages/shared-types/error-codes.ts`.
- **Pagination**: Cursor-based. Never offset.
- **Idempotency**: `Idempotency-Key` header on every write that creates a resource. 24h TTL.
- **Logging**: Pino JSON. Every log line has `requestId`. PII redaction at the logger level.
- **Background jobs**: BullMQ on Redis. **No** business-logic in cron handlers.
- **State machine**: `Order.transition()` is a pure function. Side effects applied by the service. See `06-STATE_MACHINE.md`.

## 5. The folder structure you must create

```
apps/backend/
├── src/
│   ├── main.ts                       ← API process bootstrap
│   ├── worker.ts                     ← BullMQ consumer bootstrap
│   ├── app.module.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── otp.service.ts
│   │   │   ├── token.service.ts
│   │   │   ├── session.service.ts
│   │   │   ├── strategies/jwt.strategy.ts
│   │   │   ├── dto/
│   │   │   └── auth.spec.ts
│   │   ├── users/
│   │   ├── workers/
│   │   ├── catalog/
│   │   ├── promos/
│   │   ├── orders/                   ← the big one
│   │   │   ├── orders.module.ts
│   │   │   ├── orders.controller.ts
│   │   │   ├── orders.service.ts
│   │   │   ├── order.repository.ts
│   │   │   ├── order.entity.ts       ← pure domain entity, has transition()
│   │   │   ├── order.entity.spec.ts  ← state machine unit tests
│   │   │   └── dto/
│   │   ├── payments/
│   │   ├── contracts/
│   │   ├── notifications/
│   │   ├── files/
│   │   ├── branches/
│   │   ├── admin/
│   │   └── health/
│   ├── shared/
│   │   ├── prisma/
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts
│   │   ├── config/
│   │   │   ├── config.module.ts
│   │   │   └── env.schema.ts         ← Zod schema for env vars
│   │   ├── logger/
│   │   ├── queue/                    ← BullMQ wrapper + JobQueue interface
│   │   ├── money/                    ← Money value object
│   │   ├── locale/
│   │   ├── mail/
│   │   ├── sms/
│   │   ├── push/
│   │   ├── storage/                  ← R2/S3 client
│   │   └── audit/
│   └── common/
│       ├── decorators/               ← @CurrentUser, @Roles, @Audit
│       ├── guards/                   ← JwtAuthGuard, RolesGuard
│       ├── interceptors/             ← RequestContextInterceptor, TransformInterceptor
│       ├── pipes/                    ← ZodValidationPipe
│       └── filters/                  ← AllExceptionsFilter (RFC 7807)
├── prisma/
│   ├── schema.prisma                 ← copied from docs/backend/03-SCHEMA.prisma
│   ├── migrations/
│   └── seed.ts
├── test/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── Dockerfile
├── nest-cli.json
├── tsconfig.json
├── package.json
└── .env.example
```

## 6. Patterns to follow (sample code)

### 6.1 A typical controller

```ts
// apps/backend/src/modules/workers/workers.controller.ts
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { WorkersService } from './workers.service';
import { SearchWorkersSchema, SearchWorkersDto } from './dto/search-workers.dto';
import { WorkerResponseDto } from './dto/worker.response.dto';

@ApiTags('workers')
@Controller({ path: 'workers', version: '1' })
@UseGuards(JwtAuthGuard)
export class WorkersController {
  constructor(private readonly workers: WorkersService) {}

  @Get()
  search(@Query(new ZodValidationPipe(SearchWorkersSchema)) q: SearchWorkersDto) {
    return this.workers.search(q);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser): Promise<WorkerResponseDto> {
    return this.workers.findById(id, user);
  }
}
```

### 6.2 A typical DTO (Zod-based)

```ts
// apps/backend/src/modules/workers/dto/search-workers.dto.ts
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const SearchWorkersSchema = z.object({
  profession: z.enum(['DOMESTIC_WORKER', 'DRIVER', 'CAREGIVER_ELDERLY', 'CAREGIVER_CHILD']).optional(),
  nationalityCode: z.string().length(2).toUpperCase().optional(),
  languageCode: z.string().min(2).max(5).toLowerCase().optional(),
  minSalaryMinor: z.coerce.bigint().nonnegative().optional(),
  maxSalaryMinor: z.coerce.bigint().nonnegative().optional(),
  sort: z.enum(['price_asc', 'price_desc', 'rating_desc', 'newest']).default('newest'),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).strict();

export class SearchWorkersDto extends createZodDto(SearchWorkersSchema) {}
```

### 6.3 A typical service (Prisma direct, no repository — for simple modules)

```ts
// apps/backend/src/modules/workers/workers.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { SearchWorkersDto } from './dto/search-workers.dto';

@Injectable()
export class WorkersService {
  constructor(private readonly prisma: PrismaService) {}

  async search(q: SearchWorkersDto) {
    const where = {
      deletedAt: null,
      availability: 'AVAILABLE' as const,
      ...(q.profession && { profession: q.profession }),
      ...(q.nationalityCode && { nationality: { code: q.nationalityCode } }),
      ...(q.minSalaryMinor && { monthlySalaryMinor: { gte: q.minSalaryMinor } }),
      ...(q.maxSalaryMinor && { monthlySalaryMinor: { lte: q.maxSalaryMinor } }),
    };
    const items = await this.prisma.worker.findMany({
      where,
      take: q.limit + 1,
      ...(q.cursor && { cursor: { id: q.cursor }, skip: 1 }),
      orderBy: this.toOrderBy(q.sort),
      include: { nationality: true, languages: { include: { language: true } }, skills: { include: { skill: true } } },
    });
    const hasMore = items.length > q.limit;
    return { items: items.slice(0, q.limit), nextCursor: hasMore ? items[q.limit - 1].id : null };
  }

  async findById(id: string, _actor: AuthUser) {
    const worker = await this.prisma.worker.findFirst({ where: { id, deletedAt: null } });
    if (!worker) throw new NotFoundException({ code: 'WORKER_NOT_FOUND' });
    return worker;
  }

  private toOrderBy(sort: SearchWorkersDto['sort']) {
    switch (sort) {
      case 'price_asc':   return { monthlySalaryMinor: 'asc' as const };
      case 'price_desc':  return { monthlySalaryMinor: 'desc' as const };
      case 'rating_desc': return { rating: 'desc' as const };
      case 'newest':      return { createdAt: 'desc' as const };
    }
  }
}
```

### 6.4 A typical pure-domain entity (Order — the BIG one)

See `06-STATE_MACHINE.md` for the reference `Order.transition()` and test obligations. The repository handles persistence; the entity handles invariants.

### 6.5 A typical unit test

```ts
// apps/backend/src/modules/orders/order.entity.spec.ts
import { describe, expect, it } from 'vitest';
import { nextStatus, InvalidTransitionError } from './order.entity';

describe('Order state machine', () => {
  it('transitions DRAFT -[submit]-> RESERVED', () => {
    expect(nextStatus('DRAFT', { type: 'submit' })).toBe('RESERVED');
  });

  it('throws on illegal transition', () => {
    expect(() => nextStatus('COMPLETED', { type: 'cancel', actor: 'staff' }))
      .toThrow(InvalidTransitionError);
  });

  // ... cover every row of the transition matrix
});
```

### 6.6 A typical integration test (Testcontainers + Prisma)

```ts
// apps/backend/test/integration/orders.create.spec.ts
import { Test } from '@nestjs/testing';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { AppModule } from '@/app.module';

let pg: StartedPostgreSqlContainer;
let app: INestApplication;

beforeAll(async () => {
  pg = await new PostgreSqlContainer('postgres:16-alpine').start();
  process.env.DATABASE_URL = pg.getConnectionUri();
  process.env.DIRECT_DATABASE_URL = pg.getConnectionUri();
  execSync('pnpm prisma migrate deploy', { stdio: 'inherit' });

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication();
  await app.init();
}, 60_000);

afterAll(async () => {
  await app.close();
  await pg.stop();
});

it('POST /v1/orders creates a RESERVED order', async () => {
  // ... seed customer, worker, package, address
  // ... POST with idempotency key
  // ... expect 201 and order.status === 'RESERVED'
});
```

## 7. Environment variables you must set

`apps/backend/.env.example` lists all of them. Production sets these in Railway (and later AWS Secrets Manager). Never commit real values.

```bash
# Runtime
NODE_ENV=development                                    # development | staging | production
PORT=3000
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/mawared?schema=public&pgbouncer=true&connection_limit=1
DIRECT_DATABASE_URL=postgresql://user:pass@localhost:5432/mawared?schema=public

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."     # PEM, RS256
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n..."
JWT_ISSUER=https://api.mawared.example
JWT_AUDIENCE_CUSTOMER=mawared-customer
JWT_AUDIENCE_ADMIN=mawared-admin
ACCESS_TOKEN_TTL_SECONDS=900                           # 15 min
REFRESH_TOKEN_TTL_SECONDS=2592000                      # 30 days

# Twilio (OTP)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_FROM_NUMBER=+15555550100

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx                     # exposed to clients, served on /config

# Cloudflare R2 (S3-compatible)
S3_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=mawared-dev-uploads
S3_ACCESS_KEY_ID=xxx
S3_SECRET_ACCESS_KEY=xxx
S3_PUBLIC_BASE_URL=https://cdn.mawared.example

# Firebase (push)
FCM_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'

# Resend (email)
RESEND_API_KEY=re_xxx
EMAIL_FROM=no-reply@mawared.example

# Observability
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_ENVIRONMENT=development

# Frontend CORS allowlist (admin + website)
CORS_ORIGINS=http://localhost:3001,http://localhost:3002

# Feature flags fallback
FEATURE_FLAGS_DEFAULT_ENABLED=false
```

Validate them with Zod at boot in `shared/config/env.schema.ts` — if a required var is missing, the app refuses to start.

## 8. Local development workflow

```bash
# First time
git clone <repo>
cd mawared
pnpm install
cp apps/backend/.env.example apps/backend/.env
# Fill in .env with dev secrets

# Run the dependencies
docker compose -f infra/docker-compose.yml up -d

# Migrate + seed
pnpm --filter @mawared/backend prisma migrate dev
pnpm --filter @mawared/backend prisma db seed

# Start the API
pnpm --filter @mawared/backend dev

# (separate terminal) Start the worker
pnpm --filter @mawared/backend dev:worker

# (separate terminal) Listen for Stripe webhooks against localhost
stripe listen --forward-to localhost:3000/v1/payments/webhooks/stripe
```

Tests:

```bash
pnpm --filter @mawared/backend test:unit          # Vitest, no DB
pnpm --filter @mawared/backend test:integration   # Testcontainers, real PG per test file
pnpm --filter @mawared/backend test:e2e           # Playwright
```

## 9. M0 — your first sprint (what "done" looks like)

Don't move past M0 until **every** box below is true:

- [ ] `pnpm install` works from a fresh clone.
- [ ] `docker compose up` boots Postgres + Redis + Mailhog.
- [ ] `pnpm --filter @mawared/backend prisma migrate dev` applies cleanly.
- [ ] Post-migration raw SQL (CHECK constraints, partial index, pg_trgm) lives in a separate migration file.
- [ ] `pnpm --filter @mawared/backend dev` starts the API and listens on `localhost:3000`.
- [ ] `curl localhost:3000/healthz` returns `{"ok":true}`.
- [ ] `curl localhost:3000/readyz` returns 200 only when DB + Redis are reachable.
- [ ] `pnpm --filter @mawared/backend dev:worker` starts the worker process; it logs "ready".
- [ ] OpenAPI doc available at `localhost:3000/v1/docs` (Swagger UI).
- [ ] `pnpm test:unit` passes (even if there's just one trivial test).
- [ ] `pnpm test:integration` passes against a Testcontainers Postgres.
- [ ] `pnpm lint` and `pnpm typecheck` are green.
- [ ] GitHub Actions `ci.yml` runs on every PR; required checks set in branch protection.
- [ ] `openapi.json` is generated, committed, and CI fails on drift.
- [ ] Railway staging deployment runs; `/readyz` is green.
- [ ] Sentry receives a test exception from staging.

If any box is unchecked, **do not start M1**. M0 is the foundation; rushing it pays back tenfold in pain.

## 10. M1 onwards

Follow `04-ROADMAP.md` exactly. For each milestone:

1. Read the **DoD** before you write any code.
2. Read the **Tasks** list and map them to GitHub issues if you want.
3. Build feature by feature, in the order listed (dependencies matter — auth before everything else, orders before payments, etc.).
4. Before moving on, run through the DoD and check every box.
5. **Update `05-DECISIONS.md`** with a new ADR if you made any material call not already covered.

## 11. Things you will be tempted to do — don't

This list is the most valuable part of this doc. Read it twice.

- ❌ **Skip the OpenAPI spec because it slows you down.** It will save you weeks the first time a client gets out of sync.
- ❌ **Use `class-validator` because the NestJS docs use it.** We use Zod (ADR-014).
- ❌ **Reach for Redis distributed locks for worker reservations.** Use Postgres advisory locks (ADR-013).
- ❌ **Add a service mesh, Kafka, or microservices.** We're a modular monolith (ADR-008).
- ❌ **Store money as Decimal or float.** BigInt minor-units only (ADR-010).
- ❌ **Hide `deletedAt` filtering behind Prisma middleware.** Explicit `findActive` / `findIncludingDeleted` (ADR-011).
- ❌ **Use offset pagination because it's easier.** Cursor only (ADR-015).
- ❌ **Use `class-validator` decorators in your DTOs.** Zod.
- ❌ **Add a "test coverage 100%" gate.** It's noise. Target the matrix in `02-ARCHITECTURE.md` §13.
- ❌ **Implement state transitions inside `OrdersService.create()`.** They go on `Order.transition()` (pure function); side effects belong to the service.
- ❌ **Confirm Stripe payments from the server.** Let the SDK + client confirm via Payment Sheet; trust the webhook.
- ❌ **Process Stripe webhooks synchronously.** Persist, ACK fast, process async via BullMQ.
- ❌ **Forget to use the raw body for Stripe webhooks.** Carve out a custom body parser for `/v1/payments/webhooks/stripe`.
- ❌ **Run `prisma migrate deploy` inside the app entrypoint.** It races on multi-replica. Use Railway's pre-deploy command.
- ❌ **Re-derive amounts from Stripe at runtime.** Always snapshot at create time, reconcile via webhook.
- ❌ **Skip idempotency keys "for the MVP".** Mobile networks are flaky from day one.
- ❌ **Hard-delete anything user-facing.** Soft-delete + scheduled cleanup job after retention window.
- ❌ **Log raw OTPs, JWTs, card details, or phone numbers in full.** Pino redact paths catch most of this — add new fields as you create them.

## 12. When you're stuck

1. Re-read the relevant section of `02-ARCHITECTURE.md`.
2. Check `05-DECISIONS.md` — there might already be an answer.
3. If you must deviate, write a new ADR proposing the deviation.
4. If a third-party service (Stripe, Twilio, FCM) is the question: read **their** docs, not StackOverflow.
5. If still stuck after 30 minutes: ask the tech lead. Don't burn a day spinning.

## 13. Definition of "senior-grade" for this codebase

You're done when:

- Every endpoint has a Zod schema and a controller test.
- Every state-changing admin action writes an AuditLog row.
- Every external integration is behind an interface (`PaymentProvider`, `SmsProvider`, `PushChannel`, `StorageProvider`, `MailProvider`).
- Every money column has a non-negative CHECK constraint.
- Every queue job is idempotent (or at-least-once-safe).
- Every `prisma.*.find*` outside a repository is reviewed.
- `openapi.json` matches the running code on every deploy.
- A new engineer can run `pnpm install && pnpm dev` and ship a one-line change to staging in their first hour.

That's the bar. Hit it.

---

**Last updated**: 2026-05-13 · **Owner**: Backend tech lead
