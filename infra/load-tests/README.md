# Load tests (k6)

Smoke + perf gates against the targets in `docs/backend/04-ROADMAP.md` §M4.

| Script | What it tests | Target |
|---|---|---|
| `workers-search.k6.js` | `GET /v1/workers` under sustained read load | 50 RPS, p95 < 400ms, err < 1% |
| `order-create.k6.js`   | `POST /v1/orders` happy path with idempotency keys | 5 RPS, p95 < 800ms |

## Run locally

```bash
# install k6 (https://k6.io/docs/get-started/installation/)
brew install k6   # macOS

# Obtain a customer JWT:
ACCESS_TOKEN=$(curl -sX POST http://localhost:3000/v1/auth/otp/verify \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+966500000000","code":"123456","deviceId":"00000000-0000-0000-0000-000000000001"}' \
  | jq -r .accessToken)

# Run a search test:
BASE_URL=http://localhost:3000 ACCESS_TOKEN=$ACCESS_TOKEN \
  k6 run infra/load-tests/workers-search.k6.js
```

## Run against staging

```bash
BASE_URL=https://staging.api.mawared.local ACCESS_TOKEN=$ACCESS_TOKEN \
  k6 run --out cloud infra/load-tests/workers-search.k6.js
```

## Acceptance gates

CI gates (M4+):

- `p95 < 400ms` on `/v1/workers`
- `p95 < 800ms` on `POST /v1/orders`
- `http_req_failed < 1%` on reads (idempotency-driven 409 excluded on writes)

If a gate fails, **don't tune blindly** — capture an EXPLAIN ANALYZE of the
slowest query, check the pg_stat_statements view, and confirm the
pg_trgm + composite indexes from `99_post_init_constraints/migration.sql`
are present.
