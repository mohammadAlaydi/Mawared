# Mawared Backend — Architecture (v1)

> Technical architecture for the NestJS backend powering the Mawared platform.

**Status**: Draft for engineering kickoff
**Owner**: Backend tech lead
**Last updated**: 2026-05-13

---

## 0. TL;DR

A **modular NestJS monolith** in a **pnpm + Turborepo monorepo**, talking to **Postgres + Redis + Cloudflare R2 + Stripe + Twilio + FCM**, deployed to **Railway** today with a clear path to **AWS ECS Fargate** later. Every external integration is behind a single-purpose interface so swapping providers is a config change. We optimize for **clean module boundaries, type-safe APIs, idempotency, and observability**, not for premature scale.

---

## 1. System overview

```
                          ┌─────────────────────────────────────┐
                          │           CLIENTS                    │
                          │                                      │
        ┌─────────────┐   │   ┌──────────────┐  ┌─────────────┐ │
        │   Android   │───┼──▶│ Admin (Next) │  │ Website     │ │
        │   (Kotlin)  │   │   └──────────────┘  │ (Next, SSR) │ │
        └──────┬──────┘   │          │          └──────┬──────┘ │
               │          └──────────┼─────────────────┼────────┘
               │ HTTPS / JSON        │ HTTPS / JSON    │ HTTPS
               │                     │                 │
               ▼                     ▼                 ▼
        ┌──────────────────────────────────────────────────────┐
        │  API GATEWAY (NestJS, Node 20)                       │
        │  - Global guards: JWT, Throttler                     │
        │  - Global interceptors: Logging, Transform, RequestId│
        │  - Global filters: HttpException → RFC 7807          │
        │  - Versioning: /v1                                   │
        │                                                       │
        │   FEATURE MODULES (modular monolith):                │
        │   ┌────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐  │
        │   │ auth   │ │ users   │ │ workers  │ │ catalog  │  │
        │   └────────┘ └─────────┘ └──────────┘ └──────────┘  │
        │   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
        │   │ bookings │ │ payments │ │ contracts│ │ promos │ │
        │   └──────────┘ └──────────┘ └──────────┘ └────────┘ │
        │   ┌──────────────┐ ┌──────────┐ ┌──────────────┐    │
        │   │ notifications│ │ admin    │ │ files        │    │
        │   └──────────────┘ └──────────┘ └──────────────┘    │
        └─────┬──────────┬───────────┬──────────────┬────────┘
              │          │           │              │
              ▼          ▼           ▼              ▼
        ┌─────────┐ ┌────────┐  ┌──────────┐  ┌──────────┐
        │Postgres │ │ Redis  │  │ R2 (S3   │  │ Worker   │
        │  16     │ │  7     │  │ via AWS  │  │ Process  │
        │+PgBounc.│ │(BullMQ)│  │ SDK v3)  │  │ (BullMQ) │
        └─────────┘ └────────┘  └──────────┘  └────┬─────┘
                                                    │
                                                    ▼
                                       ┌─────────────────────┐
                                       │ External providers: │
                                       │  Stripe   (payments)│
                                       │  Twilio   (OTP SMS) │
                                       │  FCM      (push)    │
                                       │  Resend   (email)   │
                                       │  Sentry   (errors)  │
                                       └─────────────────────┘
```

Two NestJS deployments share one codebase: the **API process** (HTTP) and the **worker process** (BullMQ consumer). They share the same modules; only the entrypoint differs.

---

## 2. Monorepo layout

```
mawared/                           ← repo root
├── apps/
│   ├── backend/                   ← THIS IS WHAT WE'RE BUILDING
│   │   ├── src/
│   │   │   ├── main.ts            ← API process bootstrap
│   │   │   ├── worker.ts          ← BullMQ consumer bootstrap
│   │   │   ├── app.module.ts
│   │   │   ├── modules/           ← feature modules (see §4)
│   │   │   ├── shared/            ← cross-cutting building blocks
│   │   │   └── common/            ← decorators, guards, interceptors, pipes, filters
│   │   ├── prisma/
│   │   │   ├── schema.prisma      ← single source of truth for DB schema
│   │   │   ├── migrations/        ← generated, committed
│   │   │   └── seed.ts            ← idempotent dev seed
│   │   ├── test/
│   │   │   ├── unit/              ← Vitest, no DB
│   │   │   ├── integration/       ← Testcontainers + real Postgres
│   │   │   └── e2e/               ← happy-path Playwright
│   │   ├── Dockerfile             ← multi-stage, Alpine base, non-root user
│   │   ├── nest-cli.json
│   │   ├── tsconfig.json
│   │   ├── package.json
│   │   └── openapi.json           ← regenerated in CI, committed
│   │
│   ├── admin-dashboard/           ← existing Next.js admin
│   └── website-next/              ← existing Next.js marketing
│
├── packages/
│   ├── api-client-ts/             ← generated from openapi.json (admin + website)
│   ├── api-client-kotlin/         ← generated from openapi.json (Android module)
│   ├── shared-types/              ← hand-written TS types used by both backend and clients (e.g. error codes, enums mirrors)
│   ├── eslint-config/             ← shared lint config
│   └── tsconfig/                  ← shared tsconfig bases
│
├── android/                       ← existing native Android app
├── docs/
│   └── backend/                   ← this folder
│
├── infra/
│   ├── railway.toml               ← Railway service config
│   ├── docker-compose.yml         ← local dev: postgres + redis + mailhog
│   └── terraform/                 ← (added at M5) AWS migration IaC
│
├── .github/workflows/
│   ├── ci.yml                     ← lint, typecheck, tests
│   ├── openapi-drift.yml          ← fail if openapi.json out of sync
│   └── deploy.yml                 ← deploy to Railway staging/prod
│
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
└── README.md
```

