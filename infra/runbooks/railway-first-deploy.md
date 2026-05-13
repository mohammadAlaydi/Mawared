# Railway — first-time deploy

Companion to `deploy.md` (which assumes the Railway project already exists).
This runbook walks through standing up the **staging** environment from
scratch. Repeat the steps for **production** when you're ready.

Prerequisites:
- A Railway account with a workspace (Hobby plan is fine for staging).
- The repo pushed to GitHub (Railway integrates with GitHub).
- Local secrets ready: JWT keypair, Stripe test keys, Twilio test creds,
  Signit.sa sandbox key, Cloudflare R2 keys, FCM service-account JSON.
  See `apps/backend/.env.example` for the full list.

---

## 1. Create the project + link it to GitHub

1. Railway dashboard → **New Project** → **Deploy from GitHub repo**.
2. Pick the `mawared` repo. Railway will scan and detect the
   `railway.toml` at repo root.
3. Name the project `mawared-staging`. Don't create any services yet —
   we'll do that explicitly in the next steps so the wiring is clean.

The repo root `railway.toml` already configures:
- `builder = "DOCKERFILE"` with `dockerfilePath = "apps/backend/Dockerfile"`
- `preDeployCommand = "prisma migrate deploy --schema=prisma/schema.prisma"`
- `healthcheckPath = "/healthz"`
- Restart on failure (capped at 10 retries)

## 2. Add Postgres + Redis

In the project canvas, click **+ New** twice:

1. **Database → Postgres**. Railway provisions Postgres 16. Wait for
   "Active" status. Note the auto-generated env vars it exposes —
   we'll reference these from the api/worker services.
2. **Database → Redis**. Railway provisions Redis 7.

Optionally (recommended for production, not strictly required for
staging): add **PgBouncer** as a one-click service in front of Postgres.
See "PgBouncer wiring" at the bottom of this doc.

## 3. Create the `api` service

1. **+ New → GitHub Repo → mawared**. Name the service `api`.
2. **Settings → Source**: ensure the branch is `main` (auto-deploy on push).
3. **Settings → Build**: confirm `Dockerfile Path = apps/backend/Dockerfile`
   and the build context is the repo root. Both should be picked up from
   `railway.toml` automatically.
4. **Settings → Deploy**:
   - Start Command: leave blank (uses Dockerfile `CMD = node dist/main.js`).
   - Healthcheck Path: `/healthz`.
5. **Variables tab**: add everything from `apps/backend/.env.example`,
   substituting real values. Use Railway service references for the
   databases:
   - `DATABASE_URL` → reference `Postgres.DATABASE_URL` (will use the
     pooled URL if PgBouncer is in front; otherwise direct).
   - `DIRECT_DATABASE_URL` → reference `Postgres.DATABASE_URL` directly
     (no pooler). Used by `prisma migrate deploy`.
   - `REDIS_URL` → reference `Redis.REDIS_URL`.
   - `PORT = 3000` (Railway also injects its own `PORT`; Nest reads
     whichever you set last).
   - `NODE_ENV = production`.
   - `CORS_ORIGINS` = comma-separated list of admin + website origins.
   - `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` — paste the PEM, mark **secret**.
   - Stripe, Twilio, Signit, R2, FCM, Sentry vars as per `.env.example`.
6. **Networking → Public Networking → Generate Domain**. Railway gives
   you something like `mawared-api-staging.up.railway.app`. Add a custom
   domain later when DNS is ready.
7. Click **Deploy**. First build will take 4–8 minutes (multi-stage
   pnpm install + nest build + prisma generate).

## 4. Create the `worker` service

The worker shares the same image as `api`. Same build, different
start command.

1. **+ New → GitHub Repo → mawared** (same repo). Name it `worker`.
2. **Settings → Build**: same as api — `Dockerfile Path =
   apps/backend/Dockerfile`. Railway will reuse the build cache so this
   is fast.
3. **Settings → Deploy**:
   - **Start Command**: `node dist/worker.js` (overrides the Dockerfile
     CMD).
   - **Pre-Deploy Command**: set to empty string `""`. The api service
     already runs migrations; we don't want a race.
   - **Healthcheck Path**: leave blank. The worker has no HTTP listener
     — Railway will watch the process exit code instead.
