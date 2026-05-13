# Deploy — Mawared backend (Railway)

## Environments

| Name | URL | Branch | Purpose |
|---|---|---|---|
| `staging` | `https://staging.api.mawared.local` | `main` | Auto-deploys on push to main |
| `production` | `https://api.mawared.local` | manual promotion | Pinned to a tag |

## Services per environment

Each Railway environment runs five services off the same repo:

1. **api** — runs `node dist/main.js`. Healthcheck `/healthz`.
2. **worker** — runs `node dist/worker.js`. No healthcheck endpoint; Railway watches restart count.
3. **postgres** — Railway managed Postgres 16.
4. **pgbouncer** — Railway one-click PgBouncer in front of Postgres.
5. **redis** — Railway managed Redis 7.

## Pre-deploy

Railway runs `cd apps/backend && pnpm prisma migrate deploy` from `infra/railway.toml` before the new app image replaces the old one. This must use `DIRECT_DATABASE_URL` (bypass PgBouncer) — set it as a service env var.

## Required env vars per service

Pull from `apps/backend/.env.example` and set in Railway's dashboard. Sensitive vars (JWT keys, Stripe live secret, Twilio token, R2 secrets) must be marked as secrets, never printed.

For `api`:
- All app secrets
- `PORT=3000`
- `CORS_ORIGINS` — comma-separated, includes the admin dashboard and website domains.

For `worker`:
- Same secrets as `api`, minus CORS / Stripe webhook (the worker doesn't accept HTTP).

## First-time deploy

1. `railway link` to the project, then `railway environment staging`.
2. `railway up` (or push to main and let GitHub → Railway autodeploy run).
3. Confirm `/readyz` returns 200.
4. Run `pnpm --filter @mawared/backend prisma db seed` against staging once for fixtures.
5. Test endpoints listed in `docs/backend/04-ROADMAP.md` DoD for the current milestone.

## Rollback

1. In Railway, choose the previous successful deploy → "Redeploy".
2. If the rollback target is older than the latest migration, you need a **down migration** — Prisma does not generate these. Plan accordingly: prefer forward-only migrations that don't break old code (additive columns, deprecate before drop, etc.).

## On-call shortcuts

- **API 5xx spike** → Sentry → identify error class → check the relevant runbook in this folder.
- **Webhook backlog** → see `infra/runbooks/stripe-outage.md` (added in M4).
- **Postgres at capacity** → see `infra/runbooks/db-capacity.md` (added in M4).