**Why this layout**:
- `apps/` for runnable artifacts, `packages/` for shared libs — this is the well-trodden Turborepo convention.
- Backend Prisma schema lives next to backend code, *not* in a shared package. Schemas don't deserve to be cross-team-shared; the OpenAPI spec is the contract.
- `openapi.json` is committed and CI-enforced. A PR that changes the API surface without updating it fails CI. Clients are regenerated from it.

---

## 3. NestJS architectural principles

### 3.1 Modular monolith, sliced by feature

> "Don't build microservices until you can't avoid them." — every senior engineer with scars.

For a 2–4 person team, a single deployable monolith with **clean module boundaries** is the right choice. We can extract any module into its own service later without rewriting code, *if* we keep these rules:

- **No module imports another module's services directly.** Cross-module calls go through that module's exported provider (its public API).
- **Each feature module owns its Prisma queries.** Other modules ask for the data via the providing module's service, not via Prisma directly.
- **No cyclic imports between modules.** ESLint enforces this.
- **Shared logic** (logger, config, prisma client, mail client) lives in `shared/`, exported as injectable providers.

### 3.2 Layered inside a module

```
modules/bookings/
├── booking.module.ts          ← wires controllers + providers
├── booking.controller.ts      ← HTTP only; validates DTOs, calls service
├── booking.service.ts         ← orchestration; uses repository + other module services
├── booking.repository.ts      ← Prisma queries (only for the bookings aggregate)
├── booking.entity.ts          ← pure domain class with transition() method
├── booking.events.ts          ← in-process events (BookingPaidEvent, etc.)
├── dto/
│   ├── create-booking.dto.ts
│   ├── update-booking-status.dto.ts
│   └── booking.response.dto.ts
└── booking.spec.ts            ← unit tests on entity logic
```

**Repository pattern is used selectively** — only for the `Booking` aggregate (because it has complex queries + advisory-lock reservation logic + we want to mock it in unit tests). For simple modules like `branches`, `catalog`, etc., the service uses `PrismaService` directly. Don't over-abstract.

### 3.3 Cross-cutting via `APP_*` providers

| Concern | Mechanism | Lives in |
|---|---|---|
| Auth (verify JWT) | `APP_GUARD` → `JwtAuthGuard` | `common/guards/` |
| Role-based access | `@Roles()` decorator + `RolesGuard` | `common/guards/` |
| Rate limiting | `APP_GUARD` → `ThrottlerGuard` (`@nestjs/throttler`) | global |
| Request ID + Pino child logger | `APP_INTERCEPTOR` → `RequestContextInterceptor` | `common/interceptors/` |
| Response shaping | `APP_INTERCEPTOR` → `TransformInterceptor` | `common/interceptors/` |
| Error → RFC 7807 | `APP_FILTER` → `AllExceptionsFilter` | `common/filters/` |
| Validation | `APP_PIPE` → `ZodValidationPipe` (we use Zod over class-validator) | global |
| Audit log | `@AuditLog('action.name')` decorator + interceptor | `common/audit/` |

### 3.4 DTOs and validation: Zod, not class-validator

Class-validator decorators couple validation rules to TypeScript classes, which gets messy with nested generics and inference. **Zod** schemas are pure data, can be derived from Prisma types, and infer TypeScript types automatically. We use `nestjs-zod` to wire Zod into NestJS pipes + Swagger.

```ts
// dto/create-booking.dto.ts
export const CreateBookingSchema = z.object({
  workerId: z.string().uuid(),
  packageId: z.string().uuid(),
  addressId: z.string().uuid(),
  promoCode: z.string().trim().toUpperCase().optional(),
  notes: z.string().max(500).optional(),
});
export class CreateBookingDto extends createZodDto(CreateBookingSchema) {}
```

The same Zod schema generates an OpenAPI definition via `zod-to-openapi`.

### 3.5 Domain modeling depth — proportional to risk

| Module | Modeling depth | Why |
|---|---|---|
| `bookings` | Full domain entity + repository + events | Complex state machine, money, reservation invariants |
| `payments` | Domain entity (PaymentIntent wrapper) + repository | Money + Stripe webhooks + idempotency |
| `contracts` | Domain entity (issue/void rules) | Legal artifact, immutable once issued |
| `auth` | Service + repository | Token rotation logic is risky |
| `workers`, `catalog`, `branches`, `promos`, `notifications`, `users` | Service + PrismaService direct | Mostly CRUD |