4. **Variables tab**: copy every var from the api service **except**:
   - `CORS_ORIGINS` (worker has no HTTP)
   - `STRIPE_WEBHOOK_SECRET` (worker doesn't receive webhooks)
   - `PORT` (no listener)

   Quick way: in Railway, select all api vars → "Copy to clipboard" →
   paste into the worker service → delete the three above.

5. Click **Deploy**.

## 5. Smoke test

Once both services show "Active":

```bash
# API health (basic)
curl -fsS https://mawared-api-staging.up.railway.app/healthz
# → {"ok":true,...}

# API readiness (verifies Postgres + Redis are reachable)
curl -fsS https://mawared-api-staging.up.railway.app/readyz
# → {"ok":true,"checks":{"db":"ok","redis":"ok",...}}

# Swagger
open https://mawared-api-staging.up.railway.app/v1/docs
```

Worker readiness: check Railway logs for the api/worker service —
you should see `Mawared worker process ready`. Also confirm BullMQ
queues are draining by sending a test request that enqueues a job
(e.g., trigger an OTP send).

## 6. Seed the dev fixtures (staging only — never in prod)

```bash
# Locally, with DATABASE_URL pointing at the Railway DIRECT_DATABASE_URL:
export DATABASE_URL="$(railway variables get DIRECT_DATABASE_URL --service postgres)"
pnpm --filter @mawared/backend prisma db seed
```

## 7. Point the admin dashboard + website at the new API

In your Vercel projects for `admin-dashboard` and `website-next`:
- Set `NEXT_PUBLIC_API_BASE_URL=https://mawared-api-staging.up.railway.app`
  (or your custom domain).

Add those Vercel origins to the api service's `CORS_ORIGINS` env var
and redeploy the api.

---

## PgBouncer wiring (recommended for production)

Prisma + Postgres on serverless-ish runtimes works much better behind a
pooler. Railway has a one-click PgBouncer template:

1. **+ New → Template → Search "pgbouncer"** → deploy.
2. Set `DATABASES_HOST = ${{Postgres.PGHOST}}`, port, user, password
   from the Postgres service.
3. In the api service, change `DATABASE_URL` to reference the PgBouncer
   service URL (transaction-pooling mode, `?pgbouncer=true&connection_limit=1`).
4. **Keep `DIRECT_DATABASE_URL` pointing at Postgres directly** — Prisma
   migrations require a session connection, not a pooled one.

## Cost notes

Roughly, on Railway Hobby ($5 credit/month included):
- api service: ~$5/month at low traffic (sleeps when idle if configured).
- worker service: ~$3–5/month (lower CPU).
- Postgres: $5/month minimum.
- Redis: $5/month minimum.

Plan on ~$20–25/month for a staging environment. Production will be
2–3× depending on traffic + replica count.

## Common first-deploy failures

| Symptom | Fix |
|---|---|
| Build fails at `pnpm install` with "lockfile out of sync" | The Dockerfile uses `--frozen-lockfile=false`, but if you've added a dep locally and not committed `pnpm-lock.yaml`, push it. |
| `prisma migrate deploy` fails with "ENOENT prisma" | The runtime image must include the prisma CLI. Confirm `apps/backend/Dockerfile` runtime stage has `RUN npm i -g prisma@5.20.0`. |
| `/readyz` returns 503 with `redis: timeout` | `REDIS_URL` not set or pointing at the wrong service. Reference `${{Redis.REDIS_URL}}`. |
| Stripe webhooks return 400 "no signatures found" | `STRIPE_WEBHOOK_SECRET` not set, or you forgot to point Stripe at `https://.../v1/payments/webhooks/stripe`. |
| Worker logs say "no consumers" | The api and worker were given different `REDIS_URL`s. They must share Redis. |

## See also

- `infra/runbooks/deploy.md` — ongoing deploy / rollback workflow.
- `infra/runbooks/db-capacity.md` — when to scale Postgres.
- `infra/runbooks/jwt-key-rotation.md` — rotating signing keys.
