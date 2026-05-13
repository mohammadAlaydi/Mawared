# `@mawared/backend` — Mawared International API

NestJS 10 + Postgres 16 + Redis 7 + Stripe + Twilio + FCM. The single API serving the Android customer app, the staff admin dashboard, and the marketing website.

> **Read the docs first.** Single source of truth lives in [`docs/backend/`](../../docs/backend/). Start with [`07-IMPLEMENTATION_GUIDE.md`](../../docs/backend/07-IMPLEMENTATION_GUIDE.md) — that's the AI-handoff briefing — then `01-PRD.md`, `02-ARCHITECTURE.md`, `06-STATE_MACHINE.md`.

## Quick start

```bash
pnpm install
cp apps/backend/.env.example apps/backend/.env
pnpm infra:up                                       # postgres + redis + mailhog
pnpm --filter @mawared/backend prisma generate
pnpm --filter @mawared/backend prisma migrate dev
pnpm --filter @mawared/backend prisma db seed
pnpm backend:dev                                    # API on :3000
pnpm backend:worker                                 # in another terminal
```

Smoke test:

```bash
curl localhost:3000/healthz                         # {"ok":true,...}
curl localhost:3000/readyz                          # 200 once PG + Redis are ready
open http://localhost:3000/v1/docs                  # Swagger UI
```

See [`infra/runbooks/local-development.md`](../../infra/runbooks/local-development.md) for the longer version.

## Layout

```
apps/backend/
├── prisma/                  # schema + migrations + seed
├── src/
│   ├── main.ts              # API process entrypoint
│   ├── worker.ts            # BullMQ consumer entrypoint
│   ├── app.module.ts
│   ├── modules/             # feature modules (health, auth, orders, …)
│   ├── shared/              # config, prisma, logger, money, queues, mail, sms, push
│   └── common/              # decorators, guards, interceptors, pipes, filters
├── test/                    # unit / integration / e2e
└── openapi.json             # regenerated in CI; drift fails the build
```

## Scripts

| Script | What it does |
|---|---|
| `pnpm dev` | Watch-mode API |
| `pnpm dev:worker` | Watch-mode BullMQ consumer |
| `pnpm build` | `nest build` → `dist/` |
| `pnpm test:unit` | Vitest, no DB |
| `pnpm test:integration` | Testcontainers + Postgres |
| `pnpm prisma:migrate` | `prisma migrate dev` |
| `pnpm prisma:seed` | Idempotent dev seed |
| `pnpm openapi:generate` | Regenerate `openapi.json` |

## Conventions

- **TypeScript strict.** No `any` without an ESLint allowance.
- **Validation: Zod**, never `class-validator`.
- **Money: BigInt minor units + ISO currency.** See `src/shared/money/money.ts`.
- **Errors: RFC 7807 problem+json** with a structured `code` field from `@mawared/shared-types`.
- **State machine: pure `nextStatus()` function** in `src/modules/orders/order.entity.ts`. Side effects belong in the service.
- **Soft delete: explicit `deletedAt` filters.** No Prisma middleware.
- **Cursor pagination only.** Never offset.

Anything not covered above lives in [`docs/backend/`](../../docs/backend/). If you want to deviate, write an ADR.