Senior heuristic: **add a layer only when you can name the bug it prevents**.

---

## 4. Module catalog

Each module's public API is what other modules can call. Internal services stay private.

### 4.1 `auth`
**Owns**: OTP generation/verification, JWT issuance, refresh-token rotation, session listing, device registration.
**Public API**: `OtpService.request(phone, locale)`, `OtpService.verify(phone, code, deviceId)` → `{ accessToken, refreshToken }`, `TokenService.refresh(refreshToken)`, `SessionService.list(userId)`, `SessionService.revoke(userId, sessionId)`.

### 4.2 `users`
**Owns**: User + Customer profile, addresses, notification preferences, account deletion.
**Public API**: `UsersService.findById(id)`, `UsersService.upsertCustomerProfile(...)`, `AddressService.list/create/update/delete`.

### 4.3 `workers`
**Owns**: Worker CV CRUD, photo upload, availability state, favorites (saved workers).
**Public API**: `WorkersService.search(query)`, `WorkersService.findById(id)`, `WorkersService.setAvailability(id, state)`, `FavoritesService.toggle(userId, workerId)`.

### 4.4 `catalog`
**Owns**: `ServiceCategory` and `ServicePackage` entities.
**Public API**: `CatalogService.listServices(locale)`, `CatalogService.findPackage(id)`.

### 4.5 `promos`
**Owns**: Promo codes, redemption rules, usage tracking.
**Public API**: `PromosService.validate(code, context)` → `{ valid, discountMinor, reason? }`, `PromosService.recordRedemption(...)`.

### 4.6 `bookings`
**Owns**: Booking aggregate, state machine, worker reservation (Postgres advisory lock), reservation expiry.
**Public API**: `BookingsService.create(input)`, `BookingsService.findById(id, actor)`, `BookingsService.transition(id, event, actor)`, `BookingsService.listForCustomer(userId)`, `BookingsService.listForAdmin(filters)`.

### 4.7 `payments`
**Owns**: Stripe PaymentIntent lifecycle, webhook ingestion, refunds.
**Public API**: `PaymentsService.createIntentForBooking(bookingId)`, `PaymentsService.refund(paymentId, amountMinor, reason)`, internal `StripeWebhookController.handle(rawBody, signature)`.

### 4.8 `contracts`
**Owns**: Contract entity, PDF generation, void/regenerate.
**Public API**: `ContractsService.issueFor(bookingId)`, `ContractsService.regeneratePdf(contractId)`, `ContractsService.void(contractId, reason)`.

### 4.9 `notifications`
**Owns**: In-app notifications, push (FCM), email (Resend), device tokens.
**Public API**: `NotificationsService.send(userId, template, params, channels?)`, `DeviceTokensService.register/unregister`.

### 4.10 `files`
**Owns**: R2 uploads, presigned URLs, file metadata.
**Public API**: `FilesService.createUploadUrl(scope, mime, sizeBytes)`, `FilesService.finalize(fileId)`, `FilesService.delete(fileId)`.

### 4.11 `branches`
**Owns**: Branch directory.
**Public API**: `BranchesService.list()`, `BranchesService.findById(id)`.

### 4.12 `admin`
**Owns**: Staff/admin user management, RBAC role assignment, audit log queries, reports.
**Public API**: `StaffService.create/update/deactivate`, `ReportsService.revenue/orders/refunds`, `AuditService.query(filters)`.

---

## 5. Database

Full DDL is in [03-SCHEMA.prisma](./03-SCHEMA.prisma). This section explains the *principles*.

### 5.1 Conventions

- **Primary keys**: ULID-as-string (`@id @default(dbgenerated("gen_random_uuid()"))` for now, swap to ULID generation later — sortability matters for cursor pagination). Never expose internal `int` IDs.
- **Timestamps**: every table has `createdAt`, `updatedAt` (Prisma `@updatedAt`). Money-carrying tables get `paidAt`, `refundedAt`, etc. — all `timestamptz`, stored UTC.
- **Soft delete**: `deletedAt timestamptz NULL`. Default queries filter `deletedAt: null` explicitly — no Prisma middleware magic. Admin tooling has explicit "include deleted" toggles.
- **Money**: `amountMinor BigInt` + `currency Char(3)` on every money column. Never `Decimal`, never `Float`. Postgres `CHECK (amount_minor >= 0)`.
- **Localized text**: `nameAr Text NOT NULL`, `nameEn Text NULL` for searchable strings (so we can index them). `descriptions` use `Json` typed as `{ ar: string; en?: string }`.
- **Enums**: Prisma `enum` for closed sets (BookingStatus, PaymentStatus, UserRole). Open-ended editable lists (skills, nationalities) get lookup tables with `code` + localized labels.
- **Indexes**: composite indexes matching the actual filter+sort shape, never single-column "just in case" indexes. Every foreign key gets an index automatically.
- **Cascades**: explicit `onDelete` per relation. Most are `Restrict`; only audit/notification rows cascade.

