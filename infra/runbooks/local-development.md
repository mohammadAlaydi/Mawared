# Local development — Mawared backend

This runbook gets you from a fresh clone to a running API + worker in under five minutes.

## Prerequisites

- **Node 20.10+** — `node --version`
- **pnpm 9+** — `corepack enable && corepack prepare pnpm@9.12.0 --activate`
- **Docker Desktop** (for Postgres, Redis, Mailhog)

## First-time setup

```bash
git clone <repo>
cd mawared
pnpm install

# Backend env file
cp apps/backend/.env.example apps/backend/.env
# Fill in any third-party secrets you need (Stripe test keys, Twilio test creds, etc.)
# M0 boots fine with just DATABASE_URL and REDIS_URL.

# Start infra
pnpm infra:up        # postgres + redis + mailhog
docker compose -f infra/docker-compose.yml ps   # all healthy

# DB schema + seed
pnpm --filter @mawared/backend prisma generate
pnpm --filter @mawared/backend prisma migrate dev
pnpm --filter @mawared/backend prisma db seed
```

## Day-to-day

```bash
# Terminal 1 — API
pnpm backend:dev

# Terminal 2 — BullMQ worker
pnpm backend:worker

# Terminal 3 — Stripe webhook forwarding (only when you're touching payments)
stripe listen --forward-to localhost:3000/v1/payments/webhooks/stripe
```

API is at <http://localhost:3000>. Swagger UI at <http://localhost:3000/v1/docs>. Mailhog UI at <http://localhost:8025>.

## Smoke tests

```bash
curl localhost:3000/healthz                              # → {"ok":true,"uptimeSec":...}
curl localhost:3000/readyz                               # → 200 only when PG + Redis are up
```

## Test suites

```bash
pnpm --filter @mawared/backend test:unit         # vitest, no DB
pnpm --filter @mawared/backend test:integration  # spins Postgres via Testcontainers
pnpm --filter @mawared/backend test:e2e          # full app boot, hits real endpoints
```

## Resetting state

```bash
# Wipe and re-seed the DB (destructive — local only):
pnpm --filter @mawared/backend prisma migrate reset

# Wipe everything (containers + volumes):
docker compose -f infra/docker-compose.yml down -v
pnpm infra:up
```

## Common gotchas

- **`prisma migrate dev` hangs on shadow DB creation.** The init script under `infra/postgres-init/` creates `mawared_shadow` on first container boot. If the container existed before that script was added, recreate it: `docker compose -f infra/docker-compose.yml down -v && pnpm infra:up`.
- **`Cannot find module '@prisma/client'`.** You forgot `pnpm prisma generate` after installing.
- **OTP / Stripe / FCM env vars warn at boot.** M0 keeps them optional. They become required as you wire those features (see ROADMAP M1+).

## Where things live

- API source — `apps/backend/src/`
- Prisma schema — `apps/backend/prisma/schema.prisma`
- Migrations — `apps/backend/prisma/migrations/`
- Seed — `apps/backend/prisma/seed.ts`
- Local infra — `infra/docker-compose.yml`
- Runbooks — `infra/runbooks/`
- Docs (PRD, architecture, ADRs, state machine) — `docs/backend/`