### 5.2 Soft delete done right

```prisma
model Customer {
  id          String    @id @default(uuid())
  phoneE164   String    @unique
  // ...
  deletedAt   DateTime?
  @@index([deletedAt])
}
```

Service code:
```ts
findActive(id: string) {
  return prisma.customer.findFirst({ where: { id, deletedAt: null } });
}
```

We do **not** use Prisma middleware to auto-filter `deletedAt`. It's invisible magic that breaks admin queries, reports, and bug investigation. Be explicit.

### 5.3 Audit log

Single table:
```prisma
model AuditLog {
  id          String   @id @default(uuid())
  actorType   AuditActorType            // SYSTEM | CUSTOMER | STAFF
  actorId     String?
  action      String                    // e.g. "booking.cancel"
  entityType  String                    // "Booking"
  entityId    String
  before      Json?
  after       Json?
  requestId   String?
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())
  @@index([entityType, entityId])
  @@index([actorId, createdAt])
}
```

Written via an `AuditInterceptor` triggered by an `@Audit('booking.cancel')` decorator on controller methods. Sensitive fields are redacted before storage.

### 5.4 Migrations

- Authored with `prisma migrate dev` in development, committed to git.
- Applied in production via `prisma migrate deploy`, run as Railway's **pre-deploy command** — never in the app entrypoint (multi-replica race).
- **Expand/contract** rule for schema changes: never drop a column in the same deploy that stops using it. Two deploys minimum. Renaming columns is forbidden; only add-and-deprecate.

### 5.5 Connection pooling

- Backend connects via PgBouncer (transaction mode) on Railway with `?pgbouncer=true&connection_limit=1` in `DATABASE_URL`.
- `prisma migrate deploy` uses a separate `DIRECT_DATABASE_URL` bypassing PgBouncer (because migrations need session-level features pgbouncer-tx breaks).

---

## 6. API design

### 6.1 REST + OpenAPI 3.1, code-first

- DTOs (Zod schemas) → `@nestjs/swagger` + `zod-to-openapi` → `openapi.json` → typed clients.
- URI versioning: `/v1/...`.
- JSON-only request/response. No XML, no form-urlencoded except for OAuth-style endpoints.

### 6.2 URL patterns

```
GET    /v1/auth/otp/request                  body: { phone, locale }
POST   /v1/auth/otp/verify                   body: { phone, code, deviceId }
POST   /v1/auth/token/refresh                body: { refreshToken }
POST   /v1/auth/logout                       body: { refreshToken }
GET    /v1/auth/sessions
DELETE /v1/auth/sessions/:id

GET    /v1/me                                ← current customer profile
PATCH  /v1/me
DELETE /v1/me                                ← initiate account deletion
GET    /v1/me/addresses
POST   /v1/me/addresses
PATCH  /v1/me/addresses/:id
DELETE /v1/me/addresses/:id
GET    /v1/me/favorites
POST   /v1/me/favorites/:workerId
DELETE /v1/me/favorites/:workerId

GET    /v1/workers?profession=&nationality=&minSalary=&maxSalary=&sort=  ← search
GET    /v1/workers/:id

GET    /v1/services
GET    /v1/services/:id/packages

GET    /v1/offers                            ← active offers
POST   /v1/offers/validate                   body: { code, context }

POST   /v1/bookings                          headers: Idempotency-Key
GET    /v1/bookings
GET    /v1/bookings/:id
POST   /v1/bookings/:id/cancel
GET    /v1/bookings/:id/contract             ← presigned PDF URL

POST   /v1/payments/intents                  ← create PI for a booking
POST   /v1/payments/webhooks/stripe          ← Stripe webhook ingress (raw body)

GET    /v1/branches

GET    /v1/notifications
PATCH  /v1/notifications/:id/read
POST   /v1/devices                           ← register FCM token
DELETE /v1/devices/:token

POST   /v1/leads                             ← website contact form (no auth, rate-limited)

# Admin routes are prefixed /v1/admin/* and gated by JwtAuthGuard + RolesGuard
GET    /v1/admin/customers?...
GET    /v1/admin/workers?...
POST   /v1/admin/workers
PATCH  /v1/admin/workers/:id
POST   /v1/admin/workers/:id/photo           ← R2 presigned upload init
GET    /v1/admin/orders?...
POST   /v1/admin/orders/:id/transition       body: { event, note }
POST   /v1/admin/orders/:id/refund           body: { amountMinor, reason }
GET    /v1/admin/promos
POST   /v1/admin/promos
PATCH  /v1/admin/promos/:id
GET    /v1/admin/reports/revenue?from=&to=&branchId=
GET    /v1/admin/reports/orders?from=&to=&status=
GET    /v1/admin/audit?entityType=&entityId=&from=&to=
POST   /v1/admin/staff                       ← super-admin only
PATCH  /v1/admin/staff/:id
```

### 6.3 Response envelopes

**Success**: data is returned directly (no `{ data: ... }` wrapper). Pagination uses cursor-style:

```json
{
  "items": [...],
  "nextCursor": "01H7Z8..."
}
```

**Errors**: RFC 7807 `application/problem+json`:

```json
{
  "type": "https://api.mawared.example/errors/booking-worker-unavailable",
  "title": "Worker is no longer available",
  "status": 409,
  "code": "BOOKING_WORKER_UNAVAILABLE",
  "detail": "Worker w_01H... is currently reserved by another customer.",
  "instance": "/v1/bookings",
  "requestId": "01H7Z8..."
}
```

Error `code` is a closed enum exported in `packages/shared-types` so clients can switch on it.

### 6.4 Idempotency

`POST` endpoints that create resources accept `Idempotency-Key: <client-generated-uuid>`. The backend stores `(key, userId, requestHash, responseBody, statusCode, createdAt)` for 24h; a replay returns the cached response. Mismatched request body with same key returns 422.

### 6.5 Pagination

Cursor-based using ULID `id` (sortable). Default page size 20, max 100. We never use offset pagination — it gets unreliable on growing datasets.

---

## 7. Auth & security

### 7.1 OTP flow

```
1. POST /v1/auth/otp/request { phone, locale }
   - libphonenumber normalizes to E.164
   - Throttle: 1/min, 5/hour, 10/day per phone; 30/hour per IP
   - Generate 6-digit OTP, store argon2id hash in Redis:
       key = otp:<phone>, value = { hash, attempts: 0, sentAt }, TTL 5min
   - Enqueue Twilio SMS job (BullMQ)
   - Response: 204 No Content (don't leak whether the phone exists)

2. POST /v1/auth/otp/verify { phone, code, deviceId }
   - Increment attempts; if attempts > 5 → 429 + delete OTP
   - Constant-time compare argon2 hash
   - On success: delete OTP, create/find Customer, create Session(deviceId)
   - Issue access JWT + refresh token; return both

3. POST /v1/auth/token/refresh { refreshToken }
   - Look up by SHA-256 hash of the token
   - If revoked → revoke entire family (theft detection) → 401
   - If valid: rotate (mark old as rotated, insert new with parentId)
   - Return new access + new refresh
```

### 7.2 Token formats

- **Access JWT** — RS256, 15min, payload: `{ sub, role, sessionId, jti, iat, exp, iss, aud }`. Signed with a private key in `JWT_PRIVATE_KEY` env var; the public key is exposed at `/v1/.well-known/jwks.json` so admin frontends can verify without round-tripping.
- **Refresh token** — opaque 256-bit random string, base64url. Stored in DB as SHA-256 hash. Lifetime 30d. Family tree:
  ```
  refresh_tokens(id, userId, deviceId, tokenHash, family, parentId, rotatedAt, revokedAt, expiresAt, createdAt)
  ```

### 7.3 RBAC

```ts
enum Role { CUSTOMER, STAFF, BRANCH_MANAGER, SUPER_ADMIN }

@Roles(Role.STAFF, Role.BRANCH_MANAGER, Role.SUPER_ADMIN)
@Get('/admin/orders')
listOrders(@CurrentUser() actor: AdminActor, @Query() q: ListOrdersQuery) {
  // BRANCH_MANAGER is scoped to actor.branchId by the service
  return this.bookings.listForAdmin(q, actor);
}
```

Scoping (e.g. branch manager sees their branch only) lives in the service, not the guard — guards do auth, services do authz business rules.

### 7.4 Admin login

Email + password (argon2id hashed, min length 12, breach-checked against HIBP k-anonymity API on signup). **TOTP 2FA required** for any role above `STAFF`. Brute force lockout: 5 fails → 15min lock per email + per IP.

### 7.5 Defense in depth

- **TLS everywhere**, HSTS preload, secure cookies.
- **CORS** allowlist: admin and website origins only (Android uses no CORS).
- **CSRF**: not applicable for bearer-token APIs. Web admin uses `Authorization: Bearer` from in-memory state, not cookies.
- **Helmet** middleware for security headers.
- **Rate limit** via `@nestjs/throttler` globally + stricter on `/auth/*`, `/payments/webhooks/*`, `/leads`.
- **Secret rotation**: env vars in Railway; AWS Secrets Manager post-migration. Tokens have `iss` + `jwks.json` so we can rotate keys with a grace window.
- **Input validation**: every endpoint has a Zod schema. Unknown fields are stripped (`z.object().strict()` where appropriate).
- **Output sanitization**: serializers strip sensitive fields by default. PII redaction in Pino redact paths.
- **Dependency scanning**: `pnpm audit` + Dependabot + Snyk free tier.
- **Container scanning**: Trivy on every image build in CI.

---

## 8. Payments (Stripe)

### 8.1 Flow

```
1. App: POST /v1/bookings → server creates Booking (status RESERVED)
   - Acquires Postgres advisory lock on worker_id
   - Inserts Reservation(workerId, customerId, expiresAt = now + 15min)
   - Returns booking + nextStep=PAYMENT_REQUIRED

2. App: POST /v1/payments/intents { bookingId }
   - Server creates Stripe PaymentIntent with metadata.bookingId
   - Returns { clientSecret }

3. App opens Stripe Payment Sheet, customer pays.

4. Stripe → POST /v1/payments/webhooks/stripe (raw body, signature header)
   - Verify signature with constructEvent
   - Persist event to stripe_events (unique on event.id) — idempotency
   - Return 200 immediately
   - Enqueue process-stripe-event job

5. Worker processes event:
   - payment_intent.succeeded → Booking.transition(PAID) → enqueue issue-contract job
   - payment_intent.payment_failed → Booking.transition(PAYMENT_FAILED, retry allowed)
   - charge.refunded → Booking.transition(REFUNDED) → enqueue void-contract job
```

### 8.2 Webhook handling principles

- **Verify signatures** with Stripe SDK on raw body. NestJS needs the raw-body bodyParser config carved out for `/v1/payments/webhooks/stripe`.
- **Persist before processing**. `stripe_events(id PK = event.id, type, payload Json, processedAt timestamptz NULL)`. Unique on `id` → duplicates are no-ops.
- **Order-independence**. Use `event.created` and current Booking status to decide if the event is still relevant.
- **Fast 200**. We ACK in <200ms; processing happens in the worker.

### 8.3 Refunds

Initiated only from admin. Service flow:
```
admin refunds order
  → check booking status (must be PAID or COMPLETED)
  → call stripe.refunds.create with idempotency-key
  → wait for webhook to confirm
  → enqueue notification to customer
  → enqueue void-contract (if amountMinor == total)
```

### 8.4 Provider abstraction

```ts
interface PaymentProvider {
  createIntent(input: CreateIntentInput): Promise<IntentResult>;
  refund(input: RefundInput): Promise<RefundResult>;
  verifyWebhook(rawBody: Buffer, sig: string): WebhookEvent;
}
```

`StripeProvider` is the v1 implementation. `MoyasarProvider` slots in later for Mada support; the booking/refund services don't change.

---

## 9. File storage

### 9.1 R2 via AWS SDK v3

- Bucket `mawared-{env}-uploads`, region `auto`, endpoint `https://<accountid>.r2.cloudflarestorage.com`.
- Path convention: `workers/{workerId}/photo/{ulid}.jpg`, `contracts/{contractId}/v{n}.pdf`, `customers/{userId}/id/{ulid}.{ext}`.
- Server-side encryption (SSE-S3) for ID documents.
- **Direct browser/app uploads via presigned URLs**, never proxy through the API.

### 9.2 Upload flow

```
1. Client: POST /v1/files/upload-url { scope: "worker-photo", mime, sizeBytes }
   - Server validates scope + mime + size limits
   - Generates a FileObject row (status=PENDING)
   - Returns { uploadUrl, fileId, headers }
2. Client: PUT uploadUrl with bytes
3. Client: POST /v1/files/:id/finalize { meta? }
   - Server HEADs the object to confirm it exists, sets status=READY
   - Returns canonical URL
```

### 9.3 CDN

Public-read assets (worker photos, branch images) are served via Cloudflare CDN on R2's public bucket — free egress. Signed URLs for private assets (ID docs, signed contracts) — 5-min TTL.

---

## 10. Real-time & notifications

### 10.1 Push (FCM)

- Devices register their FCM token via `POST /v1/devices`. Stored on `DeviceToken(userId, token, platform, lastSeenAt, deletedAt)`. Tokens that return `NotRegistered` from FCM are soft-deleted.
- All push sends are enqueued as `send-push` BullMQ jobs. Templates live in `notifications/templates/` keyed by event name, with `{ar, en}` content.

### 10.2 In-app

- `Notification` table holds in-app messages. Created in the same job that sends the push.
- App polls `GET /v1/notifications?unreadSince=...` every 30s when on relevant screens, or on resume.
- `Notification.read` mutates via `PATCH /v1/notifications/:id/read`.

### 10.3 Email

- Transactional emails via Resend (receipts, password resets for staff). Templates in `notifications/email-templates/` as MJML compiled to HTML.

### 10.4 Channel selection

```ts
NotificationsService.send(userId, 'booking.confirmed', { bookingId }, {
  channels: ['push', 'in_app'],  // default by template
});
```

Adding WhatsApp later means adding `'whatsapp'` to channels and a `WhatsAppChannel` provider.

---

## 11. Observability

### 11.1 Structured logging

- **Pino** via `nestjs-pino` with auto-injected request context.
- JSON format only; pretty-print only in dev.
- Every log line has `requestId`, `userId?`, `route`, `method`, `statusCode`, `latencyMs`.
- Redaction paths configured up front:
  ```ts
  redact: ['req.headers.authorization', 'req.body.password', 'req.body.code', 'req.body.otp', '*.cardNumber', '*.cvc']
  ```

### 11.2 Error tracking

- **Sentry** with `release` set to git SHA, environment tag, 10% transaction sample rate.
- Sentry exception filter wraps NestJS exception filter; domain errors (4xx) aren't sent unless ≥500.
- `beforeSend` scrubs `req.body.otp`, `req.body.code`, `req.body.password`.

### 11.3 Health & readiness

- `GET /healthz` — returns 200 unconditionally. No DB call. Liveness probe.
- `GET /readyz` — checks DB + Redis + Stripe connectivity. 30s cache. Readiness probe.

### 11.4 Metrics

- Prometheus-style metrics on `/metrics` (basic auth). Bull dashboard mounted at `/admin/_bull` (super-admin only).
- Key custom metrics: `booking_state_transitions_total{from,to}`, `stripe_webhook_lag_seconds`, `otp_send_outcome_total{outcome}`.

### 11.5 Uptime + status page

- UptimeRobot pings `/healthz` from 3 regions every 5min.
- Public status page on BetterStack (free tier).

---

## 12. Background jobs (BullMQ)

| Queue | Purpose | Retry policy |
|---|---|---|
| `send-otp` | Twilio SMS dispatch | 3 retries, exp backoff, dead-letter |
| `send-push` | FCM dispatch | 5 retries, exp backoff |
| `send-email` | Resend dispatch | 5 retries, exp backoff |
| `process-stripe-event` | Async webhook processing | 10 retries, exp backoff to 6h |
| `expire-worker-reservation` | Delayed job at +15min | 3 retries |
| `issue-contract` | Generate PDF + persist | 5 retries |
| `void-contract` | Mark voided after refund | 5 retries |
| `nightly-reconciliation` | Compare bookings vs Stripe charges | 1 retry |
| `cleanup-soft-deleted` | Hard-delete past retention window | 1 retry |
| `pg-backup` | `pg_dump` → R2 | 1 retry, daily cron |

All queues use BullMQ on the same Redis. Worker process subscribes to all queues by default; we can split into specialized worker processes if any queue becomes hot.

---

## 13. Testing strategy

| Layer | Tool | Scope | Target |
|---|---|---|---|
| Unit | Vitest | Pure logic: `Booking.transition()`, `Money` math, OTP rate limiter, JWT signing | 90%+ coverage on entities + value objects |
| Integration | Vitest + Testcontainers + real Postgres | Repositories, services, controllers with test app | Cover every controller endpoint at least once |
| Contract | Schemathesis (against generated openapi.json) | API surface matches spec | Run in CI, block merges on drift |
| E2E | Playwright | Happy paths: OTP login, place order, pay (Stripe test mode), receive contract | 5–8 scenarios max |

We **do not** mock Prisma. We **do not** snapshot HTTP responses. We **do not** test getters/setters. We **do** test failure paths and edge cases on money + state machines.

Coverage thresholds in `vitest.config.ts`:
```
domain entities: 90%
services:        70%
controllers:     50% (covered by integration)
overall:         70%
```

---

## 14. CI/CD

### 14.1 GitHub Actions workflows

**`ci.yml`** (every PR):
1. Install pnpm + Node 20.
2. Cache pnpm store, Turborepo cache.
3. `pnpm install --frozen-lockfile`.
4. `pnpm turbo lint typecheck test:unit`.
5. Spin up Postgres + Redis services → `pnpm turbo test:integration`.
6. `pnpm turbo build`.
7. Trivy scan on backend image.

**`openapi-drift.yml`** (every PR touching backend):
1. Build backend.
2. Generate `openapi.json`.
3. `git diff --exit-code apps/backend/openapi.json` — fail if drifted.
4. Generate `packages/api-client-ts` and `packages/api-client-kotlin`, check for breaking diffs (warn only).

**`deploy.yml`** (push to `main` or release tag):
1. Build & push Docker image to Railway.
2. Pre-deploy: run `prisma migrate deploy` against the target DB via a one-off Railway run.
3. Deploy API + worker services.
4. Smoke test: hit `/readyz` until 200.
5. Notify Slack on success/failure.

### 14.2 Branch model

- `main` → auto-deploys to staging.
- `release/*` tags → manual promotion to production.
- Feature branches → PRs into `main` with required review + green CI.

### 14.3 Required checks before merge

- All CI green.
- 1 reviewer approval.
- No `openapi.json` drift.
- Coverage delta ≥ 0.

---

## 15. Deployment

### 15.1 Railway (v1)

Services in one Railway project:
- `api` — NestJS HTTP, autoscale on memory.
- `worker` — NestJS BullMQ consumer.
- `postgres` — Railway managed Postgres 16 plugin.
- `pgbouncer` — pooler in front of Postgres (Railway template).
- `redis` — Railway managed Redis 7.

`railway.toml`:
```toml
[deploy]
preDeployCommand = "pnpm --filter @mawared/backend prisma migrate deploy"
healthcheckPath = "/readyz"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
```

Env vars set in Railway dashboard. Secrets: `JWT_PRIVATE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `TWILIO_AUTH_TOKEN`, `FCM_SERVICE_ACCOUNT_JSON`, `R2_SECRET_ACCESS_KEY`, `SENTRY_DSN`.

### 15.2 AWS migration target (M5)

Same code, different infra:

```
Route 53 → CloudFront → ALB → ECS Fargate (api + worker tasks)
                                   ↓
                        RDS Postgres 16 (Multi-AZ)
                        ElastiCache Redis 7
                        S3 (migrated from R2) + CloudFront origin
                        SES (transactional email)
                        Secrets Manager (env)
                        CloudWatch Logs + X-Ray
```

What we do today that makes this a config change, not a rewrite:
- AWS SDK v3 S3 client (works on R2; switch endpoint to S3).
- `ConfigService` is the only thing that reads env vars; swap to Secrets Manager loader.
- No Railway-specific APIs in code.
- Pino → stdout; CloudWatch captures it.
- `prisma migrate deploy` as a CodeBuild task pre-deploy.

IaC: Terraform module per concern (`network/`, `ecs-api/`, `rds/`, `redis/`, `s3-cloudfront/`, `secrets/`). Single `main.tf` per environment composes them.

### 15.3 Dockerfile pattern

```dockerfile
# stage 1: deps
FROM node:20-alpine AS deps
RUN corepack enable
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json apps/backend/
RUN pnpm install --frozen-lockfile --filter @mawared/backend...

# stage 2: build
FROM deps AS build
COPY . .
RUN pnpm --filter @mawared/backend prisma generate
RUN pnpm --filter @mawared/backend build

# stage 3: runtime
FROM node:20-alpine AS runtime
RUN apk add --no-cache tini && addgroup -S app && adduser -S -G app app
WORKDIR /app
COPY --from=build /app/apps/backend/dist ./dist
COPY --from=build /app/apps/backend/node_modules ./node_modules
COPY --from=build /app/apps/backend/prisma ./prisma
USER app
EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
```

The same image runs the worker process with `CMD ["node", "dist/worker.js"]` overridden by Railway service config.

---

## 16. Local development

### 16.1 Setup

```bash
git clone ...
cd mawared
pnpm install
cp apps/backend/.env.example apps/backend/.env
docker compose -f infra/docker-compose.yml up -d  # postgres + redis + mailhog + stripe-mock
pnpm --filter @mawared/backend prisma migrate dev
pnpm --filter @mawared/backend prisma db seed
pnpm --filter @mawared/backend dev
```

### 16.2 Stripe webhook testing locally

```bash
stripe listen --forward-to localhost:3000/v1/payments/webhooks/stripe
```

### 16.3 Seed data

`prisma/seed.ts` is idempotent — creates a super-admin, a branch, two staff users, ten workers, a few services/packages, a promo code. Safe to re-run.

---

## 17. Cross-cutting senior-level practices

These are the small things juniors miss that compound badly. Each is enforced from day 1.

- **Structured error codes** in `packages/shared-types/error-codes.ts` shared by backend + clients.
- **Request ID propagation** via `X-Request-Id` header, attached to Pino, Sentry, downstream HTTP calls to Stripe/Twilio/FCM.
- **API versioning** in URL from day one (`/v1`).
- **Feature flags** via a `feature_flags` table + `FeatureFlagService` (in-memory 30s cache). Lets us ship dark, roll out per-customer, kill switches.
- **Time handling**: server in UTC, store `timestamptz`, render in client locale. `date-fns-tz` only.
- **Hijri dates**: `Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', …)` for display on contracts; never for business logic.
- **Content negotiation**: `Accept-Language` header → `LocaleInterceptor` → `req.locale` → response strings.
- **Money invariants**: Postgres `CHECK (amount_minor >= 0)` on every money column; nightly reconciliation job compares booking totals vs Stripe charges; Sentry alerts on drift.
- **PII boundary**: phone numbers hashed in logs (last 4 visible), ID documents encrypted at rest, no PII in error messages returned to clients.
- **Backups**: nightly `pg_dump` to R2 with 30-day retention, quarterly restore drills documented in `infra/runbooks/restore.md`.
- **Runbooks**: `infra/runbooks/` for "Stripe webhook backlog", "Redis down", "DB connection saturation", "rotate JWT keys". Living documents updated after every incident.
- **Onboarding doc**: `docs/backend/ONBOARDING.md` — a new dev should ship a one-line change to staging on day 1.

---

## 18. What this architecture deliberately does **not** include

Calling these out so we don't accidentally add them under "best practice" pressure:

- ❌ Microservices, service mesh, Kafka.
- ❌ GraphQL.
- ❌ tRPC.
- ❌ ORM-free raw SQL everywhere (Prisma is fine; targeted `$queryRaw` only when needed).
- ❌ Anemic domain models for `Booking` (entity + state machine, not just DTOs flying around).
- ❌ Class-validator (Zod instead).
- ❌ TypeORM (Prisma instead).
- ❌ XState on the backend (entity transition function instead).
- ❌ Prisma middleware for soft-delete (explicit filters).
- ❌ Floating-point money (BigInt minor units).
- ❌ Offset pagination (cursor).
- ❌ Hand-written API docs (OpenAPI-generated).

---

**Next**: read [03-SCHEMA.prisma](./03-SCHEMA.prisma).
